# AGENTS.md — prumo-web

Front-end do **Prumo**, o coach de bem-estar com IA que responde "como estou hoje?" (FMU Tech Inovação 2026.2, ODS 3).

**Antes de qualquer tarefa, leia o contexto geral** em [Health-Prumo/prumo/AGENTS.md](https://github.com/Health-Prumo/prumo/blob/main/AGENTS.md): o que é o Prumo, decisões, identidade visual, LGPD, AWS e convenções. Este arquivo traz só o que é específico do front.

## Estado atual

Repositório recém-criado, **ainda sem código**. A primeira tarefa é montar o projeto com a stack abaixo.

## Stack definida

- **React + TypeScript com Vite**, web responsivo (sem app de loja), mobile primeiro.
- **Recharts** para os gráficos de evolução.
- **Login:** Amazon Cognito (na AWS). No desenvolvimento local, a API roda em `http://localhost:8000` ([prumo-api](https://github.com/Health-Prumo/prumo-api)).
- **Configuração** por variáveis `VITE_*` num `.env.example` versionado. Elas vão para o navegador: **nunca coloque segredo nelas**.
- **CI:** GitHub Actions com lint e build a cada push e pull request.
- **Hospedagem:** o build (`dist/`) vai para um bucket S3 privado servido pelo CloudFront, criado pelo Terraform ([tf-blueprint](https://github.com/Health-Prumo/tf-blueprint) e [tf-environments](https://github.com/Health-Prumo/tf-environments)).

## Telas do Checkpoint 2 (até 27/11/2026)

| Tela | Referência visual no repositório `prumo` |
|---|---|
| Hoje: card "Seu dia" e resumo dos hábitos | `assets/mockups/desktop-hoje.png`, `assets/mockups/mobile-telas.png` |
| Registrar o dia: sono, atividade, água, alimentação, humor e tela | `assets/mockups/mobile-telas.png` |
| Coach IA (chat) | `assets/mockups/mobile-telas.png` |
| Histórico e gráficos | ainda não desenhada |

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
