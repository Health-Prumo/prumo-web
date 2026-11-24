import type { ReactNode } from 'react';

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <div className="estado" role="status" aria-live="polite">
      <span className="girando" aria-hidden="true" />
      {texto}
    </div>
  );
}

export function MensagemErro({ children }: { children: ReactNode }) {
  return (
    <div className="erro" role="alert">
      {children}
    </div>
  );
}

export const AVISO_MEDICO = 'O Prumo não substitui orientação médica.';

export function AvisoMedico({ className = '' }: { className?: string }) {
  return <p className={`aviso-medico ${className}`}>{AVISO_MEDICO}</p>;
}
