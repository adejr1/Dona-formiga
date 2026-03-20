# Deploy na Vercel – passo a passo (do zero)

Siga **na ordem**. Se der erro, pare e anote em qual passo parou.

---

## ETAPA 1 – Conferir o build no seu PC

1. Abra o **PowerShell** ou **Prompt de Comando**.
2. Vá na pasta do projeto:
   ```
   cd "C:\Users\User\Desktop\ADE\dona formiga"
   ```
3. Rode:
   ```
   npm install
   npm run build
   ```
4. **Resultado esperado:** terminar sem erro e aparecer algo como `✓ built in ...`.
5. Se der erro aqui, **não siga** para a Etapa 2. Me mande a mensagem de erro.

---

## ETAPA 2 – Enviar só o necessário para o GitHub

1. Abra o **Git Bash** na pasta do projeto:
   - Abra a pasta `C:\Users\User\Desktop\ADE\dona formiga` no Explorer.
   - Clique com o botão direito em um espaço vazio → **Git Bash Here**.

2. Adicione **só** estes arquivos (não use `git add .`):
   ```
   git add .gitignore package.json vercel.json
   ```

3. Crie o commit:
   ```
   git commit -m "Ajustar build Vercel e gitignore"
   ```

4. Envie para o GitHub:
   ```
   git push origin main
   ```

5. Se pedir login do GitHub, faça. Ao terminar, deve aparecer um **novo commit** (hash diferente).

---

## ETAPA 3 – Configuração na Vercel (uma vez só)

1. Acesse **https://vercel.com** e entre no seu projeto **dona-formiga**.

2. Vá em **Configurações** (Settings) → **Build & Output Settings**.

3. Deixe **exatamente** assim:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. Clique em **Save** (Salvar).

---

## ETAPA 4 – Fazer um deploy novo (não “Retry”)

1. No projeto na Vercel, vá em **Deployments** (Implantações).

2. Clique em **Create Deployment** ou **Redeploy**:
   - Se aparecer **“Redeploy”**, clique e escolha **usar o commit mais recente** (não o deploy antigo).
   - O ideal é que um **novo deploy** tenha sido criado sozinho quando você deu `git push` na Etapa 2.

3. Abra o deploy mais recente e clique em **View Logs** (Ver logs).

4. Na primeira linha do log, procure:
   ```
   Cloning ... (Commit: XXXXX)
   ```
   - **XXXXX** deve ser um hash **novo** (diferente de `1eb6b96`).
   - Se ainda for `1eb6b96`, o push da Etapa 2 não subiu. Volte à Etapa 2.

5. Aguarde até o fim. Deve aparecer **Build Completed** ou **Ready**.

6. Se der **Build Failed**, copie **as últimas 30 linhas** do log e me envie.

---

## ETAPA 5 – Testar o link

1. Na Vercel, na página do deploy que deu certo, copie a **URL** (ex.: `https://dona-formiga-xxx.vercel.app`).

2. No navegador, abra:
   ```
   https://SUA-URL/cliente
   ```
   (troque SUA-URL pela URL que você copiou).

3. A página do pedido do cliente deve abrir.

---

## Resumo do que corrige o erro 126

- O script de build no `package.json` está assim:  
  `"build": "node node_modules/vite/bin/vite.js build"`
- Assim o Vercel não tenta executar o binário `vite` (que dava Permission denied).
- O `.gitignore` evita subir `node_modules` e `dist`, deixando o repositório limpo.

Se travar em algum passo, diga **em qual etapa** e **o que apareceu na tela ou no log**.
