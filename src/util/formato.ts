// Formatação em pt-BR usada nas telas.

/** 5.6667 -> "5h40"; 7 -> "7h"; 0.5 -> "0h30". */
export function formatarHoras(horas: number): string {
  const totalMin = Math.round(horas * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

/** 1.6 -> "1,6"; 6.85 (1 casa) -> "6,9". */
export function formatarNumero(valor: number, casas = 1): string {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: casas,
  });
}

/** Data local (não UTC) no formato aaaa-mm-dd. */
export function dataIso(d: Date = new Date()): string {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/** "2026-11-24" -> Date ao meio-dia local (evita troca de dia por fuso). */
export function deIso(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a ?? 1970, (m ?? 1) - 1, d ?? 1, 12);
}

/** "Terça, 24 de novembro". */
export function dataPorExtenso(d: Date = new Date()): string {
  const semana = d.toLocaleDateString('pt-BR', { weekday: 'long' }).replace('-feira', '');
  const resto = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
  return `${semana.charAt(0).toUpperCase()}${semana.slice(1)}, ${resto}`;
}

/** "24/11" para eixos de gráfico. */
export function dataCurta(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

export function saudacao(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 5) return 'Boa noite';
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** Valor de um hábito com unidade, como nos mockups. */
export function formatarValorHabito(
  valor: number,
  unidade: string,
): { valor: string; unidade: string } {
  if (unidade === 'h') return { valor: formatarHoras(valor), unidade: '' };
  return { valor: formatarNumero(valor), unidade };
}

export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? '';
}
