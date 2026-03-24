# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  # Advanced Topics in Web Applications – Final Project (FE)

  Frontend client for the Animon application.

  ## Local development

  ```bash
  npm install
  npm run dev
  ```

  ## Production build

  ```bash
  npm run build
  ```

  ## Deployment (Colman Ubuntu Server)

  This frontend is intended to be served by nginx as static files.

  ### 1. Server folder setup

  ```bash
  mkdir -p ~/apps
  mkdir -p /var/www/animon-fe
  ```

  ### 2. Clone frontend and configure env

  ```bash
  cd ~/apps
  git clone <YOUR_FE_REPO_URL> animon-fe
  cd animon-fe
  cp deploy/.env.production.example .env.production
  nano .env.production
  ```

  Default env value:

  - `VITE_API_BASE_URL=http://node01.cs.colman.ac.il/api`

  ### 3. Deploy static build

  ```bash
  chmod +x deploy/deploy_fe.sh
  ./deploy/deploy_fe.sh
  ```

  This script builds the project and syncs static assets into:

  - `/var/www/animon-fe/dist`

  ### 4. Nginx

  Nginx site is configured from the backend repository (`deploy/nginx_animon.conf`) and should point root to:

  - `/var/www/animon-fe/dist`

  ### Deployment files in this repo

  - `deploy/deploy_fe.sh`
  - `deploy/.env.production.example`
