import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ErroApi } from '../api/cliente';
import type { Alimentacao, Intensidade, Registro } from '../api/tipos';
import { useAuth } from '../auth/AuthContext';
import { Carregando, MensagemErro } from '../components/Estado';
import { Icone, type NomeIcone } from '../components/Icone';
import { dataIso, formatarHoras, formatarNumero } from '../util/formato';

export const LITROS_POR_COPO = 0.25;
const TOTAL_COPOS = 12;

const PADRAO: Registro = {
  sono_horas: 7,
  sono_qualidade: 3,
  atividade_minutos: 0,
  atividade_intensidade: 'moderada',
  agua_litros: 1.5,
  alimentacao: { frutas_verduras: false, refeicao_caseira: false, ultraprocessados: false },
  humor: 3,
  tela_horas: 2,
};

type Secao = 'sono' | 'atividade' | 'agua' | 'alimentacao' | 'humor' | 'tela';
const SECOES: Secao[] = ['sono', 'atividade', 'agua', 'alimentacao', 'humor', 'tela'];

const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function Registrar() {
  const { api } = useAuth();
  const navegar = useNavigate();
  const hoje = dataIso();
  const [r, setR] = useState<Registro>(PADRAO);
  const [tocados, setTocados] = useState<Set<Secao>>(new Set());
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    api
      .obterDia(hoje)
      .then((d) => {
        if (!ativo) return;
        setR(d.registro);
        setTocados(new Set(SECOES));
      })
      .catch((e: unknown) => {
        if (ativo && !(e instanceof ErroApi && e.status === 404)) {
          setErro(e instanceof Error ? e.message : 'Erro ao carregar.');
        }
      })
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [api, hoje]);

  function mudar<K extends keyof Registro>(secao: Secao, campo: K, valor: Registro[K]) {
    setR((atual) => ({ ...atual, [campo]: valor }));
    setTocados((t) => new Set(t).add(secao));
  }

  function mudarAlimentacao(campo: keyof Alimentacao) {
    setR((a) => ({ ...a, alimentacao: { ...a.alimentacao, [campo]: !a.alimentacao[campo] } }));
    setTocados((t) => new Set(t).add('alimentacao'));
  }

  async function enviar() {
    setErro('');
    setEnviando(true);
    try {
      await api.registrarDia(hoje, r);
      navegar('/', { replace: true });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível gerar a análise.');
      setEnviando(false);
    }
  }

  if (carregando) return <Carregando />;

  const copos = Math.round(r.agua_litros / LITROS_POR_COPO);

  return (
    <div className="pagina registrar">
      <header className="topo-reg">
        <Link to="/" className="voltar" aria-label="Voltar para Hoje">
          <Icone nome="voltar" />
        </Link>
        <div>
          <div className="rotulo">Leva menos de 1 minuto</div>
          <h1 className="titulo titulo-reg">Registrar o dia</h1>
        </div>
      </header>
      <div
        className="progresso"
        role="progressbar"
        aria-label="Hábitos preenchidos"
        aria-valuemin={0}
        aria-valuemax={6}
        aria-valuenow={tocados.size}
      >
        {SECOES.map((s) => (
          <span key={s} className={tocados.has(s) ? 'ok' : ''} />
        ))}
      </div>

      <div className="campos">
        <Campo icone="sono" titulo="Sono" direita={formatarHoras(r.sono_horas)}>
          <Stepper
            rotulo="Horas dormidas"
            texto={formatarHoras(r.sono_horas)}
            menos={() => mudar('sono', 'sono_horas', limitar(r.sono_horas - 0.25, 0, 16))}
            mais={() => mudar('sono', 'sono_horas', limitar(r.sono_horas + 0.25, 0, 16))}
          />
          <Escolha
            legenda="Qualidade do sono (1 = ruim, 5 = ótima)"
            nome="sono_qualidade"
            opcoes={[1, 2, 3, 4, 5].map((n) => ({ valor: n, rotulo: String(n) }))}
            valor={r.sono_qualidade}
            aoMudar={(v) => mudar('sono', 'sono_qualidade', v)}
            classe="rostos"
          />
        </Campo>

        <Campo icone="atividade" titulo="Atividade física" direita={`${r.atividade_minutos} min`}>
          <Stepper
            rotulo="Minutos de atividade"
            texto={`${r.atividade_minutos} min`}
            menos={() =>
              mudar('atividade', 'atividade_minutos', limitar(r.atividade_minutos - 5, 0, 600))
            }
            mais={() =>
              mudar('atividade', 'atividade_minutos', limitar(r.atividade_minutos + 5, 0, 600))
            }
          />
          <Escolha<Intensidade>
            legenda="Intensidade"
            nome="intensidade"
            opcoes={[
              { valor: 'leve', rotulo: 'Leve' },
              { valor: 'moderada', rotulo: 'Moderada' },
              { valor: 'vigorosa', rotulo: 'Vigorosa' },
            ]}
            valor={r.atividade_intensidade}
            aoMudar={(v) => mudar('atividade', 'atividade_intensidade', v)}
            classe="segmentos"
          />
        </Campo>

        <Campo
          icone="agua"
          titulo="Água"
          direita={`${copos} ${copos === 1 ? 'copo' : 'copos'} · ${formatarNumero(r.agua_litros, 2)} L`}
        >
          <div className="copos" role="group" aria-label="Copos de 250 mL">
            {Array.from({ length: TOTAL_COPOS }, (_, i) => {
              const n = i + 1;
              const cheio = n <= copos;
              return (
                <button
                  key={n}
                  type="button"
                  className={`copo ${cheio ? 'on' : ''}`}
                  aria-label={`${n} ${n === 1 ? 'copo' : 'copos'} (${formatarNumero(n * LITROS_POR_COPO, 2)} L)`}
                  aria-pressed={cheio}
                  onClick={() =>
                    mudar('agua', 'agua_litros', (n === copos ? n - 1 : n) * LITROS_POR_COPO)
                  }
                >
                  <Icone nome="agua" />
                </button>
              );
            })}
          </div>
          <p className="dica">Cada copo = 250 mL. Toque no último copo cheio para tirar um.</p>
        </Campo>

        <Campo icone="alimentacao" titulo="Alimentação" direita="Guia Alimentar">
          <div className="chips" role="group" aria-label="O que teve hoje">
            {(
              [
                ['frutas_verduras', 'Frutas e verduras'],
                ['refeicao_caseira', 'Refeição caseira'],
                ['ultraprocessados', 'Ultraprocessados'],
              ] as const
            ).map(([campo, rotulo]) => (
              <button
                key={campo}
                type="button"
                className={`chip ${r.alimentacao[campo] ? 'on' : ''}`}
                aria-pressed={r.alimentacao[campo]}
                onClick={() => mudarAlimentacao(campo)}
              >
                {r.alimentacao[campo] && <Icone nome="check" />}
                {rotulo}
              </button>
            ))}
          </div>
        </Campo>

        <Campo icone="humor" titulo="Humor e energia">
          <Escolha
            legenda="Como você se sente (1 = sem energia, 5 = disposto)"
            nome="humor"
            opcoes={[1, 2, 3, 4, 5].map((n) => ({ valor: n, rotulo: String(n) }))}
            valor={r.humor}
            aoMudar={(v) => mudar('humor', 'humor', v)}
            classe="rostos"
          />
        </Campo>

        <Campo icone="tela" titulo="Tela no lazer" direita={formatarHoras(r.tela_horas)} destaque>
          <input
            type="range"
            className="deslizante"
            min={0}
            max={12}
            step={0.25}
            value={r.tela_horas}
            aria-label="Horas de tela no lazer"
            aria-valuetext={formatarHoras(r.tela_horas)}
            onChange={(e) => mudar('tela', 'tela_horas', Number(e.target.value))}
          />
          <div className="escala" aria-hidden="true">
            <span>0 h</span>
            <span>6 h</span>
            <span>12 h</span>
          </div>
        </Campo>
      </div>

      {erro && <MensagemErro>{erro}</MensagemErro>}
      <button
        type="button"
        className="botao acao largo"
        onClick={() => void enviar()}
        disabled={enviando}
      >
        <Icone nome="ia" />
        {enviando ? 'Gerando sua análise…' : 'Gerar minha análise'}
      </button>
    </div>
  );
}

function Campo({
  icone,
  titulo,
  direita,
  destaque,
  children,
}: {
  icone: NomeIcone;
  titulo: string;
  direita?: string;
  destaque?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="card campo" aria-label={titulo}>
      <div className="cab">
        <Icone nome={icone} />
        {titulo}
        {direita && <span className={`dir ${destaque ? 'valor' : ''}`}>{direita}</span>}
      </div>
      {children}
    </section>
  );
}

function Stepper({
  rotulo,
  texto,
  menos,
  mais,
}: {
  rotulo: string;
  texto: string;
  menos: () => void;
  mais: () => void;
}) {
  return (
    <div className="stepper">
      <button type="button" className="bt" onClick={menos} aria-label={`Diminuir ${rotulo}`}>
        −
      </button>
      <span className="num" aria-live="polite" aria-label={`${rotulo}: ${texto}`}>
        {texto}
      </span>
      <button type="button" className="bt" onClick={mais} aria-label={`Aumentar ${rotulo}`}>
        +
      </button>
    </div>
  );
}

function Escolha<T extends string | number>({
  legenda,
  nome,
  opcoes,
  valor,
  aoMudar,
  classe,
}: {
  legenda: string;
  nome: string;
  opcoes: { valor: T; rotulo: string }[];
  valor: T;
  aoMudar: (v: T) => void;
  classe: string;
}) {
  return (
    <fieldset className="grupo">
      <legend className="dica">{legenda}</legend>
      <div className={classe}>
        {opcoes.map((o) => (
          <label key={String(o.valor)} className={`segmento ${valor === o.valor ? 'on' : ''}`}>
            <input
              type="radio"
              name={nome}
              className="sr-only"
              checked={valor === o.valor}
              onChange={() => aoMudar(o.valor)}
            />
            {o.rotulo}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
