import { useId } from 'react';
import { formatarNumero } from '../util/formato';

/** Medidor circular da nota de energia (0 a 10), como nos mockups. */
export function Medidor({ valor, tamanho = 118 }: { valor: number; tamanho?: number }) {
  const id = useId();
  const espessura = tamanho * 0.055;
  const r = tamanho / 2 - espessura;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(10, valor));
  const meio = tamanho / 2;
  return (
    <div
      className="medidor"
      role="img"
      aria-label={`Energia do dia: ${formatarNumero(v)} de 10`}
      style={{ width: tamanho, height: tamanho }}
    >
      <svg
        width={tamanho}
        height={tamanho}
        viewBox={`0 0 ${tamanho} ${tamanho}`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#4FB38A" />
            <stop offset=".5" stopColor="#7FCFA8" />
            <stop offset="1" stopColor="#BFEBD4" />
          </linearGradient>
        </defs>
        <circle
          cx={meio}
          cy={meio}
          r={r}
          fill="none"
          stroke="rgba(246,241,231,.14)"
          strokeWidth={espessura}
        />
        <circle
          cx={meio}
          cy={meio}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeDasharray={`${(c * v) / 10} ${c}`}
          transform={`rotate(-90 ${meio} ${meio})`}
        />
      </svg>
      <div className="medidor-centro" aria-hidden="true">
        <div className="titulo medidor-valor" style={{ fontSize: tamanho * 0.32 }}>
          {formatarNumero(v)}
          <span style={{ fontSize: tamanho * 0.12 }}>/10</span>
        </div>
        <div className="rotulo medidor-rotulo">Energia</div>
      </div>
    </div>
  );
}
