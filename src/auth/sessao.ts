// Sessão do usuário: tokens só no sessionStorage (somem ao fechar a aba).
import { config, type ModoAuth } from '../config';
import { criarCognito, type Cognito, type Tokens } from './cognito';

export interface Sessao {
  idToken: string;
  accessToken: string;
  refreshToken?: string;
  /** Epoch em ms em que o id token vence. */
  expiraEm: number;
  nome: string;
  email: string;
}

const CHAVE = 'prumo.sessao';
/** Renova o token quando faltar menos que isso para vencer. */
const MARGEM_MS = 60_000;

/** Lê o payload de um JWT (sem validar: quem valida é o API Gateway). */
export function lerJwt(token: string): Record<string, unknown> {
  const parte = token.split('.')[1];
  if (!parte) return {};
  try {
    const base64 = parte.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '='));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function sessaoDeTokens(t: Tokens, agora = Date.now()): Sessao {
  const claims = lerJwt(t.idToken);
  const exp = typeof claims.exp === 'number' ? claims.exp * 1000 : agora + t.expiraEmSeg * 1000;
  return {
    idToken: t.idToken,
    accessToken: t.accessToken,
    refreshToken: t.refreshToken,
    expiraEm: exp,
    nome: typeof claims.name === 'string' ? claims.name : '',
    email: typeof claims.email === 'string' ? claims.email : '',
  };
}

function armazenamento(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export interface GerenciadorSessao {
  modo: ModoAuth;
  atual(): Sessao | null;
  salvar(s: Sessao | null): void;
  /** Token para o header Authorization, renovando se estiver para vencer. */
  token(): Promise<string | null>;
  cognito: Cognito;
}

export function criarGerenciador(
  modo: ModoAuth = config.modoAuth,
  cognito: Cognito = criarCognito({
    regiao: config.cognitoRegiao,
    clientId: config.cognitoClientId,
  }),
): GerenciadorSessao {
  let renovando: Promise<Sessao | null> | null = null;

  const g: GerenciadorSessao = {
    modo,
    cognito,
    atual() {
      const bruto = armazenamento()?.getItem(CHAVE);
      if (!bruto) return null;
      try {
        return JSON.parse(bruto) as Sessao;
      } catch {
        return null;
      }
    },
    salvar(s) {
      const st = armazenamento();
      if (!st) return;
      if (s) st.setItem(CHAVE, JSON.stringify(s));
      else st.removeItem(CHAVE);
    },
    async token() {
      const s = g.atual();
      if (!s) return null;
      if (modo === 'local') return s.idToken;
      if (s.expiraEm - Date.now() > MARGEM_MS) return s.idToken;
      if (!s.refreshToken) {
        g.salvar(null);
        return null;
      }
      renovando ??= cognito
        .renovar(s.refreshToken)
        .then((t) => {
          const nova = sessaoDeTokens(t);
          g.salvar(nova);
          return nova;
        })
        .catch(() => {
          g.salvar(null);
          return null;
        })
        .finally(() => {
          renovando = null;
        });
      const nova = await renovando;
      return nova?.idToken ?? null;
    },
  };
  return g;
}

/** Sessão do modo local: a API aceita qualquer "Bearer local-<algo>". */
export function sessaoLocal(): Sessao {
  return {
    idToken: 'local-dev',
    accessToken: 'local-dev',
    expiraEm: Date.now() + 365 * 24 * 3600 * 1000,
    nome: 'Você',
    email: 'dev@localhost',
  };
}
