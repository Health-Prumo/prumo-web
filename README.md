# prumo-web

Front-end do **Prumo**, o coach de bem-estar com IA que responde "como estou hoje?". Projeto do FMU Tech Inovação 2026.2, ODS 3.

A proposta, a identidade visual e a arquitetura ficam no repositório central [Health-Prumo/prumo](https://github.com/Health-Prumo/prumo). Detalhes para quem for contribuir (pessoas ou agentes de IA) em [AGENTS.md](AGENTS.md).

> O Prumo não substitui orientação médica.

## Stack

React 19 + TypeScript (strict) com Vite, React Router e Recharts. ESLint, Prettier e Vitest. Login pelo Amazon Cognito, chamado direto por `fetch` (sem SDK).

## Telas

| Rota                                     | Tela                                                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `/entrar`, `/cadastro`, `/esqueci-senha` | Login, criação de conta com código por e-mail e redefinição de senha                              |
| `/consentimento`                         | Termo de consentimento LGPD (dados de saúde) e sexo para a meta de água                           |
| `/`                                      | Hoje: card "Seu dia" com a nota de energia, até 2 sugestões, os 6 hábitos e a meta semanal da OMS |
| `/registrar`                             | Registrar o dia: sono, atividade, água, alimentação, humor e tela                                 |
| `/historico`                             | Gráficos de 7 ou 30 dias, com tabela alternativa                                                  |
| `/coach`                                 | Chat com o Coach Prumo                                                                            |
| `/perfil`                                | Dados da conta, exportar e apagar tudo, sair                                                      |

O front **não calcula nota nem gera texto**: envia o registro ao [prumo-api](https://github.com/Health-Prumo/prumo-api) e exibe o que volta.

## Rodar local

Pré-requisitos: Node 20+ e a API rodando em `http://localhost:8000` (veja o README do `prumo-api`).

```bash
cp .env.example .env.local   # VITE_AUTH_MODE=local: sem Cognito, usuário de desenvolvimento
npm install
npm run dev                  # http://localhost:5173
```

## Qualidade

```bash
npm run lint        # ESLint + Prettier
npm run typecheck   # TypeScript
npm test            # Vitest
npm run build       # gera dist/
```

O GitHub Actions roda tudo isso e o `gitleaks` a cada push e pull request.

## Variáveis

| Variável                 | Uso                                                                             |
| ------------------------ | ------------------------------------------------------------------------------- |
| `VITE_API_URL`           | Endereço da API (`http://localhost:8000` ou `https://api.healthprumo.online`)   |
| `VITE_AUTH_MODE`         | `local` (sem login real) ou `cognito`                                           |
| `VITE_COGNITO_REGION`    | Região do user pool (`us-east-1`)                                               |
| `VITE_COGNITO_CLIENT_ID` | ID do app client (saída `client_id` da unidade `dev/auth` do `tf-environments`) |

Elas vão para o navegador: **nunca coloque segredo nelas**.

## Deploy

O site fica em um bucket S3 privado servido pelo CloudFront (`https://app.healthprumo.online`), criado pelo Terraform no [tf-environments](https://github.com/Health-Prumo/tf-environments) (unidade `dev/web`).

```bash
aws login --profile prumo
cp .env.example .env.production   # VITE_AUTH_MODE=cognito e os valores da AWS
BUCKET=<bucket_name> DISTRIBUTION_ID=<distribution_id> scripts/deploy.sh
```

O script confere se o perfil está na conta `444331926746`, faz o build, publica com `aws s3 sync` (assets com cache longo, `index.html` sem cache) e invalida o `index.html` no CloudFront.
