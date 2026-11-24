# AGENTS.md — prumo-web

Front-end do **Prumo**, o coach de bem-estar com IA que responde "como estou hoje?" (FMU Tech Inovação 2026.2, ODS 3).

**Antes de qualquer tarefa, leia o contexto geral** em [Health-Prumo/prumo/AGENTS.md](https://github.com/Health-Prumo/prumo/blob/main/AGENTS.md): o que é o Prumo, decisões, identidade visual, LGPD, AWS e convenções. Este arquivo traz só o que é específico do front.

## Estado atual

Repositório recém-criado, **ainda sem código**. A primeira tarefa é montar o projeto com a stack abaixo.

## Stack definida

- **React + TypeScript com Vite**, como **PWA (Progressive Web App)** responsiva e instalável nos navegadores compatíveis, mobile primeiro (sem app de loja).
- **Zustand** para estado compartilhado do front, com stores pequenas por responsabilidade e seletores específicos. Estado restrito a um componente fica no React. Dados da sessão ficam em memória e são limpos no logout ou na troca de usuário; não use `persist` para registros de saúde, conversas ou credenciais.
- **Recharts** para os gráficos de evolução.
- **Login:** Amazon Cognito (na AWS). No desenvolvimento local, a API roda em `http://localhost:8000` ([prumo-api](https://github.com/Health-Prumo/prumo-api)).
- **Configuração** por variáveis `VITE_*` num `.env.example` versionado. Elas vão para o navegador: **nunca coloque segredo nelas**.
- **CI:** GitHub Actions com lint e build a cada push e pull request.
- **Hospedagem:** o build (`dist/`) vai para um bucket S3 privado servido pelo CloudFront, criado pelo Terraform ([tf-blueprint](https://github.com/Health-Prumo/tf-blueprint) e [tf-environments](https://github.com/Health-Prumo/tf-environments)).

## Organização inicial do front

Estrutura inicial sugerida, baseada na separação de responsabilidades do template:

```text
public/                # Manifesto PWA, ícones e arquivos estáticos públicos
src/
  assets/              # Logo, imagens e fontes do Prumo
  components/          # Componentes de interface reutilizáveis e acessíveis
  containers/          # Composição de layout, navegação e estrutura das telas
  pages/               # Login/consentimento, Hoje, Registrar o dia, Coach e Histórico
  services/            # Cliente HTTP, integração com prumo-api e autenticação Cognito
  stores/              # Stores Zustand por responsabilidade, mantidas em memória
  hooks/               # Hooks reutilizáveis de integração e interface
  types/               # Contratos da API e tipos compartilhados
  config/              # Leitura e validação das variáveis VITE_*
  styles/              # Tokens de prumo.css e estilos globais responsivos
  App.tsx              # Composição da aplicação e rotas
  main.tsx             # Inicialização do React e registro da PWA
```

- Crie pastas conforme a necessidade. Mantenha chamadas HTTP nos serviços, estado compartilhado nas stores e apresentação nos componentes/páginas.
- Aproveite a organização do template; não copie marcas, dependências privadas, configurações de empresa, rastreadores ou funcionalidades sem relação com o Prumo. Selecione somente as dependências necessárias à stack definida aqui.
- A referência a Amplify no template não altera a hospedagem definida: S3 privado + CloudFront, com infraestrutura em Terraform.

## PWA e experiência mobile

- Planeje primeiro para celulares e adapte o layout a tablets e desktop. Formulários, navegação, cards e gráficos devem funcionar em telas estreitas, sem rolagem horizontal da página, com toque, teclado e zoom.
- Configure manifesto com nome, ícones da marca, `start_url` e modo `standalone`, além de service worker para o cache dos arquivos estáticos públicos da interface. A publicação usa HTTPS; o desenvolvimento local usa localhost.
- A aplicação deve continuar utilizável no navegador quando a instalação não estiver disponível. Valide em Safari/iOS e Chrome/Android, além dos navegadores desktop, tanto no navegador quanto no modo instalado quando suportado.
- Respeite áreas seguras da tela e o teclado virtual. Mantenha ações, foco e o aviso médico visíveis e acessíveis nos diferentes tamanhos de tela.
- Offline, mostre uma mensagem clara sobre a necessidade de conexão para login, envio de registros, análise, chat e histórico. Não armazene respostas da API, dados de saúde, conversas ou tokens no cache do service worker, no IndexedDB ou em filas de sincronização offline.
- Trate atualizações da PWA sem recarregar a página automaticamente durante o preenchimento de um registro; informe quando houver uma nova versão disponível.

## Telas do Checkpoint 2 (até 27/11/2026)

| Tela                                                              | Referência visual no repositório `prumo`                             |
| ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| Hoje: card "Seu dia" e resumo dos hábitos                         | `assets/mockups/desktop-hoje.png`, `assets/mockups/mobile-telas.png` |
| Registrar o dia: sono, atividade, água, alimentação, humor e tela | `assets/mockups/mobile-telas.png`                                    |
| Coach IA (chat)                                                   | `assets/mockups/mobile-telas.png`                                    |
| Histórico e gráficos                                              | ainda não desenhada                                                  |

O fluxo que precisa funcionar ao vivo: **login → registrar o dia → receber a análise → ver o histórico**.

## Regras do front

- **O front não calcula nota nem gera texto de IA.** Ele envia o registro à API e exibe o que volta. A nota é calculada no `prumo-api`.
- **Identidade visual:** use os tokens de `assets/mockups/src/prumo.css` do repositório `prumo` (copie para cá, não invente cores). Base branca, verde-esmeralda `#0B392E` como contraste, menta `#7FCFA8` como destaque, **sem dourado**. Fontes Cormorant Garamond (títulos) e Inter (texto). Logo e ícone em `assets/brand/` do `prumo`.
- **Acessibilidade (WCAG 2.2):** contraste de 4,5:1 para texto e 3:1 para bordas e gráficos; nunca indique estado só pela cor; foco visível; `lang="pt-BR"`.
- **Tom de voz:** acolhedor, nunca culpabilizante, frases curtas. O aviso **"O Prumo não substitui orientação médica."** fica sempre visível.
- **LGPD:** dados de saúde são sensíveis. Não guarde registros do usuário no navegador além do necessário para a sessão e não envie dados a terceiros (analytics, CDNs de rastreamento) sem combinar com o grupo. O cadastro tem termo de consentimento específico e destacado.
- **Textos da interface em português do Brasil.**

## Convenções

- Commits em português, no imperativo ("Adiciona…", "Corrige…"), com a identidade git pessoal do integrante.
- Rode lint e build antes de commitar.
- Não commite `node_modules/`, `dist/` nem `.env` com valores reais.
