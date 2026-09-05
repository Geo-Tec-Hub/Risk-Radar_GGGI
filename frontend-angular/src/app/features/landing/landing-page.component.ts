import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

/**
 * T2b: '/' is the landing page, not a gate -- the map is one click away
 * with no account (FR-12.7, §3.1). Authentication controls contribution
 * (entering values, running toolbox jobs, approving registrations), not
 * viewing.
 */
@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
})
export class LandingPageComponent {
  readonly auth = inject(AuthService);
}
