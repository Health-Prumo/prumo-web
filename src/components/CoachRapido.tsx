import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { MensagemChat } from '../api/tipos';
import { useAuth } from '../auth/AuthContext';
import { Icone } from './Icone';

/** Corta respostas longas no card; a conversa completa fica na tela do Coach. */
function resumir(texto: string, limite = 240): string {
  if (texto.length <= limite) return texto;
  const corte = texto.lastIndexOf(' ', limite);
  return `${texto.slice(0, corte > 0 ? corte : limite)}…`;
}

const ATALHOS = ['Como foi minha semana?', 'Por que estou cansado?', 'Dicas para dormir melhor'];

/** Card do Coach na tela Hoje: última conversa, atalhos e um campo que abre o chat com a pergunta. */
export function CoachRapido() {
  const { api } = useAuth();
  const navegar = useNavigate();
  const [ultimas, setUltimas] = useState<MensagemChat[]>([]);
  const [texto, setTexto] = useState('');

  useEffect(() => {
    let ativo = true;
    api
      .mensagensChat()
      .then((r) => ativo && setUltimas(r.mensagens.slice(-2)))
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
  }, [api]);

  function perguntar(pergunta: string) {
    const limpo = pergunta.trim();
    if (limpo) void navegar('/coach', { state: { pergunta: limpo } });
  }

  function aoEnviar(e: FormEvent) {
    e.preventDefault();
    perguntar(texto);
  }

  return (
    <section className="card coach-rapido" aria-labelledby="titulo-coach-rapido">
      <div className="card-cabecalho">
        <img src="/simbolo.svg" alt="" width={26} height={31} />
        <h2 id="titulo-coach-rapido" className="titulo subtitulo">
          Coach Prumo
        </h2>
        <Link to="/coach" className="link-seta">
          Abrir
          <Icone nome="seta" />
        </Link>
      </div>

      <div className="msgs">
        {ultimas.length === 0 ? (
          <div className="msg ia">
            Oi! Eu conheço os seus registros. Pergunte sobre o seu sono, a sua energia ou a sua
            semana.
          </div>
        ) : (
          ultimas.map((m, i) => (
            <div key={i} className={`msg ${m.papel === 'usuario' ? 'eu' : 'ia'}`}>
              <span className="sr-only">{m.papel === 'usuario' ? 'Você: ' : 'Coach: '}</span>
              {resumir(m.texto)}
            </div>
          ))
        )}
      </div>

      <div className="atalhos">
        {ATALHOS.map((a) => (
          <button key={a} type="button" onClick={() => perguntar(a)}>
            {a}
          </button>
        ))}
      </div>
      <form className="entrada" onSubmit={aoEnviar}>
        <label htmlFor="pergunta-rapida" className="sr-only">
          Pergunta para o Coach
        </label>
        <input
          id="pergunta-rapida"
          placeholder="Pergunte sobre a sua semana…"
          maxLength={500}
          autoComplete="off"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <button type="submit" className="enviar" aria-label="Enviar" disabled={!texto.trim()}>
          <Icone nome="enviar" />
        </button>
      </form>
      <p className="referencia">As conversas se apagam sozinhas depois de 7 dias.</p>
    </section>
  );
}
