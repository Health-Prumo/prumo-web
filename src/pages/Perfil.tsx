import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { usePerfil } from '../auth/Protegido';
import { MensagemErro } from '../components/Estado';
import { Icone } from '../components/Icone';
import { dataIso } from '../util/formato';

const NOME_SEXO = { feminino: 'Feminino', masculino: 'Masculino', nao_informar: 'Não informado' };

export function Perfil() {
  const { sessao, api, sair, apagarConta, modo } = useAuth();
  const { perfil } = usePerfil();
  const navegar = useNavigate();
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState<'' | 'exportar' | 'apagar'>('');
  const [erro, setErro] = useState('');

  async function exportar() {
    setErro('');
    setOcupado('exportar');
    try {
      const dados = await api.exportar();
      const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prumo-meus-dados-${dataIso()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível exportar.');
    } finally {
      setOcupado('');
    }
  }

  async function apagar() {
    setErro('');
    setOcupado('apagar');
    try {
      await apagarConta();
      navegar('/entrar', { replace: true });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível apagar. Tente de novo.');
      setOcupado('');
    }
  }

  return (
    <div className="pagina">
      <header className="cabecalho">
        <div>
          <div className="rotulo">Sua conta</div>
          <h1 className="titulo titulo-pagina">Perfil e privacidade</h1>
        </div>
      </header>

      <section className="card bloco">
        <dl className="dados">
          <div>
            <dt>Nome</dt>
            <dd>{sessao?.nome || '—'}</dd>
          </div>
          <div>
            <dt>E-mail</dt>
            <dd>{sessao?.email || '—'}</dd>
          </div>
          <div>
            <dt>Sexo (meta de água)</dt>
            <dd>{perfil ? NOME_SEXO[perfil.sexo] : '—'}</dd>
          </div>
          <div>
            <dt>Consentimento</dt>
            <dd>
              {perfil?.consentimento.aceito
                ? `Aceito em ${new Date(perfil.consentimento.em).toLocaleDateString('pt-BR')} (versão ${perfil.consentimento.versao})`
                : '—'}
            </dd>
          </div>
        </dl>
        {modo === 'local' && <p className="nota-local">Modo de desenvolvimento local.</p>}
      </section>

      <section className="card bloco stack" aria-labelledby="titulo-privacidade">
        <h2 id="titulo-privacidade" className="titulo subtitulo">
          Seus dados (LGPD)
        </h2>
        <p className="suave">
          Seus registros ficam na AWS, região us-east-1. A inteligência artificial recebe só
          números, nunca seu nome ou e-mail.
        </p>
        <div className="acoes-perfil">
          <button
            type="button"
            className="botao botao-contorno"
            onClick={() => void exportar()}
            disabled={!!ocupado}
          >
            <Icone nome="baixar" />
            {ocupado === 'exportar' ? 'Exportando…' : 'Exportar meus dados'}
          </button>
          {!confirmando ? (
            <button
              type="button"
              className="botao botao-perigo"
              onClick={() => setConfirmando(true)}
              disabled={!!ocupado}
            >
              <Icone nome="lixeira" />
              Apagar meus dados e a conta
            </button>
          ) : (
            <div className="confirmar" role="alertdialog" aria-labelledby="txt-confirmar">
              <p id="txt-confirmar">
                <strong>Tem certeza?</strong> Todos os seus registros, a conversa com o Coach e a
                sua conta serão apagados. Não dá para desfazer.
              </p>
              <div className="acoes-perfil">
                <button
                  type="button"
                  className="botao botao-perigo"
                  onClick={() => void apagar()}
                  disabled={!!ocupado}
                >
                  {ocupado === 'apagar' ? 'Apagando…' : 'Sim, apagar tudo'}
                </button>
                <button
                  type="button"
                  className="botao botao-contorno"
                  onClick={() => setConfirmando(false)}
                  disabled={!!ocupado}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
        {erro && <MensagemErro>{erro}</MensagemErro>}
      </section>

      <button
        type="button"
        className="botao botao-contorno sair"
        onClick={() => void sair().then(() => navegar('/entrar', { replace: true }))}
      >
        <Icone nome="sair" />
        Sair
      </button>
    </div>
  );
}
