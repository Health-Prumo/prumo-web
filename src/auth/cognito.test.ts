import { describe, expect, it, vi } from 'vitest';
import { criarCognito, ErroCognito } from './cognito';

const json = (status: number, corpo: unknown) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } });

describe('Cognito', () => {
  it('faz login com USER_PASSWORD_AUTH no endpoint regional', async () => {
    const f = vi.fn().mockResolvedValue(
      json(200, {
        AuthenticationResult: {
          IdToken: 'id',
          AccessToken: 'ac',
          RefreshToken: 're',
          ExpiresIn: 3600,
        },
      }),
    );
    const c = criarCognito({ regiao: 'us-east-1', clientId: 'cli', fetch: f });
    const t = await c.entrar('a@b.com', 'Senha123');
    expect(t).toEqual({ idToken: 'id', accessToken: 'ac', refreshToken: 're', expiraEmSeg: 3600 });
    const [url, init] = f.mock.calls[0]!;
    expect(url).toBe('https://cognito-idp.us-east-1.amazonaws.com/');
    expect(init.headers['X-Amz-Target']).toBe('AWSCognitoIdentityProviderService.InitiateAuth');
    expect(init.headers['Content-Type']).toBe('application/x-amz-json-1.1');
    const corpo = JSON.parse(init.body);
    expect(corpo.AuthFlow).toBe('USER_PASSWORD_AUTH');
    expect(corpo.ClientId).toBe('cli');
    expect(corpo.AuthParameters).toEqual({ USERNAME: 'a@b.com', PASSWORD: 'Senha123' });
  });

  it('mantém o refresh token ao renovar', async () => {
    const f = vi.fn().mockResolvedValue(
      json(200, {
        AuthenticationResult: { IdToken: 'id2', AccessToken: 'ac2', ExpiresIn: 3600 },
      }),
    );
    const c = criarCognito({ regiao: 'us-east-1', clientId: 'cli', fetch: f });
    const t = await c.renovar('re');
    expect(t.refreshToken).toBe('re');
    expect(JSON.parse(f.mock.calls[0]![1].body).AuthFlow).toBe('REFRESH_TOKEN_AUTH');
  });

  it('cadastra com nome e e-mail', async () => {
    const f = vi.fn().mockResolvedValue(json(200, { UserConfirmed: false }));
    const c = criarCognito({ regiao: 'us-east-1', clientId: 'cli', fetch: f });
    await c.cadastrar('Marina', 'm@x.com', 'Senha123');
    const corpo = JSON.parse(f.mock.calls[0]![1].body);
    expect(corpo.UserAttributes).toEqual([
      { Name: 'email', Value: 'm@x.com' },
      { Name: 'name', Value: 'Marina' },
    ]);
  });

  it('traduz erros do Cognito', async () => {
    const f = vi.fn().mockResolvedValue(
      json(400, {
        __type: 'com.amazonaws#NotAuthorizedException',
        message: 'Incorrect username or password.',
      }),
    );
    const c = criarCognito({ regiao: 'us-east-1', clientId: 'cli', fetch: f });
    const e = await c.entrar('a@b.com', 'x').catch((err: unknown) => err);
    expect(e).toBeInstanceOf(ErroCognito);
    expect((e as ErroCognito).codigo).toBe('NotAuthorizedException');
    expect((e as ErroCognito).message).toBe('E-mail ou senha incorretos.');
  });

  it('exige client id configurado', async () => {
    const c = criarCognito({ regiao: 'us-east-1', clientId: '', fetch: vi.fn() });
    await expect(c.entrar('a', 'b')).rejects.toMatchObject({ codigo: 'SemConfiguracao' });
  });
});
