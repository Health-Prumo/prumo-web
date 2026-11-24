import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErroApi } from '../api/cliente';
import type { Dia, Habito, NomeHabito } from '../api/tipos';
import { useAuth } from '../auth/AuthContext';
import { Carregando, MensagemErro } from '../components/Estado';
import { Icone } from '../components/Icone';
import { useNomeCurto } from '../components/Layout';
import { Medidor } from '../components/Medidor';
import { Selo } from '../components/Selo';
import { dataIso, dataPorExtenso, formatarValorHabito, saudacao } from '../util/formato';

const HABITOS: { chave: NomeHabito; nome: string }[] = [
  { chave: 'sono', nome: 'Sono' },
  { chave: 'atividade', nome: 'Atividade' },
  { chave: 'agua', nome: 'Água' },
  { chave: 'alimentacao', nome: 'Alimentação' },
  { chave: 'humor', nome: 'Humor' },
  { chave: 'tela', nome: 'Tela' },
];

export function Hoje() {
  const { api } = useAuth();
  const nome = useNomeCurto();
  const [dia, setDia] = useState<Dia | null>(null);
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'vazio' | 'erro'>('carregando');
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    api
      .obterDia(dataIso())
      .then((d) => {
        if (!ativo) return;
        setDia(d);
        setEstado('ok');
      })
      .catch((e: unknown) => {
        if (!ativo) return;
        if (e instanceof ErroApi && e.status === 404) return setEstado('vazio');
        setErro(e instanceof Error ? e.message : 'Erro ao carregar o seu dia.');
        setEstado('erro');
      });
    return () => {
      ativo = false;
    };
  }, [api]);

  return (
    <div className="pagina">
      <header className="cabecalho">
        <div>
          <div className="rotulo">{dataPorExtenso()}</div>
          <h1 className="titulo titulo-pagina">
            {saudacao()}
            {nome && nome !== 'Você' ? `, ${nome}` : ''}.
          </h1>
        </div>
        <Link to="/registrar" className="botao so-desktop">
          <Icone nome="registrar" />
          {dia ? 'Atualizar o dia' : 'Registrar o dia'}
        </Link>
      </header>

      {estado === 'carregando' && <Carregando texto="Buscando o seu dia…" />}
      {estado === 'erro' && <MensagemErro>{erro}</MensagemErro>}
      {estado === 'vazio' && (
        <section className="card destaque vazio">
          <div className="rotulo">Análise do seu dia</div>
          <h2 className="titulo">Como você está hoje?</h2>
          <p>Registre sono, atividade, água, alimentação, humor e tela. Leva menos de um minuto.</p>
          <Link to="/registrar" className="botao botao-claro">
            <Icone nome="ia" />
            Registrar o dia
          </Link>
        </section>
      )}
      {estado === 'ok' && dia && <SeuDia dia={dia} />}
    </div>
  );
}

function SeuDia({ dia }: { dia: Dia }) {
  const { notas, analise } = dia;
  const atividade = notas.habitos.atividade;
  return (
    <>
      <section className="card destaque resumo" aria-labelledby="titulo-analise">
        <Medidor valor={notas.energia} tamanho={124} />
        <div className="resumo-texto">
          <div className="rotulo">Análise do seu dia</div>
          <h2 id="titulo-analise" className="titulo">
            {analise.titulo}
          </h2>
          <p>{analise.resumo}</p>
          {analise.fonte === 'mock' && <p className="fonte-mock">Texto de exemplo (modo mock).</p>}
        </div>
      </section>

      {analise.sugestoes.length > 0 && (
        <section aria-labelledby="titulo-sugestoes" className="stack">
          <h2 id="titulo-sugestoes" className="rotulo">
            Sugestões para hoje
          </h2>
          <div className="sugestoes">
            {analise.sugestoes.slice(0, 2).map((s, i) => (
              <article key={i} className="card sugestao">
                <span className="ic" aria-hidden="true">
                  <Icone nome={s.habito} />
                </span>
                <div>
                  <b>{s.titulo}</b>
                  <span className="suave">{s.detalhe}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="titulo-habitos" className="stack">
        <h2 id="titulo-habitos" className="rotulo">
          Seus hábitos hoje
        </h2>
        <ul className="habitos">
          {HABITOS.map(({ chave, nome }) => (
            <CardHabito key={chave} chave={chave} nome={nome} habito={notas.habitos[chave]} />
          ))}
        </ul>
      </section>

      <section className="card meta-semana" aria-labelledby="titulo-meta">
        <div className="rotulo" id="titulo-meta">
          Meta semanal da OMS
        </div>
        <div className="meta-numero titulo">
          {Math.round(atividade.semana_min)}
          <span> / {atividade.meta_semana_min} min</span>
        </div>
        <div
          className="barra"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={atividade.meta_semana_min}
          aria-valuenow={Math.min(atividade.semana_min, atividade.meta_semana_min)}
          aria-label="Atividade física nos últimos 7 dias"
        >
          <span
            style={{
              width: `${Math.min(100, (atividade.semana_min / atividade.meta_semana_min) * 100)}%`,
            }}
          />
        </div>
        <p className="referencia">
          Atividade moderada nos últimos 7 dias (1 min vigoroso conta como 2). Referência: OMS,
          2020.
        </p>
      </section>
    </>
  );
}

function CardHabito({ chave, nome, habito }: { chave: NomeHabito; nome: string; habito: Habito }) {
  const v = formatarValorHabito(habito.valor, habito.unidade);
  return (
    <li className="card habito">
      <Icone nome={chave} />
      <div className="nome">{nome}</div>
      <div className="valor">
        {v.valor} {v.unidade && <small>{v.unidade}</small>}
      </div>
      <Selo situacao={habito.situacao} texto={habito.resumo} />
    </li>
  );
}
