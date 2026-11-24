import type { Situacao } from '../api/tipos';

const CLASSE: Record<Situacao, string> = { boa: 'positivo', atencao: 'atencao', alerta: 'critico' };

/** Selo de situação: sempre com texto, nunca só a cor (WCAG 1.4.1). */
export function Selo({ situacao, texto }: { situacao: Situacao; texto: string }) {
  return <span className={`selo ${CLASSE[situacao]}`}>{texto}</span>;
}
