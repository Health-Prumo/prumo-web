// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AvisoAtualizacao } from './AvisoAtualizacao';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Janela = { Capacitor?: unknown };

function instalarPlugin(instalar: () => Promise<void>) {
  (window as Janela).Capacitor = {
    Plugins: {
      Atualizacao: {
        verificar: vi.fn().mockResolvedValue({ disponivel: true, atual: '0.2.0', versao: '0.3.0' }),
        instalar,
      },
    },
  };
}

describe('AvisoAtualizacao', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    delete (window as Janela).Capacitor;
  });

  async function renderizar() {
    await act(async () => root.render(<AvisoAtualizacao />));
  }

  function botao(texto: string): HTMLButtonElement {
    const b = [...container.querySelectorAll('button')].find((x) => x.textContent === texto);
    if (!b) throw new Error(`botão ${texto} não encontrado`);
    return b;
  }

  it('não aparece no navegador (sem o plugin)', async () => {
    await renderizar();
    expect(container.innerHTML).toBe('');
  });

  it('mostra a versão nova e chama o instalador', async () => {
    const instalar = vi.fn().mockResolvedValue(undefined);
    instalarPlugin(instalar);
    await renderizar();
    expect(container.textContent).toContain('Nova versão do Prumo (0.3.0)');
    await act(async () => botao('Atualizar').click());
    expect(instalar).toHaveBeenCalledOnce();
  });

  it('explica a permissão quando o Android pede', async () => {
    instalarPlugin(vi.fn().mockRejectedValue({ code: 'PERMISSAO' }));
    await renderizar();
    await act(async () => botao('Atualizar').click());
    expect(container.textContent).toContain('Permita que o Prumo instale');
  });

  it('some ao tocar em "Agora não"', async () => {
    instalarPlugin(vi.fn());
    await renderizar();
    await act(async () => botao('Agora não').click());
    expect(container.innerHTML).toBe('');
  });
});
