import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { MensagemErro } from '../components/Estado';
import { Acesso } from './Acesso';

export function Cadastro() {
  const { sessao, modo, cadastrar, confirmar, reenviarCodigo, entrar } = useAuth();
  const navegar = useNavigate();
  const pendente = (useLocation().state as { confirmar?: string } | null)?.confirmar;
  const [etapa, setEtapa] = useState<'dados' | 'codigo'>(pendente ? 'codigo' : 'dados');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState(pendente ?? '');
  const [senha, setSenha] = useState('');
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [info, setInfo] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (sessao) return <Navigate to="/" replace />;
  if (modo === 'local') return <Navigate to="/entrar" replace />;

  async function executar(acao: () => Promise<void>) {
    setErro('');
    setInfo('');
    setEnviando(true);
    try {
      await acao();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível concluir.');
    } finally {
      setEnviando(false);
    }
  }

  function enviarDados(e: FormEvent) {
    e.preventDefault();
    void executar(async () => {
      await cadastrar(nome, email, senha);
      setEtapa('codigo');
    });
  }

  function enviarCodigo(e: FormEvent) {
    e.preventDefault();
    void executar(async () => {
      await confirmar(email, codigo);
      if (senha) {
        await entrar(email, senha);
        navegar('/consentimento', { replace: true });
      } else {
        navegar('/entrar', { replace: true });
      }
    });
  }

  if (etapa === 'codigo') {
    return (
      <Acesso titulo="Confirme seu e-mail" subtitulo={`Enviamos um código para ${email}.`}>
        <form className="stack" onSubmit={enviarCodigo} noValidate>
          <label className="campo-form">
            Código de confirmação
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
          </label>
          {erro && <MensagemErro>{erro}</MensagemErro>}
          {info && (
            <p className="info" role="status">
              {info}
            </p>
          )}
          <button type="submit" className="botao largo" disabled={enviando || !codigo}>
            {enviando ? 'Confirmando…' : 'Confirmar'}
          </button>
          <button
            type="button"
            className="botao-link"
            disabled={enviando}
            onClick={() =>
              executar(async () => {
                await reenviarCodigo(email);
                setInfo('Enviamos um novo código.');
              })
            }
          >
            Reenviar código
          </button>
        </form>
      </Acesso>
    );
  }

  return (
    <Acesso titulo="Criar conta" subtitulo="Leva menos de um minuto.">
      <form className="stack" onSubmit={enviarDados} noValidate>
        <label className="campo-form">
          Como podemos te chamar?
          <input
            autoComplete="given-name"
            required
            maxLength={60}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </label>
        <label className="campo-form">
          E-mail
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="campo-form">
          Senha
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            aria-describedby="dica-senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <span id="dica-senha" className="dica">
            Mínimo de 8 caracteres, com letra maiúscula, minúscula e número.
          </span>
        </label>
        <p className="dica">Seu nome fica só no login e não é enviado à inteligência artificial.</p>
        {erro && <MensagemErro>{erro}</MensagemErro>}
        <button
          type="submit"
          className="botao largo"
          disabled={enviando || !nome || !email || senha.length < 8}
        >
          {enviando ? 'Criando…' : 'Criar conta'}
        </button>
        <div className="links-acesso">
          <Link to="/entrar">Já tenho conta</Link>
        </div>
      </form>
    </Acesso>
  );
}
