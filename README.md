# Escola Bíblica

Biblioteca digital responsiva para publicar cursos, videoaulas, e-books e documentários, com painel administrativo, pagamentos via Pix, liberação individual de conteúdo e biblioteca privada de arquivos.

## Tecnologias

- React + Vite
- Supabase Auth e Postgres
- Supabase Storage (bucket privado)
- Supabase Edge Functions para validar links individuais e salvar progresso de aulas

## Desenvolvimento local

1. Instale Node.js 22 ou superior.
2. Instale as dependências:

   ```bash
   npm install
   ```

3. Copie `.env.example` para `.env.local` e preencha a Project URL e a publishable key do projeto Supabase que o proprietário autorizou:

   ```dotenv
   VITE_SUPABASE_URL=
   VITE_SUPABASE_PUBLISHABLE_KEY=
   ```

4. Inicie a aplicação:

   ```bash
   npm run dev
   ```

Sem essas duas variáveis, a aplicação mostra um aviso de configuração e não tenta usar um projeto embutido no código.

## Preparação do Supabase

- Para a aplicação atual, revise `supabase/platform_schema.sql`.
- `supabase/schema.sql` é o esquema legado da primeira versão de cursos/módulos/aulas; não execute os dois scripts juntos sem revisar a arquitetura.
- A função `supabase/functions/get-customer-access-content/index.ts` valida tokens individuais e grava o progresso do aluno no servidor.
- `supabase/config.toml` desativa a verificação JWT somente nessa função; o acesso é protegido por token aleatório de 256 bits.
- A chave publishable é pública e pode estar no frontend. Chaves secretas nunca podem estar em variáveis `VITE_*`, no React ou no GitHub.

Leia [docs/INTEGRACAO_SUPABASE.md](docs/INTEGRACAO_SUPABASE.md) antes de conectar ou implantar qualquer recurso.

## Situação desta branch

A estrutura do frontend, as políticas RLS propostas e a Edge Function estão preparadas no código. Nenhum projeto Supabase foi alterado, o SQL não foi executado e a função não foi implantada. A conexão real depende da escolha e autorização do projeto pelo proprietário.
