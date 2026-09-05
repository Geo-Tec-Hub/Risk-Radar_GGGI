// Dev build (`ng serve`). Also a relative path -- proxy.conf.json forwards
// /api to the FastAPI dev server (see README) so no host is hardcoded here
// either. Change the target in proxy.conf.json, not this file, if the
// backend runs on a different port locally.
export const environment = {
  production: false,
  apiBaseUrl: '/api',
};

