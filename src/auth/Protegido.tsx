import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ErroApi } from '../api/cliente';
import type { Perfil } from '../api/tipos';
import { Carregando, MensagemErro } from '../components/Estado';
import { useAuth } from './AuthContext';

interface ValorPerfil {
  perfil: Perfil | null;
  definirPerfil(p: Perfil): void;
}

const ContextoPerfil = createContext<ValorPerfil | null>(null);

export function usePerfil(): ValorPerfil {
  const v = useContext(ContextoPerfil);
  if (!v) throw new Error('usePerfil fora do Protegido');
  return v;
}

/** Exige login e carrega o perfil. Sem consentimento, manda para /consentimento. */
export function Protegido() {
  const { sessao, api } = useAuth();
  const local = useLocation();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'sem-perfil' | 'erro'>('carregando');
  const [erro, setErro] = useState('');

  const carregar = useCallback(() => {
    setEstado('carregando');
    api
      .obterPerfil()
      .then((p) => {
        setPerfil(p);
        setEstado(p.consentimento?.aceito ? 'ok' : 'sem-perfil');
      })
      .catch((e: unknown) => {
        if (e instanceof ErroApi && e.status === 404) return setEstado('sem-perfil');
        setErro(e instanceof Error ? e.message : 'Erro ao carregar seu perfil.');
        setEstado('erro');
      });
  }, [api]);

  useEffect(() => {
    if (sessao) carregar();
  }, [sessao, carregar]);

  if (!sessao) return <Navigate to="/entrar" replace state={{ de: local.pathname }} />;
  if (estado === 'carregando')
    return (
      <Tela>
        <Carregando />
      </Tela>
    );
  if (estado === 'erro')
    return (
      <Tela>
        <MensagemErro>{erro}</MensagemErro>
        <button type="button" className="botao" onClick={carregar}>
          Tentar de novo
        </button>
      </Tela>
    );

  const valor: ValorPerfil = {
    perfil,
    definirPerfil: (p) => {
      setPerfil(p);
      setEstado('ok');
    },
  };

  if (estado === 'sem-perfil' && local.pathname !== '/consentimento') {
    return <Navigate to="/consentimento" replace />;
  }
  return (
    <ContextoPerfil.Provider value={valor}>
      <Outlet />
    </ContextoPerfil.Provider>
  );
}

function Tela({ children }: { children: ReactNode }) {
  return <div className="tela-centro">{children}</div>;
}
