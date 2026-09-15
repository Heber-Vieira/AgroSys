import { UserProfile, UserRole, AppViewMode } from '../types';

/**
 * Checks if a user is a Master Administrator with unrestricted global multi-company privileges.
 * Performs deep check against role, isMaster flag, badge, IDs, emails, and names.
 */
export function isMasterUser(user?: UserProfile | null): boolean {
  if (!user) return false;
  if (user.isMaster === true) return true;
  if (user.role === 'MASTER') return true;
  if (user.badge && user.badge.toLowerCase().includes('master')) return true;
  if (user.roleLabel && user.roleLabel.toLowerCase().includes('master')) return true;
  if (user.id === 'user-heber-vieira' || user.id === 'user-thales-vieira') return true;
  
  const email = (user.email || '').toLowerCase().trim();
  if (email === 'heber.vieira.hv@gmail.com' || email === 'thalesfelipe1@hotmail.com') return true;
  
  const name = (user.name || '').toLowerCase().trim();
  if (name.includes('heber vieira') || name.includes('thales felipe') || name.includes('thales vieira')) return true;
  
  return false;
}

/**
 * Checks if a user is a Company Unit Administrator (restricted to single company).
 */
export function isCompanyAdmin(user?: UserProfile | null): boolean {
  if (!user) return false;
  return user.role === 'ADMIN' && !isMasterUser(user);
}

/**
 * Checks if a user has any administrative privileges (either Master or Company Admin).
 */
export function hasAdminPrivileges(user?: UserProfile | null): boolean {
  if (!user) return false;
  return isMasterUser(user) || user.role === 'ADMIN';
}

/**
 * Returns the baseline/default views accessible by a given role.
 */
export function getDefaultRoleViews(role: UserRole): AppViewMode[] {
  switch (role) {
    case 'MASTER':
      return [
        'hub', 'dashboard', 'orders', 'spray-workflow', 'gis', 'schedule', 'telemetry',
        'weather', 'spray-mix', 'fleet', 'pricing', 'quotations', 'reports', 'financial',
        'admin-management', 'branding', 'docs', 'database', 'design-system', 'virtual-tour', 'help'
      ];
    case 'ADMIN':
      return [
        'hub', 'dashboard', 'orders', 'spray-workflow', 'gis', 'schedule', 'telemetry',
        'weather', 'spray-mix', 'fleet', 'pricing', 'quotations', 'reports', 'financial',
        'admin-management', 'branding', 'docs', 'virtual-tour', 'help'
      ];
    case 'PILOT':
      return [
        'hub', 'dashboard', 'orders', 'spray-workflow', 'gis', 'schedule', 'telemetry',
        'weather', 'spray-mix', 'fleet', 'reports', 'docs', 'virtual-tour', 'help'
      ];
    case 'ASSISTANT':
      return [
        'hub', 'dashboard', 'orders', 'spray-workflow', 'schedule', 'weather',
        'spray-mix', 'fleet', 'docs', 'virtual-tour', 'help'
      ];
    case 'USER':
      return [
        'hub', 'dashboard', 'orders', 'gis', 'weather', 'reports',
        'docs', 'virtual-tour', 'help'
      ];
    default:
      return ['hub', 'dashboard', 'orders', 'help'];
  }
}

/**
 * Checks whether a user has permission to access a specific module/view.
 * Respects custom allowedViews granted by Company Admin or Master.
 */
export function canUserAccessView(user: UserProfile | null | undefined, view: AppViewMode): boolean {
  if (!user) return false;
  if (isMasterUser(user)) return true;
  if (view === 'hub' || view === 'help') return true;

  // If custom allowed views array is defined on this user profile (even if empty []), use it strictly
  if (user.allowedViews && Array.isArray(user.allowedViews)) {
    return user.allowedViews.includes(view);
  }

  // Fallback to default role permissions ONLY if allowedViews was never configured
  return getDefaultRoleViews(user.role).includes(view);
}

/**
 * Normalizes user object ensuring Master attributes are properly set.
 */
export function normalizeUserProfile(user: UserProfile): UserProfile {
  if (isMasterUser(user)) {
    return {
      ...user,
      role: 'MASTER',
      roleLabel: 'Usuário Master (Acesso Total)',
      isMaster: true,
      badge: user.badge || '👑 Super Master',
    };
  }
  return user;
}

