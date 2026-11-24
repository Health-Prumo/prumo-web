import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatarHoras, formatarNumero } from '../util/formato';
import type { DiaDaSemana } from '../util/painel';

const COR = {
  sono: '#4E9E83',
  sonoHoje: '#145C48',
  energia: '#46545A',
  grade: '#E3EAE6',
  eixo: '#6E8078',
  faixa: 'rgba(29,114,89,.10)',
};

/**
 * Energia (linha, 0 a 10) e sono (barras, em horas) dos últimos 7 dias, com a faixa ideal
 * de sono. O dia de hoje fica num verde mais escuro, como no mockup.
 */
export function GraficoSemana({ semana }: { semana: DiaDaSemana[] }) {
  const dados = semana.map((d) => ({
    data: d.data,
    rotulo: d.letra,
    nome: d.nome,
    hoje: d.hoje,
    energia: d.ponto?.energia ?? null,
    sono: d.ponto?.sono_horas ?? null,
  }));

  return (
    <>
      <div className="grafico-semana" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <ComposedChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid vertical={false} stroke={COR.grade} />
            <ReferenceArea y1={7} y2={9} fill={COR.faixa} ifOverflow="extendDomain" />
            {/* As letras se repetem (Q, Q, S, S): o eixo usa a data e só exibe a letra. */}
            <XAxis
              dataKey="data"
              tickFormatter={(data: string) => dados.find((d) => d.data === data)?.rotulo ?? ''}
              tickLine={false}
              axisLine={false}
              tick={{ fill: COR.eixo, fontSize: 12 }}
            />
            <YAxis
              domain={[0, 12]}
              ticks={[0, 3, 6, 9, 12]}
              tickLine={false}
              axisLine={false}
              tick={{ fill: COR.eixo, fontSize: 11 }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(20,92,72,.06)' }}
              labelFormatter={(_, p) => String(p[0]?.payload?.nome ?? '')}
              formatter={(valor, nome) =>
                nome === 'Sono'
                  ? [formatarHoras(Number(valor)), 'Sono']
                  : [`${formatarNumero(Number(valor))}/10`, 'Energia']
              }
            />
            <Bar
              dataKey="sono"
              name="Sono"
              radius={[6, 6, 0, 0]}
              maxBarSize={34}
              isAnimationActive={false}
            >
              {dados.map((d) => (
                <Cell key={d.nome} fill={d.hoje ? COR.sonoHoje : COR.sono} />
              ))}
            </Bar>
            <Line
              dataKey="energia"
              name="Energia"
              type="monotone"
              stroke={COR.energia}
              strokeWidth={2}
              dot={{ r: 3.5, fill: '#fff', stroke: COR.energia, strokeWidth: 2 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Energia e sono nos últimos 7 dias</caption>
        <thead>
          <tr>
            <th scope="col">Dia</th>
            <th scope="col">Energia</th>
            <th scope="col">Sono</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((d) => (
            <tr key={d.nome}>
              <th scope="row">{d.nome}</th>
              <td>{d.energia === null ? 'sem registro' : `${formatarNumero(d.energia)} de 10`}</td>
              <td>{d.sono === null ? 'sem registro' : formatarHoras(d.sono)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
