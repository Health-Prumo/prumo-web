import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Sexo } from '../api/tipos';
import { useAuth } from '../auth/AuthContext';
import { usePerfil } from '../auth/Protegido';
import { AvisoMedico, MensagemErro } from '../components/Estado';
import { Icone } from '../components/Icone';
import { Acesso } from './Acesso';

const OPCOES_SEXO: { valor: Sexo; rotulo: string }[] = [
  { valor: 'feminino', rotulo: 'Feminino' },
  { valor: 'masculino', rotulo: 'Masculino' },
  { valor: 'nao_informar', rotulo: 'Prefiro não informar' },
];

export function Consentimento() {
  const { api, sair } = useAuth();
  const { definirPerfil } = usePerfil();
  const navegar = useNavigate();
  const [sexo, setSexo] = useState<Sexo | ''>('');
  const [aceito, setAceito] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!sexo || !aceito) return;
    setErro('');
    setEnviando(true);
    try {
      definirPerfil(await api.salvarPerfil(sexo));
      navegar('/', { replace: true });
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Acesso titulo="Seus dados, suas regras" subtitulo="Antes de começar, leia com atenção.">
      <form className="stack" onSubmit={enviar}>
        <section className="termo" aria-labelledby="termo-titulo">
          <h2 id="termo-titulo" className="termo-titulo">
            <Icone nome="escudo" />
            Termo de consentimento para dados de saúde
          </h2>
          <p>
            O Prumo trata <strong>dados pessoais sensíveis de saúde</strong> (LGPD, art. 5º, II):
            sono, atividade física, água, alimentação, humor e tempo de tela.
          </p>
          <ul>
            <li>
              <strong>Para quê:</strong> calcular sua nota de energia, comparar com o seu próprio
              padrão e com metas oficiais (OMS, Guia Alimentar) e gerar sugestões.
            </li>
            <li>
              <strong>Inteligência artificial:</strong> o modelo recebe só números e o resumo do seu
              histórico. Nunca seu nome, e-mail ou outro identificador.
            </li>
            <li>
              <strong>Onde ficam:</strong> na AWS, região us-east-1 (Estados Unidos). A
              transferência internacional se baseia no seu consentimento (LGPD, art. 33, VIII).
            </li>
            <li>
              <strong>Seus direitos:</strong> você pode exportar e apagar todos os seus dados a
              qualquer momento, na tela Perfil.
            </li>
            <li>
              <strong>Limite:</strong> o Prumo não faz diagnóstico nem prescreve dieta ou treino.
            </li>
          </ul>
        </section>

        <fieldset className="grupo">
          <legend>Sexo (usado só para a meta de água da EFSA)</legend>
          <div className="segmentos" role="radiogroup">
            {OPCOES_SEXO.map((o) => (
              <label key={o.valor} className={`segmento ${sexo === o.valor ? 'on' : ''}`}>
                <input
                  type="radio"
                  name="sexo"
                  value={o.valor}
                  checked={sexo === o.valor}
                  onChange={() => setSexo(o.valor)}
                  className="sr-only"
                />
                {o.rotulo}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="aceite">
          <input type="checkbox" checked={aceito} onChange={(e) => setAceito(e.target.checked)} />
          <span>
            <strong>Eu consinto</strong>, de forma específica e destacada (LGPD, art. 11), com o
            tratamento dos meus dados de saúde descrito acima.
          </span>
        </label>

        {erro && <MensagemErro>{erro}</MensagemErro>}
        <button type="submit" className="botao largo" disabled={!aceito || !sexo || enviando}>
          {enviando ? 'Salvando…' : 'Aceitar e começar'}
        </button>
        <button type="button" className="botao-link" onClick={() => void sair()}>
          Não aceito, sair
        </button>
      </form>
      <AvisoMedico />
    </Acesso>
  );
}
