import { Component } from '@angular/core';

/**
 * Placeholder for FR-5.17's coverage screen ("where is data missing, by
 * province and profile") -- Stage 5.6 in PROGRESS_TRACKER.md, not built yet.
 * Exists as its own route now so the rest of the app can link to it.
 */
@Component({
  selector: 'app-coverage-page',
  standalone: true,
  template: `
    <div class="coverage-placeholder">
      <h2>Coverage</h2>
      <p>Not built yet — SRS Stage 5.6.</p>
    </div>
  `,
  styles: `
    .coverage-placeholder {
      padding: 2rem;
      color: #495057;
    }
  `,
})
export class CoveragePageComponent {}
