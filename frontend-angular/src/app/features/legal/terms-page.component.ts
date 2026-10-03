import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { COMPANY_NAME, COMPANY_TAGLINE, CONTACT_EMAIL, TERMS_EFFECTIVE, TERMS_VERSION } from './terms';

@Component({
  selector: 'app-terms-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './terms-page.component.html',
  styleUrl: './terms-page.component.scss',
})
export class TermsPageComponent {
  readonly company = COMPANY_NAME;
  readonly tagline = COMPANY_TAGLINE;
  readonly email = CONTACT_EMAIL;
  readonly version = TERMS_VERSION;
  readonly effective = TERMS_EFFECTIVE;
  readonly year = new Date().getFullYear();
}
