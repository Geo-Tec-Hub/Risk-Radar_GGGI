// Production build. The API host is never hardcoded here (SRS §4.4, Stage
// 5.1) -- the app is served behind the same reverse proxy as the API, so a
// relative base path is all that's needed. If the API instead lives on a
// separate origin in a given deployment, override this at build time via a
// separate environment.*.ts, not by editing this file per-deploy.
export const environment = {
  production: true,
  apiBaseUrl: '/api',
};

