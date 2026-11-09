# Integração segura da Escola Bíblica / Biblioteca Digital

Este guia descreve a integração preparada para a aplicação que está atualmente em `src/App.jsx`. Nenhum projeto Supabase foi criado, selecionado, conectado, alterado ou publicado durante esta etapa.

## O que já existe no código

- `@supabase/supabase-js` já está declarado em `package.json`.
- `src/lib/supabaseClient.js` cria o cliente somente quando as duas variáveis públicas estão configuradas. Não existe mais URL/chave de projeto como fallback no código.
- O painel administrativo usa Supabase Auth com e-mail e senha e verifica `profiles.role = 'admin'`.
- A aplicação observa mudanças de sessão com `onAuthStateChange`.
- A biblioteca usa o bucket privado `biblioteca-digital`.
- Links individuais usam tokens de 32 bytes aleatórios (64 caracteres hexadecimais). A consulta do conteúdo e a gravação do progresso por aula foram movidas para uma Edge Function server-side; o navegador não consulta diretamente as tabelas de tokens ou progresso.

## Arquivos de banco — atenção

- `supabase/platform_schema.sql`: esquema preparado para a aplicação atual (`digital_products`, `store_settings`, `customer_access`, `library_files`, perfis e bucket privado).
- `supabase/schema.sql`: esquema anterior da primeira versão de cursos, módulos e aulas. Foi preservado, mas não é o esquema que corresponde às tabelas atualmente usadas em `src/App.jsx`.

Não execute os dois arquivos juntos sem uma decisão de arquitetura. Para a aplicação atual, revise primeiro `platform_schema.sql`.

**Nenhum dos arquivos SQL foi executado em um banco.** Eles são apenas preparação versionada no GitHub.

## Configuração do navegador

Quando o proprietário escolher e confirmar o projeto Supabase:

1. Abra o diálogo **Connect** do projeto e copie a Project URL e a **publishable key**.
2. Na cópia local do repositório, crie `.env.local` na raiz:

   ```dotenv
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_sua_chave
   ```

3. Configure as mesmas duas variáveis no ambiente de build/hosting usado para publicar o frontend.
4. Reinicie o servidor Vite depois de alterar variáveis de ambiente.

A publishable key é pública por definição e pode chegar ao navegador. Ela não é uma senha administrativa: a segurança depende das permissões mínimas, RLS e políticas de Storage.

**Nunca** coloque `sb_secret_...`, `service_role` ou qualquer chave secreta em `VITE_*`, no React, no HTML, no GitHub ou em variáveis de frontend.

## Banco e primeiro administrador

1. Depois de confirmar o projeto de destino, revise e execute `supabase/platform_schema.sql` no SQL Editor.
2. Confirme que o schema `public` está habilitado para a Data API. Os grants explícitos e as políticas RLS estão no script.
3. Crie a primeira conta de administrador em Authentication > Users, usando o e-mail autorizado pelo proprietário.
4. O trigger cria o perfil como `student`. Depois, o proprietário promove a conta no SQL Editor, substituindo o e-mail:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = (
     select id from auth.users
     where email = 'EMAIL_DO_ADMIN'
   );
   ```

A promoção deve ser feita pelo proprietário em ambiente confiável. Não há cadastro público que permita escolher a função `admin`; o campo de função não vem do formulário nem de `user_metadata`.

## Links individuais e Edge Function

O endpoint `supabase/functions/get-customer-access-content/index.ts` valida o token de acesso e retorna somente nome do comprador e conteúdo autorizado. A tabela `customer_access` permanece restrita a administradores por RLS.

- `supabase/config.toml` define `verify_jwt = false` somente para esta função, porque o comprador usa um token de acesso individual em vez de uma conta Supabase.
- A função valida o formato de token de 256 bits e consulta apenas um acesso ativo.
- A função usa a chave secreta do projeto no runtime server-side (`SUPABASE_SECRET_KEYS`, chave `default`). Nunca copie essa chave para o frontend ou para o repositório.
- O bucket `biblioteca-digital` é privado e as políticas permitem operações somente a administradores autenticados.

Antes de usar o CLI, confira a versão e os comandos disponíveis com `supabase --version` e `supabase --help`. O CLI v3 passou a priorizar a stack local e pede confirmação para alterações hospedadas; revise qualquer confirmação e não aceite operações em projeto diferente do escolhido pelo proprietário.

Depois de vincular localmente o CLI ao projeto escolhido, implante apenas a função necessária:

```bash
supabase link --project-ref ID_DO_PROJETO
supabase functions deploy get-customer-access-content
```

A função deve ser implantada no mesmo projeto configurado nas variáveis do frontend. Não execute esses comandos até o proprietário confirmar o projeto.

## Verificações antes de liberar

- Testar login com a conta administradora e com uma conta comum.
- Confirmar que conta comum não consegue abrir o painel, consultar tokens, alterar produtos, acessar biblioteca ou fazer upload.
- Confirmar que visitantes só veem produtos publicados e configurações públicas de pagamento/contato.
- Testar link válido, link bloqueado, token inválido e token inexistente.
- Marcar e desmarcar aulas e confirmar que o progresso continua salvo ao recarregar o link.
- Testar upload, URL assinada e exclusão de arquivos no bucket privado.
- Rodar os Supabase Security Advisors e testes RLS após aplicar o SQL.
- Gerar e versionar um lockfile de dependências antes da publicação. No estado inspecionado desta branch, `package-lock.json` ainda não existe.

## Estado atual e pendências

- O frontend está preparado para não tentar conectar quando faltam URL/chave; nessa situação, exibe aviso em vez de usar um projeto embutido.
- A integração de Auth e as consultas do painel já estão no React, mas dependem de variáveis corretas e de um banco com o esquema correspondente.
- O esquema `platform_schema.sql` ainda não foi aplicado.
- A Edge Function ainda não foi implantada.
- Nenhum segredo foi adicionado ao GitHub.
- Nenhum build ou teste funcional foi executado nesta etapa.

A organização já estava no limite de dois projetos gratuitos ativos. Por isso, este trabalho não cria, pausa, exclui, reutiliza nem atualiza projeto Supabase algum. A próxima ação externa necessária é o proprietário decidir qual projeto próprio será autorizado para a Escola Bíblica.

## Documentação oficial

- React + Supabase Auth: https://supabase.com/docs/guides/auth/quickstarts/react
- API keys: https://supabase.com/docs/guides/getting-started/api-keys
- Segurança da Data API: https://supabase.com/docs/guides/api/securing-your-api
- RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Secrets de Edge Functions: https://supabase.com/docs/guides/functions/secrets
- Deploy de Edge Functions: https://supabase.com/docs/guides/functions/deploy
