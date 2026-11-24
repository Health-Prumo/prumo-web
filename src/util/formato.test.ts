import { describe, expect, it } from 'vitest';
import {
  dataCurta,
  dataIso,
  deIso,
  formatarHoras,
  formatarNumero,
  formatarValorHabito,
  primeiroNome,
  saudacao,
} from './formato';

describe('formatarHoras', () => {
  it('formata horas e minutos como nos mockups', () => {
    expect(formatarHoras(5 + 40 / 60)).toBe('5h40');
    expect(formatarHoras(7)).toBe('7h');
    expect(formatarHoras(0.5)).toBe('0h30');
    expect(formatarHoras(6.25)).toBe('6h15');
  });
});

describe('formatarNumero', () => {
  it('usa vírgula decimal', () => {
    expect(formatarNumero(1.6)).toBe('1,6');
    expect(formatarNumero(6.85)).toBe('6,9');
    expect(formatarNumero(2.25, 2)).toBe('2,25');
    expect(formatarNumero(8)).toBe('8');
  });
});

describe('datas', () => {
  it('gera aaaa-mm-dd local e volta', () => {
    const d = new Date(2026, 10, 4, 23, 30);
    expect(dataIso(d)).toBe('2026-11-04');
    expect(dataIso(deIso('2026-11-04'))).toBe('2026-11-04');
    expect(dataCurta('2026-11-04')).toBe('04/11');
  });

  it('saúda conforme a hora', () => {
    expect(saudacao(new Date(2026, 0, 1, 9))).toBe('Bom dia');
    expect(saudacao(new Date(2026, 0, 1, 14))).toBe('Boa tarde');
    expect(saudacao(new Date(2026, 0, 1, 21))).toBe('Boa noite');
  });
});

describe('formatarValorHabito', () => {
  it('trata horas sem unidade separada', () => {
    expect(formatarValorHabito(3 + 20 / 60, 'h')).toEqual({ valor: '3h20', unidade: '' });
    expect(formatarValorHabito(1.6, 'L')).toEqual({ valor: '1,6', unidade: 'L' });
  });
});

it('primeiroNome', () => {
  expect(primeiroNome('  Marina Alves ')).toBe('Marina');
  expect(primeiroNome('')).toBe('');
});
