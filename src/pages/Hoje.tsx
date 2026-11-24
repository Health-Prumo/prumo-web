import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErroApi } from '../api/cliente';
import type { Dia, Habito, NomeHabito, PontoHistorico, Sexo, Situacao } from '../api/tipos';
import { useAuth } from '../auth/AuthContext';
import { CoachRapido } from '../components/CoachRapido';
import { Carregando, MensagemErro } from '../components/Estado';
import { Icone, type NomeIcone } from '../components/Icone';
import { useNomeCurto } from '../components/Layout';
import { Medidor } from '../components/Medidor';
import { Selo } from '../components/Selo';
import {
  dataIso,
  dataPorExtenso,
  formatarHoras,
  formatarNumero,
  formatarValorHabito,
  saudacao,
} from '../util/formato';
import {
  mediaDoCampo,
  minutosDaSemana,
  sequenciaDeDias,
  ultimos7Dias,
  type DiaDaSemana,
} from '../util/painel';

// O Recharts é grande: o gráfico carrega depois do resto da tela.
const GraficoSemana = lazy(() =>
  import('../components/GraficoSemana').then((m) => ({ default: m.GraficoSemana })),
);

const HABITOS: { chave: NomeHabito; nome: string }[] = [
  { chave: 'sono', nome: 'Sono' },
  { chave: 'atividade', nome: 'Atividade' },
  { chave: 'agua', nome: 'Água' },
  { chave: 'alimentacao', nome: 'Alimentação' },
  { chave: 'humor', nome: 'Humor' },
  { chave: 'tela', nome: 'Tela no lazer' },
];

const META_OMS_MIN = 150;
// Metas de referência só para exibir (a nota vem da API): EFSA (água) e Vigitel (tela).
const META_AGUA_L: Record<Sexo, number> = { feminino: 2, masculino: 2.5, nao_informar: 2 };
const LIMITE_TELA_H = 3;

export function Hoje() {
  const { api } = useAuth();
  const nome = useNomeCurto();
  const [dia, setDia] = useState<Dia | null>(null);
  const [historico, setHistorico] = useState<PontoHistorico[]>([]);
  const [sexo, setSexo] = useState<Sexo>('nao_informar');
  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'erro'>('carregando');
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    Promise.all([
      api.obterDia(dataIso()).catch((e: unknown) => {
        if (e instanceof ErroApi && e.status === 404) return null;
        throw e;
      }),
      api.historico(30).then((r) => r.dias),
      api.obterPerfil().catch(() => null),
    ])
      .then(([d, h, p]) => {
        if (!ativo) return;
        setDia(d);
        setHistorico(h);
        if (p) setSexo(p.sexo);
        setEstado('pronto');
      })
      .catch((e: unknown) => {
        if (!ativo) return;
        setErro(e instanceof Error ? e.message : 'Erro ao carregar o seu dia.');
        setEstado('erro');
      });
    return () => {
      ativo = false;
    };
  }, [api]);

  const semana = useMemo(() => ultimos7Dias(historico), [historico]);
  const sequencia = useMemo(() => sequenciaDeDias(historico), [historico]);
  const temSemana = semana.some((d) => d.ponto);

  return (
    <div className="pagina hoje">
      <header className="cabecalho">
        <div>
          <div className="rotulo">{dataPorExtenso()}</div>
          <h1 className="titulo titulo-pagina">
            {saudacao()}
            {nome && nome !== 'Você' ? `, ${nome}` : ''}.
          </h1>
          {sequencia > 0 && (
            <p className="sequencia">
              <Icone nome="check" />
              {sequencia === 1 ? '1 dia registrado' : `${sequencia} dias seguidos registrando`}
            </p>
          )}
        </div>
        <Link to="/registrar" className="botao so-desktop">
          <Icone nome="registrar" />
          {dia ? 'Atualizar o dia' : 'Registrar o dia'}
        </Link>
      </header>

      {estado === 'carregando' && <Carregando texto="Buscando o seu dia…" />}
      {estado === 'erro' && <MensagemErro>{erro}</MensagemErro>}
      {estado === 'pronto' && (
        <div className="painel">
          <div className="area-analise">
            {dia ? <Analise dia={dia} semana={semana} /> : <SemRegistro />}
          </div>

          <div className="area-meta">
            <MetaSemanal semana={semana} minutos={dia?.notas.habitos.atividade.semana_min} />
          </div>

          {dia && (
            <section className="area-habitos stack" aria-labelledby="titulo-habitos">
              <h2 id="titulo-habitos" className="rotulo">
                Seus hábitos hoje
              </h2>
              <ul className="habitos">
                {HABITOS.map(({ chave, nome: n }) => (
                  <CardHabito
                    key={chave}
                    chave={chave}
                    nome={n}
                    habito={dia.notas.habitos[chave]}
                  />
                ))}
              </ul>
            </section>
          )}

          <section className="area-grafico card" aria-labelledby="titulo-grafico">
            <div className="card-cabecalho">
              <h2 id="titulo-grafico" className="titulo subtitulo">
                Últimos 7 dias
              </h2>
              <ul className="legenda" aria-hidden="true">
                <li className="legenda-energia">Energia (0 a 10)</li>
                <li className="legenda-sono">Sono (horas)</li>
              </ul>
            </div>
            {temSemana ? (
              <Suspense fallback={<Carregando texto="Montando o gráfico…" />}>
                <GraficoSemana semana={semana} />
              </Suspense>
            ) : (
              <p className="suave">Registre seus dias para ver a evolução aqui.</p>
            )}
            <div className="card-rodape">
              <p className="referencia">Faixa sombreada: sono ideal de 7 a 9 h (NSF).</p>
              <Link to="/historico" className="link-seta">
                Ver histórico completo
                <Icone nome="seta" />
              </Link>
            </div>
          </section>

          <div className="area-resumo">
            <ResumoSemana semana={semana} metaAgua={META_AGUA_L[sexo]} />
          </div>

          <div className="area-coach">
            <CoachRapido />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- análise do dia

function Analise({ dia, semana }: { dia: Dia; semana: DiaDaSemana[] }) {
  const { notas, analise } = dia;
  const anteriores = semana.filter((d) => d.ponto && !d.hoje);
  const media =
    anteriores.length > 0
      ? anteriores.reduce((s, d) => s + (d.ponto?.energia ?? 0), 0) / anteriores.length
      : null;
  const diferenca = media === null ? null : notas.energia - media;
  return (
    <section className="card destaque resumo" aria-labelledby="titulo-analise">
      <div className="resumo-medidor">
        <Medidor valor={notas.energia} tamanho={136} />
        {diferenca !== null && Math.abs(diferenca) >= 0.1 && (
          <p className="comparativo">
            {diferenca > 0 ? '▲' : '▼'} {formatarNumero(Math.abs(diferenca))}{' '}
            {diferenca > 0 ? 'acima' : 'abaixo'} da sua média
          </p>
        )}
      </div>
      <div className="resumo-texto">
        <div className="rotulo">Análise do seu dia</div>
        <h2 id="titulo-analise" className="titulo">
          {analise.titulo}
        </h2>
        <p>{analise.resumo}</p>
        {analise.sugestoes.length > 0 && (
          <>
            <h3 className="rotulo rotulo-sugestoes">Sugestões para hoje</h3>
            <ul className="sugestoes">
              {analise.sugestoes.slice(0, 2).map((s, i) => (
                <li key={i} className="sugestao">
                  <span className="ic" aria-hidden="true">
                    <Icone nome={s.habito} />
                  </span>
                  <div>
                    <b>{s.titulo}</b>
                    <span>{s.detalhe}</span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

function SemRegistro() {
  return (
    <section className="card destaque vazio">
      <div className="rotulo">Análise do seu dia</div>
      <h2 className="titulo">Como você está hoje?</h2>
      <p>
        Registre sono, atividade, água, alimentação, humor e tela. Leva menos de um minuto, e a
        análise com sugestões aparece aqui.
      </p>
      <Link to="/registrar" className="botao botao-claro">
        <Icone nome="ia" />
        Registrar o dia
      </Link>
    </section>
  );
}

// ---------------------------------------------------------------- meta da OMS

function MetaSemanal({ semana, minutos }: { semana: DiaDaSemana[]; minutos?: number }) {
  const total = Math.round(minutos ?? minutosDaSemana(semana));
  const falta = Math.max(0, META_OMS_MIN - total);
  const diasAtivos = semana.filter((d) => (d.ponto?.atividade_meta_min ?? 0) > 0).length;
  return (
    <section className="card meta-semana" aria-labelledby="titulo-meta">
      <h2 className="rotulo" id="titulo-meta">
        Meta semanal · OMS
      </h2>
      <div className="meta-numero titulo">
        {total}
        <span> / {META_OMS_MIN} min</span>
      </div>
      <p className="suave">de atividade física moderada nos últimos 7 dias</p>
      <div
        className="barra"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={META_OMS_MIN}
        aria-valuenow={Math.min(total, META_OMS_MIN)}
        aria-label="Atividade física nos últimos 7 dias"
      >
        <span style={{ width: `${Math.min(100, (total / META_OMS_MIN) * 100)}%` }} />
      </div>
      <p className="meta-falta">
        {falta > 0 ? (
          <>
            <b>Faltam {falta} min</b> · uns {Math.max(10, Math.ceil(falta / 5 / 5) * 5)} min por dia
            em 5 dias
          </>
        ) : (
          <b>Meta da semana atingida</b>
        )}
      </p>
      <ol className="dias-ativos" aria-label={`Dias com atividade: ${diasAtivos} de 7`}>
        {semana.map((d) => {
          const ativo = (d.ponto?.atividade_meta_min ?? 0) > 0;
          const texto = !d.ponto ? 'sem registro' : ativo ? 'com atividade' : 'sem atividade';
          return (
            <li
              key={d.data}
              className={[ativo && 'ativo', d.hoje && 'hoje'].filter(Boolean).join(' ')}
            >
              <span className="bolinha" aria-hidden="true">
                {ativo && <Icone nome="check" />}
              </span>
              <span aria-hidden="true">{d.letra}</span>
              <span className="sr-only">
                {d.nome}: {texto}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="referencia">
        Diretrizes da OMS (2020): 150 a 300 min por semana. 1 min vigoroso conta como 2.
      </p>
    </section>
  );
}

// ---------------------------------------------------------------- hábitos do dia

function CardHabito({ chave, nome, habito }: { chave: NomeHabito; nome: string; habito: Habito }) {
  const v = formatarValorHabito(habito.valor, habito.unidade);
  const media =
    habito.media_7d === null ? null : formatarValorHabito(habito.media_7d, habito.unidade);
  return (
    <li className="card habito">
      <span className="habito-ic" aria-hidden="true">
        <Icone nome={chave} />
      </span>
      <div className="nome">{nome}</div>
      <div className="valor">
        {v.valor} {v.unidade && <small>{v.unidade}</small>}
      </div>
      <Selo situacao={habito.situacao} texto={habito.resumo} />
      <div className="habito-rodape">
        <span className="nota-mini" aria-label={`Nota ${formatarNumero(habito.nota)} de 10`}>
          <span style={{ width: `${habito.nota * 10}%` }} />
        </span>
        <span>
          {formatarNumero(habito.nota)}/10
          {media && ` · média ${media.valor}${media.unidade ? ` ${media.unidade}` : ''}`}
        </span>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------- resumo da semana

interface ItemResumo {
  icone: NomeIcone;
  nome: string;
  valor: string;
  situacao?: Situacao;
  texto: string;
}

function ResumoSemana({ semana, metaAgua }: { semana: DiaDaSemana[]; metaAgua: number }) {
  const registrados = semana.filter((d) => d.ponto);
  if (registrados.length === 0) {
    return (
      <section className="card resumo-semana" aria-labelledby="titulo-resumo">
        <h2 id="titulo-resumo" className="titulo subtitulo">
          Resumo da semana
        </h2>
        <p className="suave">
          Quando você registrar alguns dias, os destaques da semana aparecem aqui.
        </p>
      </section>
    );
  }
  const energia = mediaDoCampo(semana, 'energia') ?? 0;
  const sono = mediaDoCampo(semana, 'sono_horas') ?? 0;
  const agua = mediaDoCampo(semana, 'agua_litros') ?? 0;
  const tela = mediaDoCampo(semana, 'tela_horas') ?? 0;
  const humor = mediaDoCampo(semana, 'humor') ?? 0;
  const melhor = registrados.reduce((a, b) =>
    (b.ponto?.energia ?? 0) > (a.ponto?.energia ?? 0) ? b : a,
  );

  const itens: ItemResumo[] = [
    {
      icone: 'hoje',
      nome: 'Energia média',
      valor: `${formatarNumero(energia)}/10`,
      texto: `Melhor dia: ${melhor.nome} (${formatarNumero(melhor.ponto?.energia ?? 0)})`,
    },
    {
      icone: 'sono',
      nome: 'Sono médio',
      valor: formatarHoras(sono),
      situacao: sono >= 7 && sono <= 9 ? 'boa' : sono >= 6 ? 'atencao' : 'alerta',
      texto:
        sono >= 7 && sono <= 9
          ? 'Na faixa de 7 a 9 h'
          : sono < 7
            ? 'Abaixo de 7 h'
            : 'Acima de 9 h',
    },
    {
      icone: 'agua',
      nome: 'Água por dia',
      valor: `${formatarNumero(agua)} L`,
      situacao: agua >= metaAgua ? 'boa' : agua >= metaAgua * 0.75 ? 'atencao' : 'alerta',
      texto:
        agua >= metaAgua
          ? `Meta de ${formatarNumero(metaAgua)} L atingida`
          : `Faltam ${formatarNumero(metaAgua - agua)} L por dia`,
    },
    {
      icone: 'tela',
      nome: 'Tela por dia',
      valor: formatarHoras(tela),
      situacao: tela < LIMITE_TELA_H ? 'boa' : tela < LIMITE_TELA_H + 1 ? 'atencao' : 'alerta',
      texto: tela < LIMITE_TELA_H ? 'Abaixo de 3 h (Vigitel)' : 'Acima de 3 h (Vigitel)',
    },
    {
      icone: 'humor',
      nome: 'Humor médio',
      valor: `${formatarNumero(humor)}/5`,
      texto: humor >= 4 ? 'Semana disposta' : humor >= 3 ? 'Semana estável' : 'Semana mais pesada',
    },
    {
      icone: 'check',
      nome: 'Dias registrados',
      valor: `${registrados.length}/7`,
      texto:
        registrados.length >= 5 ? 'Ótima constância' : 'Registre todo dia para comparar melhor',
    },
  ];

  return (
    <section className="card resumo-semana" aria-labelledby="titulo-resumo">
      <h2 id="titulo-resumo" className="titulo subtitulo">
        Resumo da semana
      </h2>
      <ul>
        {itens.map((i) => (
          <li key={i.nome}>
            <span className="habito-ic" aria-hidden="true">
              <Icone nome={i.icone} />
            </span>
            <div>
              <span className="resumo-nome">{i.nome}</span>
              <span className="resumo-valor">{i.valor}</span>
              {i.situacao ? (
                <Selo situacao={i.situacao} texto={i.texto} />
              ) : (
                <span className="resumo-texto-mini">{i.texto}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
