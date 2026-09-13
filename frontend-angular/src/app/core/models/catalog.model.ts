/** Admin-side catalogue, hazard types and accounts (F6).
 *
 * A variable's `status` is the governance state from `catalog_status`
 * (schema.sql rev 5): 'pending' means someone proposed it and no administrator
 * has made it real yet. Only an 'active' variable may carry a weight in a
 * profile — a code is forever, and a duplicate or typo'd one quietly splits one
 * fact into two.
 */
export interface CatalogItem {
  id: number;
  code: string;
  name: string;
  domain: 'hazard' | 'exposure' | null;
  unit: string | null;
  direction: 'higher_is_worse' | 'higher_is_better';
  status: 'active' | 'pending' | 'retired';
  /** Active profiles citing it. Non-zero means retiring it would move scores. */
  usedInProfiles: number;
}

export interface NewVariable {
  code: string;
  name: string;
  domain: 'hazard' | 'exposure';
  unit?: string;
  direction?: 'higher_is_worse' | 'higher_is_better';
  description?: string;
}

export interface HazardType {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  /** Active profiles for it. A hazard with none appears in no filter and no
   * map, because a profile is sector × hazard × province. */
  profiles: number;
}

export interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  organization: string | null;
  status: string;
  province: string | null;
  roles: string[];
  scopes: string[];
  mayWriteHazardDomain: boolean;
}

export interface RoleOption {
  code: string;
  name: string;
  description: string | null;
}
