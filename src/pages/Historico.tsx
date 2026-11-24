import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { PontoHistorico } from '../api/tipos';
import { useAuth } from '../auth/AuthContext';
import { Carregando, MensagemErro } from '../components/Estado';
import { dataCurta, formatarHoras, formatarNumero } from '../util/formato';

const COR = {
  barra: '#4E9E83',
  linha: '#46545A',
  grade: '#E3EAE6',
  eixo: '#6E8078',
  faixa: 'rgba(29,114,89,.10)',
};

type Campo = Exclude<keyof PontoHistorico, 'data'>;

interface Serie {
  campo: Campo;
  titulo: string;
  descricao: string;
  tipo: 'linha' | 'barra';
  dominio?: [number, number];
  formatar: (v: number) => string;
  faixa?: [number, number];
  faixaTexto?: string;
}

const SERIES: Serie[] = [
  {
    campo: 'energia',
    titulo: 'Energia',
    descricao: 'Nota de energia do dia, de 0 a 10.',
    tipo: 'linha',
    dominio: [0, 10],
    formatar: (v) => `${formatarNumero(v)}/10`,
  },
  {
    campo: 'sono_horas',
    titulo: 'Sono',
    descricao: 'Horas dormidas. Faixa ideal para adultos: 7 a 9 h (National Sleep Foundation).',
    tipo: 'barra',
    formatar: formatarHoras,
    faixa: [7, 9],
    faixaTexto: 'faixa ideal · 7 a 9 h',
  },
  {
    campo: 'atividade_minutos',
    titulo: 'Atividade física',
    descricao: 'Minutos de atividade por dia.',
    tipo: 'barra',
    formatar: (v) => `${Math.round(v)} min`,
  },
  {
    campo: 'agua_litros',
    titulo: 'Água',
    descricao: 'Litros por dia.',
    tipo: 'barra',
    formatar: (v) => `${formatarNumero(v, 2)} L`,
  },
  {
    campo: 'tela_horas',
    titulo: 'Tela no lazer',
    descricao: 'Horas de tela no tempo livre.',
    tipo: 'barra',
    formatar: formatarHoras,
  },
];

export function Historico() {
  const { api } = useAuth();
  const [periodo, setPeriodo] = useState<7 | 30>(7);
  const [dias, setDias] = useState<PontoHistorico[] | null>(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    setDias(null);
    setErro('');
    api
      .historico(periodo)
      .then((r) => ativo && setDias(r.dias))
      .catch(
        (e: unknown) => ativo && setErro(e instanceof Error ? e.message : 'Erro ao carregar.'),
      );
    return () => {
      ativo = false;
    };
  }, [api, periodo]);

  return (
    <div className="pagina">
      <header className="cabecalho">
        <div>
          <div className="rotulo">Sua evolução</div>
          <h1 className="titulo titulo-pagina">Histórico</h1>
        </div>
        <div className="segmentos periodo" role="radiogroup" aria-label="Período">
          {([7, 30] as const).map((p) => (
            <label key={p} className={`segmento ${periodo === p ? 'on' : ''}`}>
              <input
                type="radio"
                name="periodo"
                className="sr-only"
                checked={periodo === p}
                onChange={() => setPeriodo(p)}
              />
              {p} dias
            </label>
          ))}
        </div>
      </header>

      {erro && <MensagemErro>{erro}</MensagemErro>}
      {!erro && !dias && <Carregando />}
      {dias && dias.length === 0 && (
        <div className="card vazio-claro">
          <p>Ainda não há registros neste período.</p>
          <Link to="/registrar" className="botao">
            Registrar o dia
          </Link>
        </div>
      )}
      {dias && dias.length > 0 && (
        <div className="graficos">
          {SERIES.map((s) => (
            <Grafico key={s.campo} serie={s} dias={dias} />
          ))}
        </div>
      )}
    </div>
  );
}

function Grafico({ serie, dias }: { serie: Serie; dias: PontoHistorico[] }) {
  const dados = dias.map((d) => ({ data: dataCurta(d.data), valor: d[serie.campo] }));
  const media = dados.reduce((s, d) => s + d.valor, 0) / dados.length;
  const idTitulo = `graf-${serie.campo}`;

  return (
    <section className="card grafico" aria-labelledby={idTitulo}>
      <div className="grafico-cab">
        <h2 id={idTitulo} className="titulo">
          {serie.titulo}
        </h2>
        <span className="suave pequeno">média: {serie.formatar(media)}</span>
      </div>
      <p className="suave pequeno">{serie.descricao}</p>
      <figure
        className="grafico-area"
        role="img"
        aria-label={`${serie.titulo}: média de ${serie.formatar(media)} em ${dados.length} dias. Valores na tabela abaixo.`}
      >
        <ResponsiveContainer width="100%" height={200}>
          {serie.tipo === 'linha' ? (
            <LineChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid stroke={COR.grade} vertical={false} />
              <XAxis dataKey="data" tick={{ fill: COR.eixo, fontSize: 11 }} tickLine={false} />
              <YAxis
                domain={serie.dominio}
                tick={{ fill: COR.eixo, fontSize: 11 }}
                tickLine={false}
              />
              <Tooltip formatter={(v) => [serie.formatar(Number(v)), serie.titulo]} />
              <Line
                type="monotone"
                dataKey="valor"
                stroke={COR.linha}
                strokeWidth={2.4}
                dot={{ r: 3, fill: '#FFFFFF', stroke: COR.linha, strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          ) : (
            <BarChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid stroke={COR.grade} vertical={false} />
              {serie.faixa && (
                <ReferenceArea
                  y1={serie.faixa[0]}
                  y2={serie.faixa[1]}
                  fill={COR.faixa}
                  label={{
                    value: serie.faixaTexto,
                    position: 'insideTopRight',
                    fill: '#1D7259',
                    fontSize: 10,
                  }}
                />
              )}
              <XAxis dataKey="data" tick={{ fill: COR.eixo, fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: COR.eixo, fontSize: 11 }} tickLine={false} />
              <Tooltip formatter={(v) => [serie.formatar(Number(v)), serie.titulo]} />
              <Bar
                dataKey="valor"
                fill={COR.barra}
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </figure>
      <details className="tabela-alt">
        <summary>Ver valores em tabela</summary>
        <table>
          <caption className="sr-only">{serie.titulo} por dia</caption>
          <thead>
            <tr>
              <th scope="col">Dia</th>
              <th scope="col">{serie.titulo}</th>
            </tr>
          </thead>
          <tbody>
            {dados.map((d) => (
              <tr key={d.data}>
                <td>{d.data}</td>
                <td>{serie.formatar(d.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
