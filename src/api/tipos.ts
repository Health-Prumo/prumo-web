// Tipos do contrato da API do Prumo (v1). O front não calcula nota: só exibe o que volta.

export type Sexo = 'feminino' | 'masculino' | 'nao_informar';
export type Intensidade = 'leve' | 'moderada' | 'vigorosa';
export type Situacao = 'boa' | 'atencao' | 'alerta';
export type NomeHabito = 'sono' | 'atividade' | 'agua' | 'alimentacao' | 'humor' | 'tela';

export interface Perfil {
  sexo: Sexo;
  consentimento: { aceito: boolean; versao: string; em: string };
  criado_em: string;
}

export interface Alimentacao {
  frutas_verduras: boolean;
  refeicao_caseira: boolean;
  ultraprocessados: boolean;
}

export interface Registro {
  sono_horas: number;
  sono_qualidade: number;
  atividade_minutos: number;
  atividade_intensidade: Intensidade;
  agua_litros: number;
  alimentacao: Alimentacao;
  humor: number;
  tela_horas: number;
}

export interface Habito {
  nota: number;
  valor: number;
  unidade: 'h' | 'min' | 'L' | '/10' | '/5';
  media_7d: number | null;
  situacao: Situacao;
  resumo: string;
}

export interface HabitoAtividade extends Habito {
  semana_min: number;
  meta_semana_min: number;
}

export interface Sugestao {
  habito: NomeHabito;
  titulo: string;
  detalhe: string;
}

export interface Dia {
  data: string;
  registro: Registro;
  notas: {
    energia: number;
    habitos: {
      sono: Habito;
      atividade: HabitoAtividade;
      agua: Habito;
      alimentacao: Habito;
      humor: Habito;
      tela: Habito;
    };
    pesos: Record<NomeHabito, number>;
  };
  analise: {
    titulo: string;
    resumo: string;
    sugestoes: Sugestao[];
    fonte: 'mock' | 'bedrock';
    aviso: string;
  };
  calculado_em: string;
}

export interface PontoHistorico {
  data: string;
  energia: number;
  sono_horas: number;
  atividade_minutos: number;
  agua_litros: number;
  alimentacao_nota: number;
  humor: number;
  tela_horas: number;
}

export interface MensagemChat {
  papel: 'usuario' | 'coach';
  texto: string;
  em: string;
}
