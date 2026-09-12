import { UserProfile } from '../types';

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
