import { config } from '../config';
import type { Dia, MensagemChat, Perfil, PontoHistorico, Registro, Sexo } from './tipos';

/** Erro devolvido pela API no formato {"erro", "mensagem"}. */
export class ErroApi extends Error {
  readonly status: number;
  readonly codigo: string;

  constructor(status: number, codigo: string, mensagem: string) {
    super(mensagem);
    this.name = 'ErroApi';
    this.status = status;
    this.codigo = codigo;
  }
}

export type ObterToken = () => Promise<string | null>;

export interface OpcoesCliente {
  baseUrl?: string;
  obterToken: ObterToken;
  /** Chamado quando a API responde 401 (sessão vencida). */
  aoNaoAutorizado?: () => void;
  fetch?: typeof fetch;
}

export function criarCliente(opcoes: OpcoesCliente) {
  const baseUrl = (opcoes.baseUrl ?? config.apiUrl).replace(/\/+$/, '');
  const f = opcoes.fetch ?? ((...args: Parameters<typeof fetch>) => fetch(...args));

  async function requisitar<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    const token = await opcoes.obterToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (corpo !== undefined) headers['Content-Type'] = 'application/json';

    let resposta: Response;
    try {
      resposta = await f(`${baseUrl}${caminho}`, {
        method: metodo,
        headers,
        body: corpo === undefined ? undefined : JSON.stringify(corpo),
      });
    } catch {
      throw new ErroApi(
        0,
        'sem_conexao',
        'Não foi possível falar com o Prumo. Confira sua conexão.',
      );
    }

    if (resposta.status === 204) return undefined as T;

    const texto = await resposta.text();
    let dados: unknown = null;
    if (texto) {
      try {
        dados = JSON.parse(texto);
      } catch {
        dados = null;
      }
    }

    if (!resposta.ok) {
      if (resposta.status === 401) opcoes.aoNaoAutorizado?.();
      const d = (dados ?? {}) as { erro?: string; mensagem?: string; message?: string };
      throw new ErroApi(
        resposta.status,
        d.erro ?? (resposta.status === 401 ? 'nao_autorizado' : 'erro_desconhecido'),
        d.mensagem ?? d.message ?? 'Algo deu errado. Tente de novo em instantes.',
      );
    }
    return dados as T;
  }

  return {
    saude: () => requisitar<{ status: string }>('GET', '/saude'),
    obterPerfil: () => requisitar<Perfil>('GET', '/perfil'),
    salvarPerfil: (sexo: Sexo) =>
      requisitar<Perfil>('PUT', '/perfil', { sexo, consentimento_aceito: true }),
    registrarDia: (data: string, registro: Registro) =>
      requisitar<Dia>('PUT', `/dias/${encodeURIComponent(data)}`, registro),
    obterDia: (data: string) => requisitar<Dia>('GET', `/dias/${encodeURIComponent(data)}`),
    historico: (dias: number) =>
      requisitar<{ dias: PontoHistorico[] }>('GET', `/historico?dias=${dias}`),
    mensagensChat: () => requisitar<{ mensagens: MensagemChat[] }>('GET', '/chat'),
    enviarChat: (mensagem: string) =>
      requisitar<{ resposta: string; fonte: 'mock' | 'bedrock' }>('POST', '/chat', { mensagem }),
    exportar: () => requisitar<unknown>('GET', '/exportar'),
    apagarConta: () => requisitar<void>('DELETE', '/conta'),
  };
}

export type ClienteApi = ReturnType<typeof criarCliente>;
