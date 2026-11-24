import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { MensagemErro } from '../components/Estado';
import { Acesso } from './Acesso';

export function EsqueciSenha() {
  const { esqueciSenha, redefinirSenha } = useAuth();
  const navegar = useNavigate();
  const [etapa, setEtapa] = useState<'email' | 'codigo'>('email');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      if (etapa === 'email') {
        await esqueciSenha(email);
        setEtapa('codigo');
      } else {
        await redefinirSenha(email, codigo, senha);
        navegar('/entrar', { replace: true });
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível concluir.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Acesso
      titulo="Redefinir senha"
      subtitulo={
        etapa === 'email'
          ? 'Enviaremos um código para o seu e-mail.'
          : `Código enviado para ${email}.`
      }
    >
      <form className="stack" onSubmit={enviar} noValidate>
        {etapa === 'email' ? (
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
        ) : (
          <>
            <label className="campo-form">
              Código
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
            </label>
            <label className="campo-form">
              Nova senha
              <input
                type="password"
                autoComplete="new-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </label>
          </>
        )}
        {erro && <MensagemErro>{erro}</MensagemErro>}
        <button type="submit" className="botao largo" disabled={enviando}>
          {etapa === 'email' ? 'Enviar código' : 'Salvar nova senha'}
        </button>
        <div className="links-acesso">
          <Link to="/entrar">Voltar</Link>
        </div>
      </form>
    </Acesso>
  );
}
