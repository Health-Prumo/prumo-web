import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { criarCliente, type ClienteApi } from '../api/cliente';
import { criarGerenciador, sessaoDeTokens, sessaoLocal, type Sessao } from './sessao';

interface ValorAuth {
  sessao: Sessao | null;
  modo: 'local' | 'cognito';
  api: ClienteApi;
  entrar(email: string, senha: string): Promise<void>;
  cadastrar(nome: string, email: string, senha: string): Promise<void>;
  confirmar(email: string, codigo: string): Promise<void>;
  reenviarCodigo(email: string): Promise<void>;
  esqueciSenha(email: string): Promise<void>;
  redefinirSenha(email: string, codigo: string, novaSenha: string): Promise<void>;
  sair(): Promise<void>;
  /** Apaga os dados na API e a conta no Cognito. */
  apagarConta(): Promise<void>;
}

const Contexto = createContext<ValorAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const gerenciador = useMemo(() => criarGerenciador(), []);
  const [sessao, setSessao] = useState<Sessao | null>(() => gerenciador.atual());

  const definir = useCallback(
    (s: Sessao | null) => {
      gerenciador.salvar(s);
      setSessao(s);
    },
    [gerenciador],
  );

  const api = useMemo(
    () =>
      criarCliente({
        obterToken: () => gerenciador.token(),
        aoNaoAutorizado: () => definir(null),
      }),
    [gerenciador, definir],
  );

  const valor = useMemo<ValorAuth>(() => {
    const { cognito, modo } = gerenciador;
    return {
      sessao,
      modo,
      api,
      async entrar(email, senha) {
        if (modo === 'local') return definir(sessaoLocal());
        definir(sessaoDeTokens(await cognito.entrar(email.trim().toLowerCase(), senha)));
      },
      async cadastrar(nome, email, senha) {
        if (modo === 'local') return;
        await cognito.cadastrar(nome.trim(), email.trim().toLowerCase(), senha);
      },
      async confirmar(email, codigo) {
        if (modo === 'local') return;
        await cognito.confirmar(email.trim().toLowerCase(), codigo.trim());
      },
      async reenviarCodigo(email) {
        if (modo === 'local') return;
        await cognito.reenviarCodigo(email.trim().toLowerCase());
      },
      async esqueciSenha(email) {
        if (modo === 'local') return;
        await cognito.esqueciSenha(email.trim().toLowerCase());
      },
      async redefinirSenha(email, codigo, novaSenha) {
        if (modo === 'local') return;
        await cognito.redefinirSenha(email.trim().toLowerCase(), codigo.trim(), novaSenha);
      },
      async sair() {
        const atual = gerenciador.atual();
        definir(null);
        if (modo === 'cognito' && atual) {
          await cognito.sair(atual.accessToken).catch(() => undefined);
        }
      },
      async apagarConta() {
        await api.apagarConta();
        if (modo === 'cognito') {
          await gerenciador.token(); // renova se preciso, para o access token valer
          const atual = gerenciador.atual();
          if (atual) await cognito.apagarUsuario(atual.accessToken);
        }
        definir(null);
      },
    };
  }, [api, definir, gerenciador, sessao]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAuth(): ValorAuth {
  const v = useContext(Contexto);
  if (!v) throw new Error('useAuth fora do AuthProvider');
  return v;
}
