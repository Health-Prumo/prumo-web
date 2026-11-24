// Cálculos da tela Hoje a partir do histórico. Só organizam o que a API já calculou:
// nenhuma nota é calculada no front.
import type { PontoHistorico } from '../api/tipos';
import { dataIso, deIso } from './formato';

export interface DiaDaSemana {
  data: string;
  /** Letra do dia da semana: D, S, T, Q, Q, S, S. */
  letra: string;
  /** Nome completo, para leitores de tela. */
  nome: string;
  ponto: PontoHistorico | null;
  hoje: boolean;
}

const LETRAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const NOMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/** Os 7 dias que terminam em `hoje` (o mais antigo primeiro), com o registro de cada um, se houver. */
export function ultimos7Dias(pontos: PontoHistorico[], hoje: Date = new Date()): DiaDaSemana[] {
  const porData = new Map(pontos.map((p) => [p.data, p]));
  const fim = deIso(dataIso(hoje));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(fim);
    d.setDate(fim.getDate() - (6 - i));
    const data = dataIso(d);
    return {
      data,
      letra: LETRAS[d.getDay()] ?? '',
      nome: NOMES[d.getDay()] ?? '',
      ponto: porData.get(data) ?? null,
      hoje: i === 6,
    };
  });
}

/** Dias seguidos com registro, contando de hoje (ou de ontem, se hoje ainda não foi registrado). */
export function sequenciaDeDias(pontos: PontoHistorico[], hoje: Date = new Date()): number {
  const datas = new Set(pontos.map((p) => p.data));
  const d = deIso(dataIso(hoje));
  if (!datas.has(dataIso(d))) d.setDate(d.getDate() - 1);
  let total = 0;
  while (datas.has(dataIso(d))) {
    total += 1;
    d.setDate(d.getDate() - 1);
  }
  return total;
}

/** Minutos que contam para a meta da OMS nos 7 dias. */
export function minutosDaSemana(semana: DiaDaSemana[]): number {
  return semana.reduce((soma, d) => soma + (d.ponto?.atividade_meta_min ?? 0), 0);
}

/** Média de um campo nos dias com registro, ou null sem registro. */
export function mediaDoCampo(
  semana: DiaDaSemana[],
  campo: 'energia' | 'sono_horas' | 'agua_litros' | 'tela_horas' | 'humor',
): number | null {
  const valores = semana.flatMap((d) => (d.ponto ? [d.ponto[campo]] : []));
  if (valores.length === 0) return null;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}
