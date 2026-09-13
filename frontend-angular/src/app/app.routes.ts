import { Routes } from '@angular/router';

import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing-page.component').then((m) => m.LandingPageComponent),
    title: 'Risk Radar',
    pathMatch: 'full',
  },
  {
    path: 'map',
    // Moved from '/' (T2b): the landing page is now the front door, but the
    // map must stay one click away with no account (FR-12.7, §3.1).
    loadComponent: () => import('./features/map/map-page.component').then((m) => m.MapPageComponent),
    title: 'Risk Radar — Climate Vulnerability Map',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-page.component').then((m) => m.LoginPageComponent),
    title: 'Risk Radar — Sign in',
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register-page.component').then((m) => m.RegisterPageComponent),
    title: 'Risk Radar — Register',
  },
  {
    path: 'admin/registrations',
    loadComponent: () =>
      import('./features/admin/admin-registrations.component').then((m) => m.AdminRegistrationsComponent),
    title: 'Risk Radar — Registrations',
    canActivate: [adminGuard],
  },
  {
    // The model behind the map: profile variables, hazard types, and who may
    // write what. Separate from /admin/registrations, which approves accounts.
    path: 'admin/model',
    loadComponent: () => import('./features/admin/admin-model.component').then((m) => m.AdminModelComponent),
    title: 'Risk Radar — Model administration',
    canActivate: [adminGuard],
  },
  {
    path: 'coverage',
    // FR-5.17 / Stage 5.6: why each profile in a province is or is not on the
    // map -- weights unfinished, values missing, or simply not recomputed.
    loadComponent: () => import('./features/coverage/coverage-page.component').then((m) => m.CoveragePageComponent),
    title: 'Risk Radar — Coverage',
  },
  {
    // '/entry' WAS a scope picker that resolved province/sector/subsector/
    // hazard/period and then handed them to this screen or to /weights through
    // the URL. Import grew the same picker of its own, so the step became one
    // extra click that asked for exactly what the next screen asked for again.
    // Redirected rather than deleted: /weights, /admin/model and the post-login
    // landing for officers all still point at it, and query params survive a
    // router redirect, so a link carrying a scope still arrives with it.
    path: 'entry',
    redirectTo: 'import',
    pathMatch: 'full',
  },
  {
    // The import tab: pick a scope, check the workbook, load it.
    path: 'import',
    loadComponent: () => import('./features/import/import-page.component').then((m) => m.ImportPageComponent),
    title: 'Risk Radar — Import data',
  },
  {
    path: 'weights',
    loadComponent: () => import('./features/weights/weights-editor.component').then((m) => m.WeightsEditorComponent),
    title: 'Risk Radar — Profile weights',
  },
  {
    // The earlier upload screen, kept reachable but no longer at '/import'.
    // It was a SECOND route with that same path: the router takes the first
    // match, so it had become dead code that still compiled, still passed
    // type-checking and would have been found only by someone wondering why
    // their edits to it changed nothing. It targets `POST /imports`, which the
    // backend does not implement — the live tab uses /api/import/check|load.
    path: 'import/legacy-upload',
    loadComponent: () => import('./features/import/import-upload.component').then((m) => m.ImportUploadComponent),
    title: 'Risk Radar — Import (legacy screen)',
  },
  { path: '**', redirectTo: '' },
];
