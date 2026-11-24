import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { TaxonomyService } from '../../core/services/taxonomy.service';
import { environment } from '../../../environments/environment';

/**
 * Request data (client NOTED-17, item 10). Anyone may ask for the index data
 * behind a map; the request goes to the data sharing administrator
 * (admin@climatica.com), who replies by e-mail with a PDF.
 */
@Component({
  selector: 'app-request-data',
  standalone: true,
  imports: [FormsModule, RouterLink],
  styleUrl: '../admin/admin-shared.scss',
  template: `
  <section class="adm" style="max-width: 760px">
    <h2>Request data</h2>
    <p class="adm__hint">Ask for the index data behind a map: for each DS division the hazard index (H), exposure index (E),
      H × E and the present exposure index, with the profile weights, data sources, units and directions. Your request
      goes to the data sharing administrator (admin&#64;climatica.com), who will reply by e-mail.</p>
    @if (sent(); as m) {
      <p class="adm__ok" role="status">{{ m }}</p>
      <p><a routerLink="/map">Back to the map</a></p>
    } @else {
      <form class="adm__form" (submit)="$event.preventDefault(); send()">
        <label>Your name <input [ngModel]="name()" (ngModelChange)="name.set($event)" name="n" required /></label>
        <label>E-mail <input type="email" [ngModel]="email()" (ngModelChange)="email.set($event)" name="e" required /></label>
        <label>Organisation <input [ngModel]="org()" (ngModelChange)="org.set($event)" name="o" /></label>
        <label>Province
          <select [ngModel]="province()" (ngModelChange)="province.set($event)" name="p">
            <option [ngValue]="''">Select…</option>
            @for (p of provinces(); track p.code) { <option [ngValue]="p.code">{{ p.name }}</option> }
          </select></label>
        <label>Sector
          <select [ngModel]="sector()" (ngModelChange)="sector.set($event); subsector.set('')" name="s">
            <option [ngValue]="''">Select…</option>
            @for (s of sectors(); track s.code) { <option [ngValue]="s.code">{{ s.name }}</option> }
          </select></label>
        <label>Subsector
          <select [ngModel]="subsector()" (ngModelChange)="subsector.set($event)" name="ss" [disabled]="!subsectors().length">
            <option [ngValue]="''">{{ subsectors().length ? 'Select…' : '—' }}</option>
            @for (s of subsectors(); track s.code) { <option [ngValue]="s.code">{{ s.name }}</option> }
          </select></label>
        <label>Hazard
          <select [ngModel]="hazard()" (ngModelChange)="hazard.set($event)" name="h">
            <option [ngValue]="''">Select…</option>
            @for (h of hazards(); track h.code) { <option [ngValue]="h.code">{{ h.name }}</option> }
          </select></label>
        <label>Period
          <select [ngModel]="period()" (ngModelChange)="period.set($event)" name="pe">
            @for (p of periods(); track p) { <option [ngValue]="p">{{ p }}</option> }
          </select></label>
        <label style="grid-column: 1 / -1">What will you use the data for?
          <textarea rows="3" [ngModel]="purpose()" (ngModelChange)="purpose.set($event)" name="pu"></textarea></label>
        <div class="adm__actions" style="grid-column: 1 / -1">
          <button class="adm__btn" type="submit" [disabled]="busy()">{{ busy() ? 'Sending…' : 'Send request' }}</button>
        </div>
      </form>
      @if (error(); as e) { <p class="adm__error" role="alert">{{ e }}</p> }
    }
  </section>`,
})
export class RequestDataComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly taxonomyService = inject(TaxonomyService);
  private readonly base = environment.apiBaseUrl;

  readonly name = signal(''); readonly email = signal(''); readonly org = signal('');
  readonly purpose = signal('');
  readonly province = signal(''); readonly sector = signal(''); readonly subsector = signal('');
  readonly hazard = signal(''); readonly period = signal('');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly sent = signal<string | null>(null);

  readonly provinces = computed(() => this.taxonomyService.taxonomy()?.provinces ?? []);
  readonly sectors = computed(() => this.taxonomyService.taxonomy()?.sectors ?? []);
  readonly subsectors = computed(() => this.sectors().find((s) => s.code === this.sector())?.subsectors ?? []);
  readonly hazards = computed(() => this.taxonomyService.taxonomy()?.hazards ?? []);
  readonly periods = computed(() => this.taxonomyService.taxonomy()?.periods ?? []);

  ngOnInit(): void {
    this.taxonomyService.load();
    const q = this.route.snapshot.queryParamMap;
    this.province.set(q.get('province') ?? '');
    this.sector.set(q.get('sector') ?? '');
    this.subsector.set(q.get('subsector') ?? '');
    this.hazard.set(q.get('hazard') ?? '');
    this.period.set(q.get('period') ?? '');
  }

  send(): void {
    this.error.set(null);
    const period = this.period() || this.periods()[0] || '';
    if (!this.name().trim() || !this.email().includes('@') || this.purpose().trim().length < 5
        || !this.province() || !this.sector() || !this.hazard() || !period
        || (this.subsectors().length > 0 && !this.subsector())) {
      this.error.set('Please fill in your name, e-mail, the map you need and what you will use it for.');
      return;
    }
    this.busy.set(true);
    this.http.post<{ message: string }>(`${this.base}/data-requests`, {
      full_name: this.name().trim(), email: this.email().trim(), organization: this.org().trim() || null,
      purpose: this.purpose().trim(), province: this.province(), sector: this.sector(),
      subsector: this.subsector() || null, hazard: this.hazard(), period,
    }).subscribe({
      next: (r) => { this.busy.set(false); this.sent.set(r.message); },
      error: (e) => { this.busy.set(false); this.error.set(e?.error?.detail ?? e?.message ?? 'Not sent.'); },
    });
  }
}
