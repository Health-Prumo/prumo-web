import { useId, useState, type ReactNode } from 'react';
import { Icone } from './Icone';

type Props = {
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
  autoComplete: 'current-password' | 'new-password';
  obrigatorio?: boolean;
  minimo?: number;
  dica?: ReactNode;
};

// Campo de senha com o botão "Mostrar senha". O estado é anunciado por aria-pressed
// e pelo texto do botão, não só pelo ícone.
export function CampoSenha({
  rotulo,
  valor,
  aoMudar,
  autoComplete,
  obrigatorio,
  minimo,
  dica,
}: Props) {
  const id = useId();
  const idDica = `${id}-dica`;
  const [visivel, setVisivel] = useState(false);

  return (
    <div className="campo-form">
      <label htmlFor={id}>{rotulo}</label>
      <div className="campo-senha">
        <input
          id={id}
          type={visivel ? 'text' : 'password'}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required={obrigatorio}
          minLength={minimo}
          aria-describedby={dica ? idDica : undefined}
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
        />
        <button
          type="button"
          className="mostrar-senha"
          aria-controls={id}
          aria-pressed={visivel}
          onClick={() => setVisivel((v) => !v)}
        >
          <Icone nome={visivel ? 'olho-fechado' : 'olho'} />
          <span>{visivel ? 'Ocultar' : 'Mostrar'}</span>
          <span className="sr-only"> senha</span>
        </button>
      </div>
      {dica && (
        <span id={idDica} className="dica">
          {dica}
        </span>
      )}
    </div>
  );
}
