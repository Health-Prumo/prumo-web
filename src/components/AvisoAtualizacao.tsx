import { useCallback, useEffect, useState } from 'react';
import {
  codigoDoErro,
  pluginAtualizacao,
  SEM_PERMISSAO,
  type InfoAtualizacao,
} from '../util/atualizacao';

type Estado = 'pronto' | 'baixando' | 'permissao' | 'erro';

/** Aviso de versão nova do app Android, com botão para atualizar. No navegador não aparece. */
export function AvisoAtualizacao() {
  const [info, setInfo] = useState<InfoAtualizacao | null>(null);
  const [estado, setEstado] = useState<Estado>('pronto');
  const [dispensado, setDispensado] = useState(false);

  const verificar = useCallback(() => {
    pluginAtualizacao()
      ?.verificar()
      .then(setInfo)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!pluginAtualizacao()) return;
    verificar();
    // Confere de novo quando o app volta para a frente.
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') verificar();
    };
    document.addEventListener('visibilitychange', aoVoltar);
    return () => document.removeEventListener('visibilitychange', aoVoltar);
  }, [verificar]);

  const atualizar = async () => {
    const plugin = pluginAtualizacao();
    if (!plugin) return;
    setEstado('baixando');
    try {
      await plugin.instalar();
      setEstado('pronto');
    } catch (e) {
      setEstado(codigoDoErro(e) === SEM_PERMISSAO ? 'permissao' : 'erro');
    }
  };

  if (!info?.disponivel || dispensado) return null;

  return (
    <section className="aviso-atualizacao" role="status" aria-live="polite">
      <div>
        <strong>Nova versão do Prumo ({info.versao})</strong>
        <p className="pequeno">
          {estado === 'baixando' && 'Baixando a atualização…'}
          {estado === 'pronto' && 'Atualize para ter as melhorias. Seus dados continuam salvos.'}
          {estado === 'permissao' &&
            'Permita que o Prumo instale atualizações na tela que abriu, volte e toque em Atualizar.'}
          {estado === 'erro' &&
            'Não foi possível baixar agora. Confira sua conexão e tente de novo.'}
        </p>
      </div>
      <div className="aviso-atualizacao-acoes">
        <button
          type="button"
          className="botao"
          onClick={atualizar}
          disabled={estado === 'baixando'}
        >
          {estado === 'baixando' ? 'Baixando…' : 'Atualizar'}
        </button>
        <button type="button" className="botao-link" onClick={() => setDispensado(true)}>
          Agora não
        </button>
      </div>
    </section>
  );
}
