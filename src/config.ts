// Configuração lida das variáveis VITE_* (vão para o navegador: nada de segredo aqui).
export type ModoAuth = 'local' | 'cognito';

export const config = {
  apiUrl: (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/+$/, ''),
  modoAuth: (import.meta.env.VITE_AUTH_MODE === 'cognito' ? 'cognito' : 'local') as ModoAuth,
  cognitoRegiao: import.meta.env.VITE_COGNITO_REGION ?? 'us-east-1',
  cognitoClientId: import.meta.env.VITE_COGNITO_CLIENT_ID ?? '',
};
