// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CampoSenha } from './CampoSenha';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('CampoSenha', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root.render(
        <CampoSenha
          rotulo="Senha"
          autoComplete="current-password"
          valor="segredo1"
          aoMudar={() => {}}
        />,
      );
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('começa oculta e alterna ao clicar em Mostrar', () => {
    const input = container.querySelector('input')!;
    const botao = container.querySelector('button')!;

    expect(input.type).toBe('password');
    expect(botao.getAttribute('aria-pressed')).toBe('false');
    expect(botao.textContent).toContain('Mostrar');

    act(() => botao.click());
    expect(input.type).toBe('text');
    expect(botao.getAttribute('aria-pressed')).toBe('true');
    expect(botao.textContent).toContain('Ocultar');

    act(() => botao.click());
    expect(input.type).toBe('password');
  });

  it('associa o rótulo ao campo e não envia o formulário', () => {
    const input = container.querySelector('input')!;
    const label = container.querySelector('label')!;
    expect(label.htmlFor).toBe(input.id);
    expect(container.querySelector('button')!.type).toBe('button');
  });
});
