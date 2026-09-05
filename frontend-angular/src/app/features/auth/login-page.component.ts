import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ApiError } from '../../core/models/api-error.model';
import { AuthService } from '../../core/services/auth.service';

/** T2b: POST /auth/login. Redirects by role on success (FR-12.8). */
@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly email = signal('');
  readonly password = signal('');
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  submit(): void {
    if (!this.email() || !this.password()) return;

    this.submitting.set(true);
    this.error.set(null);

    this.auth.login({ email: this.email(), password: this.password() }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigateByUrl(this.auth.landingRouteForCurrentUser());
      },
      error: (err: ApiError) => {
        this.error.set(err.message);
        this.submitting.set(false);
      },
    });
  }
}
