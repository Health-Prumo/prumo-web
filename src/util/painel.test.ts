import { describe, expect, it } from 'vitest';
import type { PontoHistorico } from '../api/tipos';
import { mediaDoCampo, minutosDaSemana, sequenciaDeDias, ultimos7Dias } from './painel';

function ponto(data: string, extra: Partial<PontoHistorico> = {}): PontoHistorico {
  return {
    data,
    energia: 6,
    sono_horas: 7,
    atividade_minutos: 30,
    atividade_meta_min: 30,
    agua_litros: 2,
    alimentacao_nota: 8,
    humor: 4,
    tela_horas: 2,
    ...extra,
  };
}

// Terça, 24/11/2026, meio-dia local.
const HOJE = new Date(2026, 10, 24, 12);

describe('ultimos7Dias', () => {
  it('monta de quarta a terça, com hoje no fim', () => {
    const semana = ultimos7Dias([ponto('2026-11-20')], HOJE);
    expect(semana.map((d) => d.letra).join('')).toBe('QQSSDST');
    expect(semana[0]?.data).toBe('2026-11-18');
    expect(semana[6]).toMatchObject({ data: '2026-11-24', hoje: true, ponto: null });
    expect(semana[2]?.ponto?.data).toBe('2026-11-20');
  });
});

describe('sequenciaDeDias', () => {
  it('conta dias seguidos até hoje', () => {
    const pontos = ['2026-11-21', '2026-11-22', '2026-11-23', '2026-11-24'].map((d) => ponto(d));
    expect(sequenciaDeDias(pontos, HOJE)).toBe(4);
  });
  it('começa de ontem se hoje ainda não foi registrado', () => {
    expect(sequenciaDeDias([ponto('2026-11-22'), ponto('2026-11-23')], HOJE)).toBe(2);
  });
  it('zera quando há buraco', () => {
    expect(sequenciaDeDias([ponto('2026-11-20')], HOJE)).toBe(0);
  });
});

describe('minutosDaSemana e mediaDoCampo', () => {
  it('soma os minutos que contam para a meta e ignora dias sem registro', () => {
    const semana = ultimos7Dias(
      [ponto('2026-11-23', { atividade_meta_min: 60 }), ponto('2026-11-24', { sono_horas: 5 })],
      HOJE,
    );
    expect(minutosDaSemana(semana)).toBe(90);
    expect(mediaDoCampo(semana, 'sono_horas')).toBe(6);
    expect(mediaDoCampo(ultimos7Dias([], HOJE), 'energia')).toBeNull();
  });
});
