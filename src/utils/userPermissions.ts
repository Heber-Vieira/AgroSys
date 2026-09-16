import { UserProfile, UserRole, AppViewMode, ServiceOrder, CrewPilot, CrewAssistant } from '../types';

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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Deduplicates user profiles array by email and ID, preserving Master privileges and cloud UUIDs.
 */
export function deduplicateUserProfiles(users: UserProfile[]): UserProfile[] {
  if (!Array.isArray(users)) return [];

  const mapByEmail = new Map<string, UserProfile>();
  const unemailed: UserProfile[] = [];

  users.forEach((rawUser) => {
    if (!rawUser) return;
    const normalized = normalizeUserProfile(rawUser);
    const emailKey = normalized.email ? normalized.email.toLowerCase().trim() : '';

    if (!emailKey) {
      if (!unemailed.some(u => u.id === normalized.id)) {
        unemailed.push(normalized);
      }
      return;
    }

    if (!mapByEmail.has(emailKey)) {
      mapByEmail.set(emailKey, normalized);
    } else {
      const existing = mapByEmail.get(emailKey)!;

      const isExistingUuid = UUID_REGEX.test(existing.id);
      const isNewUuid = UUID_REGEX.test(normalized.id);
      const chosenId = isExistingUuid ? existing.id : (isNewUuid ? normalized.id : existing.id);

      const isMaster = isMasterUser(existing) || isMasterUser(normalized);
      const role: UserRole = isMaster ? 'MASTER' : (existing.role === 'ADMIN' || normalized.role === 'ADMIN' ? 'ADMIN' : (existing.role || normalized.role));
      const roleLabel = isMaster ? 'Usuário Master (Acesso Total)' : (existing.roleLabel || normalized.roleLabel);
      const badge = isMaster ? '👑 Super Master' : (existing.badge || normalized.badge);

      const merged: UserProfile = {
        ...existing,
        ...normalized,
        id: chosenId,
        isMaster,
        role,
        roleLabel,
        badge,
        companyId: isMaster ? (existing.companyId || normalized.companyId) : (normalized.companyId || existing.companyId || 'ciclodrone'),
        photoUrl: normalized.photoUrl || normalized.avatarUrl || existing.photoUrl || existing.avatarUrl,
        avatarUrl: normalized.photoUrl || normalized.avatarUrl || existing.photoUrl || existing.avatarUrl,
        documentNumber: normalized.documentNumber || existing.documentNumber,
        phone: normalized.phone || existing.phone,
        password: normalized.password || existing.password,
        allowedViews: normalized.allowedViews || existing.allowedViews,
      };

      mapByEmail.set(emailKey, merged);
    }
  });

  return [...Array.from(mapByEmail.values()), ...unemailed];
}

/**
 * Deduplicates crew pilots by email, cpf, or ID.
 */
export function deduplicateCrewPilots(pilots: CrewPilot[]): CrewPilot[] {
  if (!Array.isArray(pilots)) return [];
  const map = new Map<string, CrewPilot>();
  pilots.forEach(p => {
    if (!p) return;
    const key = (p.email ? p.email.toLowerCase().trim() : '') || (p.cpf ? p.cpf.trim() : '') || p.id;
    if (!map.has(key)) {
      map.set(key, p);
    } else {
      const existing = map.get(key)!;
      map.set(key, { ...existing, ...p });
    }
  });
  return Array.from(map.values());
}

/**
 * Deduplicates crew assistants by cpf, name, or ID.
 */
export function deduplicateCrewAssistants(assistants: CrewAssistant[]): CrewAssistant[] {
  if (!Array.isArray(assistants)) return [];
  const map = new Map<string, CrewAssistant>();
  assistants.forEach(a => {
    if (!a) return;
    const key = (a.cpf ? a.cpf.trim() : '') || (a.name ? a.name.toLowerCase().trim() : '') || a.id;
    if (!map.has(key)) {
      map.set(key, a);
    } else {
      const existing = map.get(key)!;
      map.set(key, { ...existing, ...a });
    }
  });
  return Array.from(map.values());
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

/**
 * Normalizes a person's name for robust, exact-name comparison:
 * - Strips diacritics/accents (e.g. Valério -> valerio, Alcantâra -> alcantara)
 * - Removes common honorifics & titles (Cmdt., Comandante, Piloto, Auxiliar, Eng., etc.)
 * - Trims extra spaces and lowercases
 */
export function normalizePersonName(name?: string | null): string {
  if (!name) return '';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .toLowerCase()
    .replace(/\b(cmdt|cmdte|comandante|piloto|auxiliar|eng|engº|sr|sra|dr|dra)\.?\b/gi, ' ') // remove honorifics
    .replace(/[^a-z0-9\s]/g, ' ') // remove symbols
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Compares two person names with high precision.
 * Returns true if both names identify the exact same person.
 */
export function doNamesMatch(nameA?: string | null, nameB?: string | null): boolean {
  const cleanA = normalizePersonName(nameA);
  const cleanB = normalizePersonName(nameB);
  if (!cleanA || !cleanB) return false;
  if (cleanA === cleanB) return true;
  if (cleanA.includes(cleanB) || cleanB.includes(cleanA)) return true;

  const tokensA = cleanA.split(' ').filter(t => t.length > 1);
  const tokensB = cleanB.split(' ').filter(t => t.length > 1);
  if (tokensA.length === 0 || tokensB.length === 0) return false;

  // Check token intersection
  const matches = tokensA.filter(t => tokensB.includes(t));
  if (matches.length >= 2) return true;
  if (matches.length === 1 && (tokensA.length === 1 || tokensB.length === 1)) {
    return matches[0].length >= 4;
  }

  return false;
}

/**
 * Checks if a ServiceOrder is visible to a given UserProfile based on RBAC & name/ID assignment rules:
 * - MASTER / isMaster: Total visibility
 * - ADMIN: Total visibility within their active company
 * - PILOT: Strictly only OS where their name, pilotId, or CPF is assigned
 * - ASSISTANT: Strictly only OS where their name, assistantId, or CPF is assigned
 * - USER: Strictly only OS for their clientId, clientName, or farm
 */
export function isServiceOrderAssignedToUser(
  order: ServiceOrder,
  user?: UserProfile | null,
  pilots?: CrewPilot[],
  assistants?: CrewAssistant[]
): boolean {
  if (!user || !order) return false;
  
  // 1. Master users have unrestricted visibility
  if (isMasterUser(user)) {
    return true;
  }

  // 2. Company Admins have visibility of all orders within company
  if (user.role === 'ADMIN') {
    return true;
  }

  // 3. Drone Pilot (PILOT): ONLY assigned orders
  if (user.role === 'PILOT') {
    // Check ID match
    if (order.pilotId) {
      if (order.pilotId === user.id || user.id.includes(order.pilotId) || order.pilotId.includes(user.id)) {
        return true;
      }
    }

    // Check linked CrewPilot object
    if (pilots && pilots.length > 0) {
      const userDoc = (user.documentNumber || '').replace(/\D/g, '');
      const linkedPilot = pilots.find(p => 
        p.id === user.id || 
        (userDoc && p.cpf && p.cpf.replace(/\D/g, '') === userDoc) ||
        doNamesMatch(p.name, user.name)
      );
      if (linkedPilot) {
        if (order.pilotId === linkedPilot.id) return true;
        if (doNamesMatch(order.pilotName, linkedPilot.name)) return true;
      }
    }

    // Check name match against order.pilotName
    if (order.pilotName && doNamesMatch(order.pilotName, user.name)) {
      return true;
    }

    return false;
  }

  // 4. Mix / Spray Assistant (ASSISTANT): ONLY assigned orders
  if (user.role === 'ASSISTANT') {
    // Check ID match
    if (order.assistantId) {
      if (order.assistantId === user.id || user.id.includes(order.assistantId) || order.assistantId.includes(user.id)) {
        return true;
      }
    }

    // Check linked CrewAssistant object
    if (assistants && assistants.length > 0) {
      const userDoc = (user.documentNumber || '').replace(/\D/g, '');
      const linkedAssistant = assistants.find(a => 
        a.id === user.id || 
        (userDoc && a.cpf && a.cpf.replace(/\D/g, '') === userDoc) ||
        doNamesMatch(a.name, user.name)
      );
      if (linkedAssistant) {
        if (order.assistantId === linkedAssistant.id) return true;
        if (doNamesMatch(order.assistantName, linkedAssistant.name)) return true;
      }
    }

    // Check name match against order.assistantName
    if (order.assistantName && doNamesMatch(order.assistantName, user.name)) {
      return true;
    }

    return false;
  }

  // 5. Client / Producer (USER): only orders for their client ID, client Name, or Farm
  if (user.role === 'USER') {
    if (order.clientId && order.clientId === user.id) return true;
    if (order.clientName && doNamesMatch(order.clientName, user.name)) return true;
    if (user.farmName && order.farmName && doNamesMatch(order.farmName, user.farmName)) return true;
    return false;
  }

  return true;
}

/**
 * Filters a list of ServiceOrders for the current user, applying both multi-tenancy and role assignment rules.
 */
export function filterOrdersForUser(
  orders: ServiceOrder[] | undefined | null,
  user?: UserProfile | null,
  pilots?: CrewPilot[],
  assistants?: CrewAssistant[]
): ServiceOrder[] {
  if (!orders || !Array.isArray(orders)) return [];
  if (!user) return [];
  return orders.filter(o => isServiceOrderAssignedToUser(o, user, pilots, assistants));
}


