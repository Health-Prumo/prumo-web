import { afterEach, describe, expect, it, vi } from 'vitest';
import { definirIconesDaBarra } from './barrasDoSistema';

type JanelaComCapacitor = Window & { Capacitor?: unknown };

afterEach(() => {
  delete (window as JanelaComCapacitor).Capacitor;
});

describe('definirIconesDaBarra', () => {
  it('não faz nada no navegador', () => {
    expect(() => definirIconesDaBarra('claro')).not.toThrow();
  });

  it('pede ícones claros (DARK) e escuros (LIGHT) ao plugin do app', () => {
    const setStyle = vi.fn().mockResolvedValue(undefined);
    (window as JanelaComCapacitor).Capacitor = { Plugins: { SystemBars: { setStyle } } };

    definirIconesDaBarra('claro');
    definirIconesDaBarra('escuro');

    expect(setStyle).toHaveBeenNthCalledWith(1, { style: 'DARK' });
    expect(setStyle).toHaveBeenNthCalledWith(2, { style: 'LIGHT' });
  });
});
