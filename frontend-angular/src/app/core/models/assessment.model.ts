import { Track } from './reference-data.model';

/**
 * Expert / community entry form for ONE division -- `GET /assessments/form`
 * (backend/app/routers/assessments.py, QA 26 Sep 2026). An external expert or
 * a community member selects a division on the map, picks sector and hazard,
 * and gives their own figures; the vulnerability is computed on save.
 */
export interface AssessmentVariable {
  readonly code: string;
  readonly name: string;
  readonly domain: 'hazard' | 'exposure';
  readonly unit: string | null;
  readonly weightPct: number | null;
  readonly direction: '+' | '-';
  readonly hint: string | null;
  /** True for change/trend variables, where a negative figure is meaningful. */
  readonly signed: boolean;
  /** The official (data-track) figure for this division, for reference. */
  readonly officialValue: number | null;
  /** This user's own last figure on this track, if any. */
  readonly myValue: number | null;
  /** Mean of every contributor's figure on this track. */
  readonly trackMean: number | null;
}

export interface AssessmentForm {
  readonly profileCode: string;
  readonly profileVersion: number;
  readonly province: string;
  readonly dsCode: string;
  readonly dsDivision: string;
  readonly period: string;
  readonly track: Exclude<Track, 'data'>;
  readonly canSubmit: boolean;
  readonly reason: string | null;
  readonly weightsComplete: boolean;
  readonly contributors: number;
  readonly hazardVariables: readonly AssessmentVariable[];
  readonly exposureVariables: readonly AssessmentVariable[];
  /** How this user last assessed this division: 'parameters' | 'index' | null. */
  readonly myMode: 'parameters' | 'index' | null;
  readonly myHazardIndex: number | null;
  readonly myExposureIndex: number | null;
}

export interface AssessmentPayload {
  readonly province: string;
  readonly sector: string;
  readonly subsector?: string | null;
  readonly hazard: string;
  readonly period: string;
  readonly track: Exclude<Track, 'data'>;
  readonly dsCode: string;
  /** 'parameters' (a figure per variable) or 'index' (H and E directly, 0-1). */
  readonly mode: 'parameters' | 'index';
  readonly values: readonly { code: string; value: number }[];
  readonly hazardIndex?: number | null;
  readonly exposureIndex?: number | null;
  readonly note?: string | null;
}

export interface AssessmentResult {
  readonly ok: boolean;
  readonly saved: number;
  readonly reason: string | null;
  readonly missing: readonly string[];
  readonly hazardIndex: number | null;
  readonly exposureIndex: number | null;
  readonly rawIndex: number | null;
  readonly vulnerabilityIndex: number | null;
  /** 'official' | 'partial' | 'none' -- what the score was scaled against. */
  readonly baseline: string | null;
  readonly contributors: number;
  /** 'parameters' | 'index' | 'mixed' -- how the stored score was entered. */
  readonly entry: string | null;
}
