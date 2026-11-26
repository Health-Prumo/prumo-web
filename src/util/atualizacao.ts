// Atualização do app Android (prumo-mobile) sem desinstalar.
// No navegador não faz nada: só age quando o app injeta o plugin nativo Atualizacao.

export interface InfoAtualizacao {
  /** Há uma versão mais nova em download.healthprumo.online. */
  disponivel: boolean;
  /** Versão instalada, por exemplo "0.3.0". */
  atual: string;
  /** Versão publicada mais recente. */
  versao: string;
}

interface PluginAtualizacao {
  verificar(): Promise<InfoAtualizacao>;
  /** Baixa o APK, confere o SHA-256 e abre o instalador do Android. */
  instalar(): Promise<void>;
}

/** Código do erro quando o Android pede para permitir "instalar apps desconhecidos". */
export const SEM_PERMISSAO = 'PERMISSAO';

export function pluginAtualizacao(): PluginAtualizacao | undefined {
  const cap = (window as { Capacitor?: { Plugins?: { Atualizacao?: PluginAtualizacao } } })
    .Capacitor;
  return cap?.Plugins?.Atualizacao;
}

export function codigoDoErro(e: unknown): string {
  return typeof e === 'object' && e !== null && 'code' in e ? String(e.code) : '';
}
