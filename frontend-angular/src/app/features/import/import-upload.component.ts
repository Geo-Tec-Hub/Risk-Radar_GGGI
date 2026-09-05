import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ApiClientService } from '../../core/services/api-client.service';
import { ApiError } from '../../core/models/api-error.model';
import { ImportBatch, ImportSummary } from '../../core/models/import.model';
import { scopeFromQueryParams } from '../../core/models/query-param.util';
import { ProfileScope } from '../../core/models/profile.model';

/**
 * F5 / DATA_ENTRY_WORKFLOW.md Step 3a: upload a workbook for the resolved
 * profile scope. "Nothing loads partially" -- any error response means the
 * whole file loaded nothing, and every failure is reported at once (row,
 * column, value), not just the first (FR-2.3).
 *
 * Depends on `POST /imports` (§9), which has no backend yet.
 */
@Component({
  selector: 'app-import-upload',
  standalone: true,
  templateUrl: './import-upload.component.html',
  styleUrl: './import-upload.component.scss',
})
export class ImportUploadComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiClientService);

  readonly scope = signal<ProfileScope | null>(null);
  readonly selectedFile = signal<File | null>(null);

  readonly uploading = signal(false);
  readonly uploadError = signal<string | null>(null);
  readonly batch = signal<ImportBatch | null>(null);

  readonly summary = signal<ImportSummary | null>(null);
  readonly summaryError = signal<string | null>(null);

  readonly rollingBack = signal(false);
  readonly rollbackError = signal<string | null>(null);

  constructor() {
    this.scope.set(scopeFromQueryParams(this.route.snapshot.queryParams));
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile.set(input.files?.[0] ?? null);
    this.batch.set(null);
    this.summary.set(null);
    this.uploadError.set(null);
  }

  upload(): void {
    const scope = this.scope();
    const file = this.selectedFile();
    if (!scope || !file) return;

    this.uploading.set(true);
    this.uploadError.set(null);
    this.batch.set(null);

    this.api.uploadImport(scope, file).subscribe({
      next: (batch) => {
        this.batch.set(batch);
        this.uploading.set(false);
        if (batch.status === 'loaded') {
          this.loadSummary(batch.id);
        }
      },
      error: (err: ApiError) => {
        this.uploadError.set(err.message);
        this.uploading.set(false);
      },
    });
  }

  private loadSummary(batchId: string): void {
    this.summaryError.set(null);
    this.api.getImportSummary(batchId).subscribe({
      next: (summary) => this.summary.set(summary),
      error: (err: ApiError) => this.summaryError.set(err.message),
    });
  }

  rollback(): void {
    const current = this.batch();
    if (!current) return;

    this.rollingBack.set(true);
    this.rollbackError.set(null);

    this.api.rollbackImport(current.id).subscribe({
      next: (batch) => {
        this.batch.set(batch);
        this.summary.set(null);
        this.rollingBack.set(false);
      },
      error: (err: ApiError) => {
        this.rollbackError.set(err.message);
        this.rollingBack.set(false);
      },
    });
  }
}
