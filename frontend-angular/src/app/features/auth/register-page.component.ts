import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ApiError } from '../../core/models/api-error.model';
import { RegistrationType } from '../../core/models/auth.model';
import { PROVINCE_OPTIONS, ProvinceOption } from '../../core/models/reference-data.model';
import { AuthService, REGISTRATION_TYPE_LABEL } from '../../core/services/auth.service';

const TYPES: readonly RegistrationType[] = ['agency', 'expert', 'public'];

/**
 * T2b: POST /auth/register. "type = agency / expert / public, creates
 * pending" -- agency and expert both need a province (SRS §3.2, enforced
 * again server-side regardless of what this form does); public is national.
 */
@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss',
})
export class RegisterPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly types = TYPES;
  readonly typeLabel = REGISTRATION_TYPE_LABEL;
  readonly provinces: readonly ProvinceOption[] = PROVINCE_OPTIONS;

  readonly email = signal('');
  readonly password = signal('');
  readonly fullName = signal('');
  readonly organization = signal('');
  readonly type = signal<RegistrationType>('public');
  readonly provinceId = signal<number | undefined>(undefined);

  readonly needsProvince = computed(() => this.type() !== 'public');

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly registeredEmail = signal<string | null>(null);

  readonly canSubmit = computed(() =>
    !!this.email() && this.password().length >= 8 && !!this.fullName()
    && (!this.needsProvince() || this.provinceId() !== undefined),
  );

  onTypeChange(value: RegistrationType): void {
    this.type.set(value);
    if (value === 'public') this.provinceId.set(undefined);
  }

  submit(): void {
    if (!this.canSubmit()) return;

    this.submitting.set(true);
    this.error.set(null);

    this.auth.register({
      email: this.email(),
      password: this.password(),
      full_name: this.fullName(),
      organization: this.organization() || undefined,
      type: this.type(),
      province_id: this.needsProvince() ? this.provinceId() : undefined,
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.registeredEmail.set(this.email());
      },
      error: (err: ApiError) => {
        this.error.set(err.message);
        this.submitting.set(false);
      },
    });
  }

  goToLogin(): void {
    this.router.navigateByUrl('/login');
  }
}
