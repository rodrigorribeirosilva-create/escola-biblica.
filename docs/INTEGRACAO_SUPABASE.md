# Integração segura com Supabase

Este guia prepara a conexão da Escola Bíblica sem alterar nenhum projeto Supabase. O arquivo `supabase/schema.sql` é apenas uma proposta versionada no GitHub: **ainda não foi executado em banco algum**.

## Situação atual

- A aplicação continua funcionando como demonstração local com dados em memória.
- A área do aluno, o progresso, os cursos e o painel administrativo ainda não persistem no banco.
- O pacote `@supabase/supabase-js` ainda não foi instalado.
- Não há URL nem chave de projeto configuradas.
- O projeto Supabase da Escola Bíblica ainda precisa ser escolhido/criado pelo proprietário.

## Quando o projeto Supabase estiver definido

1. No painel do projeto escolhido, abra **Connect** e copie a Project URL e a **publishable key**.
2. Na cópia local deste repositório, crie `.env.local` na raiz (não no GitHub) com:

   ```dotenv
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publishable
   ```

3. Instale `@supabase/supabase-js` numa alteração separada, fixe a versão e versione o lockfile.
4. Crie o cliente em `src/lib/supabaseClient.js` usando apenas essas duas variáveis.
5. Execute e revise `supabase/schema.sql` no SQL Editor **somente depois de confirmar o projeto de destino**.
6. Nas configurações de API, confirme que o schema `public` está exposto à Data API. Projetos recentes podem exigir exposição explícita.
7. Teste cada fluxo com duas contas diferentes (aluno e administrador) e valide as políticas RLS antes de liberar a plataforma.

## Regras de segurança obrigatórias

- Nunca colocar uma chave `service_role` ou uma chave `secret` em `VITE_*`, no React, no navegador ou no GitHub.
- A publishable key é destinada ao cliente público; ela **não** substitui as políticas RLS.
- Grants controlam se um papel alcança a tabela; RLS controla quais linhas esse papel pode ler ou alterar. Os dois controles são necessários.
- O cadastro público sempre deve criar perfil como `student`. Não confiar em `user_metadata` enviado pelo usuário para decidir permissões.
- A promoção de uma conta para `admin` deve ser feita pelo proprietário em ambiente administrativo confiável, nunca por um botão/formulário público.
- Não mostrar conteúdo de curso pago apenas porque a tela React escondeu um botão. A autorização precisa estar na política RLS do banco.
- Arquivos `.env` e `.env.local` ficam fora do Git; o `.gitignore` deste repositório já os ignora. O arquivo `.env.example` contém somente nomes de variáveis vazias.

## Decisões pendentes do proprietário

O plano gratuito da organização já atingiu o limite de dois projetos ativos. Portanto, esta etapa não cria, pausa, exclui, reutiliza nem altera projeto existente. Antes de conectar, o proprietário precisa decidir como disponibilizar um projeto próprio para a Escola Bíblica (por exemplo, liberar uma vaga ou escolher outro plano). Nenhuma credencial deve ser enviada no chat ou commitada no repositório.

## Referências oficiais

- React + Supabase Auth: https://supabase.com/docs/guides/auth/quickstarts/react
- Segurança da Data API (grants + RLS): https://supabase.com/docs/guides/api/securing-your-api
- Mudança de exposição automática de tabelas: https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically
