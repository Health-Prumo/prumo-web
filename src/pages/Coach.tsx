import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { MensagemChat } from '../api/tipos';
import { useAuth } from '../auth/AuthContext';
import { Carregando, MensagemErro } from '../components/Estado';
import { Icone } from '../components/Icone';

// Perguntas do roteiro testado do Coach (ver o README do prumo-api).
const ATALHOS = [
  'Como foi minha semana?',
  'Por que estou cansado?',
  'Dicas para dormir melhor',
  'Lanches saudáveis',
  'Quanto falta para a meta da OMS?',
  'Como minha nota é calculada?',
];
const LIMITE = 500;

export function Coach() {
  const { api } = useAuth();
  const [mensagens, setMensagens] = useState<MensagemChat[] | null>(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const fim = useRef<HTMLDivElement>(null);
  const local = useLocation();
  const navegar = useNavigate();
  const perguntaInicial = (local.state as { pergunta?: string } | null)?.pergunta;
  const jaPerguntou = useRef(false);

  useEffect(() => {
    let ativo = true;
    api
      .mensagensChat()
      .then((r) => ativo && setMensagens(r.mensagens))
      .catch((e: unknown) => {
        if (!ativo) return;
        setMensagens([]);
        setErro(e instanceof Error ? e.message : 'Erro ao carregar a conversa.');
      });
    return () => {
      ativo = false;
    };
  }, [api]);

  useEffect(() => {
    fim.current?.scrollIntoView?.({ block: 'end' });
  }, [mensagens, enviando]);

  async function enviar(msg: string) {
    const limpo = msg.trim().slice(0, LIMITE);
    if (!limpo || enviando) return;
    setErro('');
    setTexto('');
    setEnviando(true);
    const agora = new Date().toISOString();
    setMensagens((m) => [...(m ?? []), { papel: 'usuario', texto: limpo, em: agora }]);
    try {
      const r = await api.enviarChat(limpo);
      setMensagens((m) => [
        ...(m ?? []),
        { papel: 'coach', texto: r.resposta, em: new Date().toISOString() },
      ]);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'O Coach não respondeu. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  // Pergunta feita no card do Coach da tela Hoje: envia uma vez, depois da conversa carregar.
  useEffect(() => {
    if (!perguntaInicial || mensagens === null || jaPerguntou.current) return;
    jaPerguntou.current = true;
    void navegar('.', { replace: true, state: null });
    void enviar(perguntaInicial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perguntaInicial, mensagens]);

  function aoEnviar(e: FormEvent) {
    e.preventDefault();
    void enviar(texto);
  }

  return (
    <div className="pagina coach">
      <header className="topo-coach">
        <img src="/simbolo.svg" alt="" width={30} height={36} />
        <div>
          <h1 className="titulo">Coach Prumo</h1>
          <span className="selo positivo">conhece seus últimos 30 dias</span>
        </div>
      </header>
      <p className="aviso-chat">
        O Coach Prumo não substitui orientação médica. Em caso de sintomas, procure um profissional
        de saúde. As conversas se apagam sozinhas depois de 7 dias.
      </p>

      <div className="msgs" aria-live="polite" aria-busy={enviando}>
        {!mensagens && <Carregando />}
        {mensagens?.length === 0 && (
          <div className="msg ia">
            Oi! Eu conheço os seus registros e posso ajudar a entender sua semana. Pergunte algo ou
            use um dos atalhos abaixo.
          </div>
        )}
        {mensagens?.map((m, i) => (
          <div key={i} className={`msg ${m.papel === 'usuario' ? 'eu' : 'ia'}`}>
            <span className="sr-only">{m.papel === 'usuario' ? 'Você: ' : 'Coach: '}</span>
            {m.texto}
          </div>
        ))}
        {enviando && (
          <div className="msg ia digitando" role="status">
            Coach está escrevendo…
          </div>
        )}
        <div ref={fim} />
      </div>

      {erro && <MensagemErro>{erro}</MensagemErro>}

      <div className="atalhos">
        {ATALHOS.map((a) => (
          <button key={a} type="button" onClick={() => void enviar(a)} disabled={enviando}>
            {a}
          </button>
        ))}
      </div>
      <form className="entrada" onSubmit={aoEnviar}>
        <label htmlFor="mensagem" className="sr-only">
          Mensagem para o Coach
        </label>
        <input
          id="mensagem"
          placeholder="Pergunte sobre a sua semana…"
          maxLength={LIMITE}
          autoComplete="off"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <button
          type="submit"
          className="enviar"
          aria-label="Enviar"
          disabled={enviando || !texto.trim()}
        >
          <Icone nome="enviar" />
        </button>
      </form>
    </div>
  );
}
