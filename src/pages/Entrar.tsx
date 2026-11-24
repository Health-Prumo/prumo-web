import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AvisoMedico, MensagemErro } from '../components/Estado';
import { Acesso } from './Acesso';
import { CampoSenha } from '../components/CampoSenha';

export function Entrar() {
  const { sessao, entrar, modo } = useAuth();
  const navegar = useNavigate();
  const local = useLocation();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (sessao) return <Navigate to="/" replace />;

  const destino = (local.state as { de?: string } | null)?.de ?? '/';

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      await entrar(email, senha);
      navegar(destino, { replace: true });
    } catch (err) {
      const codigo = (err as { codigo?: string }).codigo;
      if (codigo === 'UserNotConfirmedException') {
        navegar('/cadastro', { state: { confirmar: email } });
        return;
      }
      setErro(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Acesso titulo="Como estou hoje?" subtitulo="Entre para registrar o seu dia.">
      {modo === 'local' ? (
        <div className="stack">
          <p className="nota-local">
            Modo de desenvolvimento local: sem login real. Os dados ficam na API local.
          </p>
          <button
            type="button"
            className="botao largo"
            onClick={async () => {
              await entrar('', '');
              navegar(destino, { replace: true });
            }}
          >
            Entrar no modo local
          </button>
        </div>
      ) : (
        <form className="stack" onSubmit={enviar} noValidate>
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
          <CampoSenha
            rotulo="Senha"
            autoComplete="current-password"
            obrigatorio
            valor={senha}
            aoMudar={setSenha}
          />
          {erro && <MensagemErro>{erro}</MensagemErro>}
          <button type="submit" className="botao largo" disabled={enviando || !email || !senha}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
          <div className="links-acesso">
            <Link to="/cadastro">Criar conta</Link>
            <Link to="/esqueci-senha">Esqueci a senha</Link>
          </div>
        </form>
      )}
      <AvisoMedico />
    </Acesso>
  );
}
