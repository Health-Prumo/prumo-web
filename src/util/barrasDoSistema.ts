// Cor dos ícones da barra de status e da de navegação no app Android (prumo-mobile).
// No navegador não faz nada: só age quando o Capacitor injeta o plugin SystemBars.

/** `claro` = ícones claros (fundo esmeralda); `escuro` = ícones escuros (fundo branco). */
export type IconesDaBarra = 'claro' | 'escuro';

interface PluginSystemBars {
  setStyle(opcoes: { style: 'DARK' | 'LIGHT' }): Promise<void>;
}

function plugin(): PluginSystemBars | undefined {
  const cap = (window as { Capacitor?: { Plugins?: { SystemBars?: PluginSystemBars } } }).Capacitor;
  return cap?.Plugins?.SystemBars;
}

export function definirIconesDaBarra(icones: IconesDaBarra): void {
  // No Capacitor, DARK = conteúdo claro sobre fundo escuro.
  plugin()
    ?.setStyle({ style: icones === 'claro' ? 'DARK' : 'LIGHT' })
    .catch(() => undefined);
}
