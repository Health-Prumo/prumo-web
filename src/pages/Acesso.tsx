import { useEffect, type ReactNode } from 'react';
import { definirIconesDaBarra } from '../util/barrasDoSistema';

/** Moldura das telas de entrada (sem menu). */
export function Acesso({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
}) {
  // Fundo esmeralda: ícones claros na barra de status do app.
  useEffect(() => definirIconesDaBarra('claro'), []);

  return (
    <div className="acesso">
      <main className="acesso-cartao card">
        <img src="/simbolo.svg" alt="" className="acesso-simbolo" width={44} height={53} />
        <div className="rotulo">Prumo</div>
        <h1 className="titulo acesso-titulo">{titulo}</h1>
        {subtitulo && <p className="suave">{subtitulo}</p>}
        {children}
      </main>
    </div>
  );
}
