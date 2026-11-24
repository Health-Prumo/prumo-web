import { describe, expect, it, vi } from 'vitest';
import { criarCliente, ErroApi } from './cliente';

function resposta(status: number, corpo?: unknown): Response {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('cliente da API', () => {
  it('envia o token no header e o corpo em JSON', async () => {
    const f = vi.fn().mockResolvedValue(resposta(200, { data: '2026-11-24' }));
    const api = criarCliente({
      baseUrl: 'http://api.test/',
      obterToken: async () => 'tok',
      fetch: f,
    });
    await api.registrarDia('2026-11-24', {
      sono_horas: 7,
      sono_qualidade: 4,
      atividade_minutos: 30,
      atividade_intensidade: 'moderada',
      agua_litros: 2,
      alimentacao: { frutas_verduras: true, refeicao_caseira: true, ultraprocessados: false },
      humor: 4,
      tela_horas: 2,
    });
    const [url, init] = f.mock.calls[0]!;
    expect(url).toBe('http://api.test/dias/2026-11-24');
    expect(init.method).toBe('PUT');
    expect(init.headers.Authorization).toBe('Bearer tok');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body).sono_horas).toBe(7);
  });

  it('não manda Authorization sem token', async () => {
    const f = vi.fn().mockResolvedValue(resposta(200, { status: 'ok' }));
    const api = criarCliente({ baseUrl: 'http://x', obterToken: async () => null, fetch: f });
    await expect(api.saude()).resolves.toEqual({ status: 'ok' });
    expect(f.mock.calls[0]![1].headers.Authorization).toBeUndefined();
  });

  it('converte o erro da API em ErroApi', async () => {
    const f = vi
      .fn()
      .mockResolvedValue(resposta(404, { erro: 'dia_inexistente', mensagem: 'Sem registro.' }));
    const api = criarCliente({ baseUrl: 'http://x', obterToken: async () => 't', fetch: f });
    const erro = await api.obterDia('2026-11-24').catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(ErroApi);
    expect((erro as ErroApi).status).toBe(404);
    expect((erro as ErroApi).codigo).toBe('dia_inexistente');
    expect((erro as ErroApi).message).toBe('Sem registro.');
  });

  it('avisa quando a sessão vence (401)', async () => {
    const aoNaoAutorizado = vi.fn();
    const f = vi.fn().mockResolvedValue(resposta(401, { message: 'Unauthorized' }));
    const api = criarCliente({
      baseUrl: 'http://x',
      obterToken: async () => 't',
      aoNaoAutorizado,
      fetch: f,
    });
    await expect(api.obterPerfil()).rejects.toMatchObject({ codigo: 'nao_autorizado' });
    expect(aoNaoAutorizado).toHaveBeenCalledOnce();
  });

  it('aceita 204 sem corpo', async () => {
    const f = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const api = criarCliente({ baseUrl: 'http://x', obterToken: async () => 't', fetch: f });
    await expect(api.apagarConta()).resolves.toBeUndefined();
    expect(f.mock.calls[0]![1].method).toBe('DELETE');
  });

  it('trata falha de rede', async () => {
    const f = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const api = criarCliente({ baseUrl: 'http://x', obterToken: async () => 't', fetch: f });
    await expect(api.historico(7)).rejects.toMatchObject({ codigo: 'sem_conexao', status: 0 });
  });
});
