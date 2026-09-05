import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { BackendStatusComponent } from './shared/backend-status.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BackendStatusComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    // Whether anyone is signed in is a question only the server can answer
    // (FR-5.21) -- ask once at startup rather than assuming signed-out.
    this.auth.refreshMe().subscribe();
  }

  signOut(): void {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/'));
  }
}
