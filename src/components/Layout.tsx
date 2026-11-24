import { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { primeiroNome } from '../util/formato';
import { AvisoMedico } from './Estado';
import { Icone, type NomeIcone } from './Icone';
import { definirIconesDaBarra } from '../util/barrasDoSistema';

interface Item {
  para: string;
  rotulo: string;
  rotuloLongo: string;
  icone: NomeIcone;
}

const ITENS: Item[] = [
  { para: '/', rotulo: 'Hoje', rotuloLongo: 'Hoje', icone: 'hoje' },
  { para: '/historico', rotulo: 'Histórico', rotuloLongo: 'Histórico', icone: 'historico' },
  { para: '/registrar', rotulo: 'Registrar', rotuloLongo: 'Registrar o dia', icone: 'registrar' },
  { para: '/coach', rotulo: 'Coach', rotuloLongo: 'Coach IA', icone: 'coach' },
  { para: '/perfil', rotulo: 'Perfil', rotuloLongo: 'Perfil e privacidade', icone: 'perfil' },
];

const ORDEM_DESKTOP = ['/', '/registrar', '/historico', '/coach', '/perfil'];

export function Layout() {
  const { sessao } = useAuth();
  const nome = sessao?.nome || 'Você';

  // Fundo claro: ícones escuros na barra de status do app.
  useEffect(() => definirIconesDaBarra('escuro'), []);

  return (
    <div className="app">
      <a className="pular" href="#conteudo">
        Pular para o conteúdo
      </a>

      <aside className="lateral" aria-label="Menu principal">
        <img className="lateral-logo" src="/logo.svg" alt="Prumo" width={150} height={40} />
        <nav>
          {ORDEM_DESKTOP.map((p) => {
            const item = ITENS.find((i) => i.para === p)!;
            return (
              <NavLink key={p} to={p} end={p === '/'} className="lateral-link">
                <Icone nome={item.icone} />
                {item.rotuloLongo}
              </NavLink>
            );
          })}
        </nav>
        <div className="lateral-usuario">
          <span className="avatar" aria-hidden="true">
            {nome.charAt(0).toUpperCase()}
          </span>
          <div>
            <div className="lateral-nome">{nome}</div>
            <div className="suave pequeno">{sessao?.email}</div>
          </div>
        </div>
        <AvisoMedico className="lateral-aviso" />
      </aside>

      <main id="conteudo" className="principal" tabIndex={-1}>
        <Outlet />
        <AvisoMedico className="rodape-aviso" />
      </main>

      <nav className="abas" aria-label="Navegação">
        {ITENS.map((item) =>
          item.para === '/registrar' ? (
            <NavLink key={item.para} to={item.para} className="aba aba-central">
              <span className="central" aria-hidden="true">
                <Icone nome="mais" />
              </span>
              <span className="sr-only">{item.rotuloLongo}</span>
            </NavLink>
          ) : (
            <NavLink key={item.para} to={item.para} end={item.para === '/'} className="aba">
              <Icone nome={item.icone} />
              {item.rotulo}
            </NavLink>
          ),
        )}
      </nav>
    </div>
  );
}

export function useNomeCurto(): string {
  const { sessao } = useAuth();
  return primeiroNome(sessao?.nome || '') || '';
}
