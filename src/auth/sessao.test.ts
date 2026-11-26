import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErroCognito, type Cognito } from './cognito';
import { criarGerenciador, lerJwt, sessaoDeTokens, sessaoLocal } from './sessao';

function jwt(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) =>
    btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(o))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${b64({ alg: 'none' })}.${b64(payload)}.sig`;
}

function cognitoFalso(renovar = vi.fn()): Cognito {
  return { renovar } as unknown as Cognito;
}

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

describe('lerJwt', () => {
  it('lê claims com acentos', () => {
    expect(lerJwt(jwt({ name: 'João', exp: 10 }))).toEqual({ name: 'João', exp: 10 });
    expect(lerJwt('lixo')).toEqual({});
  });
});

describe('gerenciador de sessão', () => {
  it('modo local usa o token local-dev', async () => {
    const g = criarGerenciador('local', cognitoFalso());
    expect(await g.token()).toBeNull();
    g.salvar(sessaoLocal());
    expect(await g.token()).toBe('local-dev');
  });

  it('usa o id token enquanto válido e guarda no localStorage', async () => {
    const id = jwt({ exp: Math.floor(Date.now() / 1000) + 3600, name: 'Ana', email: 'a@x.com' });
    const s = sessaoDeTokens({
      idToken: id,
      accessToken: 'ac',
      refreshToken: 're',
      expiraEmSeg: 3600,
    });
    expect(s.nome).toBe('Ana');
    const renovar = vi.fn();
    const g = criarGerenciador('cognito', cognitoFalso(renovar));
    g.salvar(s);
    expect(await g.token()).toBe(id);
    expect(renovar).not.toHaveBeenCalled();
    expect(localStorage.getItem('prumo.sessao')).toContain('"nome":"Ana"');
    expect(sessionStorage.length).toBe(0);
    // Um gerenciador novo (app reaberto) encontra a mesma sessão.
    expect(criarGerenciador('cognito', cognitoFalso()).atual()?.nome).toBe('Ana');
    g.salvar(null);
    expect(localStorage.getItem('prumo.sessao')).toBeNull();
  });

  it('renova uma vez só quando o token vence', async () => {
    const velho = jwt({ exp: Math.floor(Date.now() / 1000) - 10 });
    const novo = jwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
    const renovar = vi.fn().mockResolvedValue({
      idToken: novo,
      accessToken: 'ac2',
      refreshToken: 're',
      expiraEmSeg: 3600,
    });
    const g = criarGerenciador('cognito', cognitoFalso(renovar));
    g.salvar(
      sessaoDeTokens({ idToken: velho, accessToken: 'ac', refreshToken: 're', expiraEmSeg: 0 }),
    );
    const [a, b] = await Promise.all([g.token(), g.token()]);
    expect(a).toBe(novo);
    expect(b).toBe(novo);
    expect(renovar).toHaveBeenCalledOnce();
    expect(g.atual()?.accessToken).toBe('ac2');
  });

  it('encerra a sessão se a renovação falhar', async () => {
    const velho = jwt({ exp: Math.floor(Date.now() / 1000) - 10 });
    const g = criarGerenciador('cognito', cognitoFalso(vi.fn().mockRejectedValue(new Error('x'))));
    g.salvar(
      sessaoDeTokens({ idToken: velho, accessToken: 'ac', refreshToken: 're', expiraEmSeg: 0 }),
    );
    expect(await g.token()).toBeNull();
    expect(g.atual()).toBeNull();
  });

  it('migra a sessão antiga do sessionStorage', () => {
    sessionStorage.setItem('prumo.sessao', JSON.stringify(sessaoLocal()));
    const g = criarGerenciador('local', cognitoFalso());
    expect(g.atual()?.idToken).toBe('local-dev');
    expect(sessionStorage.getItem('prumo.sessao')).toBeNull();
    expect(localStorage.getItem('prumo.sessao')).not.toBeNull();
  });

  it('mantém a sessão se a renovação falhar por falta de conexão', async () => {
    const velho = jwt({ exp: Math.floor(Date.now() / 1000) - 10 });
    const erro = new ErroCognito('SemConexao', 'sem rede');
    const g = criarGerenciador('cognito', cognitoFalso(vi.fn().mockRejectedValue(erro)));
    g.salvar(
      sessaoDeTokens({ idToken: velho, accessToken: 'ac', refreshToken: 're', expiraEmSeg: 0 }),
    );
    expect(await g.token()).toBeNull();
    expect(g.atual()?.refreshToken).toBe('re');
  });
});
