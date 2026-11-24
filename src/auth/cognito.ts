// Chamadas diretas à API do Amazon Cognito (sem SDK), pelo endpoint regional.
// O app client é público (sem segredo), com os fluxos USER_PASSWORD_AUTH e REFRESH_TOKEN_AUTH.

export class ErroCognito extends Error {
  readonly codigo: string;

  constructor(codigo: string, mensagem: string) {
    super(mensagem);
    this.name = 'ErroCognito';
    this.codigo = codigo;
  }
}

export interface Tokens {
  idToken: string;
  accessToken: string;
  refreshToken?: string;
  expiraEmSeg: number;
}

const MENSAGENS: Record<string, string> = {
  NotAuthorizedException: 'E-mail ou senha incorretos.',
  UserNotFoundException: 'E-mail ou senha incorretos.',
  UserNotConfirmedException: 'Confirme seu e-mail com o código que enviamos.',
  UsernameExistsException: 'Já existe uma conta com este e-mail.',
  InvalidPasswordException:
    'A senha precisa ter pelo menos 8 caracteres, com letra maiúscula, minúscula e número.',
  InvalidParameterException: 'Confira os dados informados.',
  CodeMismatchException: 'Código incorreto. Confira o e-mail e tente de novo.',
  ExpiredCodeException: 'O código expirou. Peça um novo.',
  LimitExceededException: 'Muitas tentativas. Espere alguns minutos.',
  TooManyRequestsException: 'Muitas tentativas. Espere alguns minutos.',
  TooManyFailedAttemptsException: 'Muitas tentativas. Espere alguns minutos.',
};

export interface OpcoesCognito {
  regiao: string;
  clientId: string;
  fetch?: typeof fetch;
}

export function criarCognito(opcoes: OpcoesCognito) {
  const url = `https://cognito-idp.${opcoes.regiao}.amazonaws.com/`;
  const f = opcoes.fetch ?? ((...args: Parameters<typeof fetch>) => fetch(...args));

  async function chamar<T>(acao: string, corpo: Record<string, unknown>): Promise<T> {
    if (!opcoes.clientId) {
      throw new ErroCognito('SemConfiguracao', 'Login não configurado (VITE_COGNITO_CLIENT_ID).');
    }
    let resposta: Response;
    try {
      resposta = await f(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': `AWSCognitoIdentityProviderService.${acao}`,
        },
        body: JSON.stringify(corpo),
      });
    } catch {
      throw new ErroCognito('SemConexao', 'Não foi possível conectar. Confira sua conexão.');
    }
    const dados = (await resposta.json().catch(() => ({}))) as Record<string, unknown>;
    if (!resposta.ok) {
      const tipo =
        String(dados.__type ?? '')
          .split('#')
          .pop() ?? '';
      throw new ErroCognito(
        tipo || 'Erro',
        MENSAGENS[tipo] ?? String(dados.message ?? 'Não foi possível concluir. Tente de novo.'),
      );
    }
    return dados as T;
  }

  interface RespostaAuth {
    AuthenticationResult?: {
      IdToken: string;
      AccessToken: string;
      RefreshToken?: string;
      ExpiresIn: number;
    };
    ChallengeName?: string;
  }

  function paraTokens(r: RespostaAuth): Tokens {
    const a = r.AuthenticationResult;
    if (!a) {
      throw new ErroCognito(
        r.ChallengeName ?? 'Desafio',
        'Esse tipo de login ainda não é suportado.',
      );
    }
    return {
      idToken: a.IdToken,
      accessToken: a.AccessToken,
      refreshToken: a.RefreshToken,
      expiraEmSeg: a.ExpiresIn,
    };
  }

  return {
    async entrar(email: string, senha: string): Promise<Tokens> {
      const r = await chamar<RespostaAuth>('InitiateAuth', {
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: opcoes.clientId,
        AuthParameters: { USERNAME: email, PASSWORD: senha },
      });
      return paraTokens(r);
    },

    async renovar(refreshToken: string): Promise<Tokens> {
      const r = await chamar<RespostaAuth>('InitiateAuth', {
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: opcoes.clientId,
        AuthParameters: { REFRESH_TOKEN: refreshToken },
      });
      const t = paraTokens(r);
      return { ...t, refreshToken: t.refreshToken ?? refreshToken };
    },

    async cadastrar(nome: string, email: string, senha: string): Promise<void> {
      await chamar('SignUp', {
        ClientId: opcoes.clientId,
        Username: email,
        Password: senha,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'name', Value: nome },
        ],
      });
    },

    async confirmar(email: string, codigo: string): Promise<void> {
      await chamar('ConfirmSignUp', {
        ClientId: opcoes.clientId,
        Username: email,
        ConfirmationCode: codigo,
      });
    },

    async reenviarCodigo(email: string): Promise<void> {
      await chamar('ResendConfirmationCode', { ClientId: opcoes.clientId, Username: email });
    },

    async esqueciSenha(email: string): Promise<void> {
      await chamar('ForgotPassword', { ClientId: opcoes.clientId, Username: email });
    },

    async redefinirSenha(email: string, codigo: string, novaSenha: string): Promise<void> {
      await chamar('ConfirmForgotPassword', {
        ClientId: opcoes.clientId,
        Username: email,
        ConfirmationCode: codigo,
        Password: novaSenha,
      });
    },

    async apagarUsuario(accessToken: string): Promise<void> {
      await chamar('DeleteUser', { AccessToken: accessToken });
    },

    async sair(accessToken: string): Promise<void> {
      await chamar('GlobalSignOut', { AccessToken: accessToken });
    },
  };
}

export type Cognito = ReturnType<typeof criarCognito>;
