import { HttpClient } from '@angular/common/http';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { InterestArea, InterestAreaOption, WriteScope } from '../../core/models/auth.model';
import { AdminUser, CatalogItem, HazardType, RoleOption } from '../../core/models/catalog.model';
import { ProfileScope } from '../../core/models/profile.model';
import { Hazard } from '../../core/models/reference-data.model';
import { scopeToQueryParams } from '../../core/models/query-param.util';
import { ApiClientService } from '../../core/services/api-client.service';
import { TaxonomyService } from '../../core/services/taxonomy.service';

/**
 * Admin — the model behind the map: which variables a profile carries, which
 * hazards exist, and who may write what.
 *
 * WHY ADDING A VARIABLE DOES NOT SET ITS WEIGHT HERE.
 * Adding a variable is administrative; deciding what it is worth is a panel
 * decision, recorded against a named person and a new profile version. So this
 * screen hands the chosen codes to the weights editor, where the existing
 * "every row weighted or excluded, both blocks total 100" rule applies
 * unchanged and the save writes one audited version. Duplicating a weight field
 * here would give the project two ways to set a weight, and the second one
 * would eventually disagree with the first.
 *
 * WHY A NEW VARIABLE IS 'pending' AND NOT USABLE IMMEDIATELY.
 * A code is forever — values key to it, templates carry a column for it, and
 * profiles cite it in their audit trail. A duplicate or typo'd code does not
 * read as a mistake afterwards; it reads as a second variable, and one fact is
 * quietly split in two. Anyone who writes data may propose; an administrator
 * makes it real.
 */
@Component({
  selector: 'app-admin-model',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-model.component.html',
  styleUrl: './admin-model.component.scss',
})
export class AdminModelComponent implements OnInit {
  private readonly api = inject(ApiClientService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly taxonomyService = inject(TaxonomyService);

  readonly taxonomy = this.taxonomyService.taxonomy;
  readonly provinces = computed(() => this.taxonomy()?.provinces ?? []);
  readonly sectors = computed(() => this.taxonomy()?.sectors ?? []);
  readonly hazardOptions = computed(() => this.taxonomy()?.hazards ?? []);

  // ---- section 1: a profile's variables ---------------------------------
  readonly province = signal<string | undefined>(undefined);
  readonly sector = signal<string | undefined>(undefined);
  readonly subsector = signal<string | undefined>(undefined);
  readonly hazard = signal<string | undefined>(undefined);
  readonly subsectorOptions = computed(
    () => this.sectors().find((s) => s.code === this.sector())?.subsectors ?? [],
  );

  readonly profileVariables = signal<CatalogItem[]>([]);
  readonly profileVersion = signal<number | null>(null);
  readonly profileError = signal<string | null>(null);
  readonly loadingProfile = signal(false);
  /** Codes ticked in the catalogue list, waiting to be sent to the weights editor. */
  readonly selected = signal<string[]>([]);

  readonly scope = computed<ProfileScope | null>(() => {
    const p = this.province(), s = this.sector(), h = this.hazard();
    if (!p || !s || !h) return null;
    // `Hazard` is a hardcoded union of drought | flood | landslide
    // (reference-data.model.ts), so a hazard added on this very screen does not
    // widen it. The cast is honest about that: at runtime the code travels
    // fine, and the API and database accept it -- but until that union is
    // driven from the taxonomy, a new hazard is typed as one of the three.
    // Noted rather than papered over; widening it is its own change.
    return { province: p, sector: s, hazard: h as Hazard, subsector: this.subsector() || undefined };
  });

  // ---- section 2: the catalogue -----------------------------------------
  readonly catalog = signal<CatalogItem[]>([]);
  readonly catalogQuery = signal('');
  readonly catalogDomain = signal<'' | 'hazard' | 'exposure'>('');
  readonly catalogBusy = signal(false);
  readonly catalogError = signal<string | null>(null);

  readonly pending = computed(() => this.catalog().filter((c) => c.status === 'pending'));
  readonly inProfile = computed(() => new Set(this.profileVariables().map((v) => v.code)));
  readonly addable = computed(() =>
    this.catalog().filter((c) => c.status === 'active' && !this.inProfile().has(c.code)),
  );

  readonly newVar = signal({ code: '', name: '', domain: 'exposure' as 'hazard' | 'exposure', unit: '' });
  readonly proposeMessage = signal<string | null>(null);
  readonly proposeError = signal<string | null>(null);

  // ---- section 3: hazard types ------------------------------------------
  readonly hazards = signal<HazardType[]>([]);
  readonly newHazard = signal({ code: '', name: '' });
  readonly hazardMessage = signal<string | null>(null);
  readonly hazardError = signal<string | null>(null);

  // ---- section 4: people -------------------------------------------------
  readonly users = signal<AdminUser[]>([]);
  readonly userProvince = signal('');
  readonly userSector = signal('');
  readonly userError = signal<string | null>(null);
  /** Roles come from the `role` table, not a list typed in here: a hardcoded
   * one drifts the first time a role is added, and the drift shows up as a role
   * nobody can assign. */
  readonly roles = signal<RoleOption[]>([]);
  readonly roleDraft = signal<Record<number, string>>({});

  /** The account whose sectors are open for editing, and its scope as granted.
   * One at a time: a table of open editors invites saving the wrong row. */
  readonly editingUser = signal<AdminUser | null>(null);
  readonly editScope = signal<WriteScope | null>(null);
  readonly draftAreas = signal<InterestArea[]>([]);
  readonly draftHazardDomain = signal(false);
  readonly areaOptions = signal<InterestAreaOption[]>([]);
  readonly addSector = signal('');
  readonly addSubsector = signal('');
  readonly scopeBusy = signal(false);
  readonly scopeError = signal<string | null>(null);
  readonly scopeMessage = signal<string | null>(null);

  readonly addSubsectorOptions = computed(
    () => this.areaOptions().find((a) => a.code === this.addSector())?.subsectors ?? [],
  );

  /** A whole-sector grant already covers every subsector under it, so offering
   * to add one on top would create a row that grants nothing new and reads as
   * if it narrowed something. */
  readonly alreadyWholeSector = computed(() =>
    this.draftAreas().some((a) => a.sector === this.addSector() && !a.subsector),
  );

  constructor() {
    effect(() => {
      const t = this.taxonomy();
      if (!t || this.sector() !== undefined) return;
      this.province.set(t.provinces[0]?.code);
      this.sector.set(t.sectors[0]?.code);
      this.subsector.set(t.sectors[0]?.subsectors[0]?.code);
      this.hazard.set(t.hazards[0]?.code);
      this.loadProfile();
    });
  }

  ngOnInit(): void {
    this.taxonomyService.load();
    this.searchCatalog();
    this.loadHazards();
    this.loadUsers();
    this.api.getRoles().subscribe({ next: (r) => this.roles.set(r), error: () => this.roles.set([]) });
    this.api.getInterestAreaOptions().subscribe({
      next: (a) => this.areaOptions.set(a),
      error: () => this.areaOptions.set([]),
    });
  }

  // ---- section 1 ---------------------------------------------------------
  onSectorChange(code: string): void {
    this.sector.set(code || undefined);
    this.subsector.set(this.subsectorOptions()[0]?.code);
    this.loadProfile();
  }

  loadProfile(): void {
    const scope = this.scope();
    if (!scope) return;
    this.loadingProfile.set(true);
    this.profileError.set(null);
    this.selected.set([]);
    this.api.getProfileWeights(scope).subscribe({
      next: (w) => {
        this.profileVersion.set(w.profileVersion);
        // Reused as a display shape only — the weights themselves are the
        // weights editor's business, not this screen's.
        this.profileVariables.set(
          [...w.hazardVariables, ...w.exposureVariables].map((v) => ({
            id: 0,
            code: v.indicatorCode,
            name: v.indicatorName,
            domain: v.domain as 'hazard' | 'exposure',
            unit: v.unit,
            direction: v.relationship,
            status: 'active' as const,
            usedInProfiles: 0,
          })),
        );
        this.loadingProfile.set(false);
      },
      error: (err) => {
        this.profileVariables.set([]);
        this.profileVersion.set(null);
        this.profileError.set(err.message ?? 'This profile could not be loaded.');
        this.loadingProfile.set(false);
      },
    });
  }

  toggleSelected(code: string): void {
    const cur = this.selected();
    this.selected.set(cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code]);
  }

  /** Hand the chosen variables to the weights editor. Nothing is written here:
   * the profile changes only when the panel saves a new version there. */
  addToProfile(): void {
    const scope = this.scope();
    if (!scope || this.selected().length === 0) return;
    this.router.navigate(['/weights'], {
      queryParams: { ...scopeToQueryParams(scope), add: this.selected().join(',') },
    });
  }

  // ---- section 2 ---------------------------------------------------------
  searchCatalog(): void {
    this.catalogBusy.set(true);
    this.catalogError.set(null);
    this.api
      .getCatalog({
        q: this.catalogQuery().trim() || undefined,
        domain: this.catalogDomain() || undefined,
      })
      .subscribe({
        next: (items) => {
          this.catalog.set(items);
          this.catalogBusy.set(false);
        },
        error: (err) => {
          this.catalogError.set(err.message ?? 'The catalogue could not be loaded.');
          this.catalogBusy.set(false);
        },
      });
  }

  propose(): void {
    const v = this.newVar();
    this.proposeError.set(null);
    this.proposeMessage.set(null);
    if (!v.code.trim() || !v.name.trim()) {
      this.proposeError.set('A new variable needs both a code and a name.');
      return;
    }
    this.api
      .proposeVariable({
        code: v.code.trim().toUpperCase(),
        name: v.name.trim(),
        domain: v.domain,
        unit: v.unit.trim() || undefined,
      })
      .subscribe({
        next: (item) => {
          this.proposeMessage.set(
            `${item.code} proposed. It is pending until an administrator approves it — only then can it carry a weight.`,
          );
          this.newVar.set({ code: '', name: '', domain: 'exposure', unit: '' });
          this.searchCatalog();
        },
        error: (err) => this.proposeError.set(err?.error?.detail ?? err.message ?? 'It could not be proposed.'),
      });
  }

  setStatus(item: CatalogItem, status: string): void {
    this.catalogError.set(null);
    this.api.setVariableStatus(item.id, status).subscribe({
      next: () => this.searchCatalog(),
      error: (err) => this.catalogError.set(err?.error?.detail ?? err.message ?? 'The change was refused.'),
    });
  }

  // ---- section 3 ---------------------------------------------------------
  loadHazards(): void {
    this.api.getHazards().subscribe({
      next: (h) => this.hazards.set(h),
      error: () => this.hazards.set([]),
    });
  }

  addHazard(): void {
    const h = this.newHazard();
    this.hazardError.set(null);
    this.hazardMessage.set(null);
    if (!h.code.trim() || !h.name.trim()) {
      this.hazardError.set('A hazard needs both a code and a name.');
      return;
    }
    this.api.addHazard({ code: h.code.trim(), name: h.name.trim() }).subscribe({
      next: (created) => {
        this.hazardMessage.set(
          `${created.name} added. It scores nothing yet: a profile is sector × hazard × province, so it stays out of every filter until profiles are built and weighted for it.`,
        );
        this.newHazard.set({ code: '', name: '' });
        this.loadHazards();
      },
      error: (err) => this.hazardError.set(err?.error?.detail ?? err.message ?? 'It could not be added.'),
    });
  }

  // ---- section 4 ---------------------------------------------------------
  loadUsers(): void {
    this.userError.set(null);
    this.api
      .getUsers({
        province: this.userProvince() || undefined,
        sector: this.userSector() || undefined,
      })
      .subscribe({
        next: (u) => {
          this.users.set(u);
          this.roleDraft.set(Object.fromEntries(u.map((x) => [x.id, x.roles[0] ?? ''])));
        },
        error: (err) => {
          this.users.set([]);
          this.userError.set(err.message ?? 'Accounts could not be loaded — administrator only.');
        },
      });
  }

  onRoleDraft(id: number, value: string): void {
    this.roleDraft.set({ ...this.roleDraft(), [id]: value });
  }

  saveRoles(u: AdminUser): void {
    const chosen = this.roleDraft()[u.id] ?? '';
    this.userError.set(null);
    if (!chosen) {
      this.userError.set('Choose a role first.');
      return;
    }
    // An account carries one role in practice -- the approval screen assigns
    // exactly one -- so the picker is single-select. The API still takes a set,
    // which is what the schema allows; sending one is a deliberate narrowing,
    // not an accident, and the warning below fires if that would drop a second.
    this.api.setUserRoles(u.id, [chosen]).subscribe({
      next: () => this.loadUsers(),
      error: (err) => this.userError.set(err?.error?.detail ?? err.message ?? 'The roles could not be changed.'),
    });
  }

  /** True when saving the single chosen role would silently remove others. */
  wouldDropRoles(u: AdminUser): boolean {
    return u.roles.length > 1;
  }

  // ---- sector grants -----------------------------------------------------
  editSectors(u: AdminUser): void {
    this.scopeError.set(null);
    this.scopeMessage.set(null);
    this.editingUser.set(u);
    this.editScope.set(null);
    this.draftAreas.set([]);
    this.api.getUserScope(u.id).subscribe({
      next: (scope) => {
        this.editScope.set(scope);
        this.draftAreas.set(
          scope.areas.map((a) => ({ sector: a.sector, subsector: a.subsector ?? undefined })),
        );
        this.draftHazardDomain.set(scope.may_write_hazard_domain);
      },
      error: (err) => this.scopeError.set(err?.error?.detail ?? err.message ?? 'The scope could not be read.'),
    });
  }

  cancelSectors(): void {
    this.editingUser.set(null);
    this.editScope.set(null);
    this.draftAreas.set([]);
  }

  addArea(): void {
    const sector = this.addSector();
    if (!sector) return;
    const subsector = this.addSubsector() || undefined;
    const exists = this.draftAreas().some(
      (a) => a.sector === sector && (a.subsector ?? '') === (subsector ?? ''),
    );
    if (exists) return;
    let next = [...this.draftAreas(), { sector, subsector }];
    if (!subsector) {
      // Granting the whole sector supersedes any narrower rows under it;
      // leaving them would show two grants where the wider one is the truth.
      next = next.filter((a) => a.sector !== sector || !a.subsector);
    }
    this.draftAreas.set(next);
    this.addSubsector.set('');
  }

  removeArea(area: InterestArea): void {
    this.draftAreas.set(
      this.draftAreas().filter(
        (a) => !(a.sector === area.sector && (a.subsector ?? '') === (area.subsector ?? '')),
      ),
    );
  }

  areaLabel(a: InterestArea): string {
    const opt = this.areaOptions().find((o) => o.code === a.sector);
    const sector = opt?.name ?? a.sector;
    if (!a.subsector) return sector + ' (all subsectors)';
    const sub = opt?.subsectors.find((s) => s.code === a.subsector);
    return sector + ' / ' + (sub?.name ?? a.subsector);
  }

  saveSectors(): void {
    const u = this.editingUser();
    if (!u) return;
    this.scopeBusy.set(true);
    this.scopeError.set(null);
    this.scopeMessage.set(null);
    // The payload REPLACES the whole scope, which is why the screen shows the
    // full set: what the administrator sees is what the account ends up with,
    // and revoking needs no second control nobody remembers to use.
    this.api
      .setUserScope(u.id, {
        scopes: this.draftAreas(),
        may_write_hazard_domain: this.draftHazardDomain(),
      })
      .subscribe({
        next: () => {
          this.scopeBusy.set(false);
          this.scopeMessage.set(u.fullName + "'s sectors updated.");
          this.editingUser.set(null);
          this.loadUsers();
        },
        error: (err) => {
          this.scopeBusy.set(false);
          this.scopeError.set(err?.error?.detail ?? err.message ?? 'The sectors could not be saved.');
        },
      });
  }
}
