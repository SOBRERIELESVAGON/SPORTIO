export type OrganizationId = string;

export type TenantScopedRecord = {
  organizationId: OrganizationId;
};

export const DEFAULT_ORGANIZATION_ID = 'club-sportia-demo';

export type PlatformRole =
  | 'super_admin'
  | 'club_admin'
  | 'sport_coordinator'
  | 'coach'
  | 'player_guardian';

export type TenantSession = {
  userId: string;
  email: string;
  role: PlatformRole;
  organizationId: OrganizationId;
  sportIds?: string[];
  divisionIds?: string[];
  athleteId?: string;
};

export function isSuperAdmin(session: Pick<TenantSession, 'role'>) {
  return session.role === 'super_admin';
}

export function belongsToOrganization<T extends TenantScopedRecord>(
  record: T,
  organizationId: OrganizationId,
) {
  return record.organizationId === organizationId;
}

export function filterByOrganizationId<T extends TenantScopedRecord>(
  records: T[],
  organizationId: OrganizationId,
) {
  return records.filter((record) => belongsToOrganization(record, organizationId));
}

export function assertSameOrganization<T extends TenantScopedRecord>(
  record: T,
  organizationId: OrganizationId,
) {
  if (!belongsToOrganization(record, organizationId)) {
    throw new Error('Access denied: cross-organization data access was blocked.');
  }

  return record;
}

