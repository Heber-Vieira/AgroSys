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
        password: (normalized.password !== undefined && normalized.password !== null && normalized.password !== '') ? normalized.password : existing.password,
        allowedViews: normalized.allowedViews || existing.allowedViews,
      };

      mapByEmail.set(emailKey, merged);
    }
  });

  return [...Array.from(mapByEmail.values()), ...unemailed];
}

/**
 * Deduplicates crew pilots by ID, CPF, email, or name within the company.
 */
export function deduplicateCrewPilots(pilots: CrewPilot[]): CrewPilot[] {
  if (!Array.isArray(pilots)) return [];
  const result: CrewPilot[] = [];

  pilots.forEach(p => {
    if (!p) return;
    const cleanId = (p.id || '').trim();
    const cleanEmail = (p.email || '').toLowerCase().trim();
    const cleanCpf = (p.cpf || '').replace(/\D/g, '');
    const pTenant = p.companyId || 'ciclodrone';

    const existingIdx = result.findIndex(item => {
      const itemTenant = item.companyId || 'ciclodrone';
      if (cleanId && item.id && item.id.trim() === cleanId) return true;
      if (cleanEmail && item.email && item.email.toLowerCase().trim() === cleanEmail) return true;
      if (cleanCpf && item.cpf && item.cpf.replace(/\D/g, '') === cleanCpf) return true;
      if (doNamesMatch(item.name, p.name) && itemTenant === pTenant) return true;
      return false;
    });

    if (existingIdx === -1) {
      result.push(p);
    } else {
      result[existingIdx] = {
        ...result[existingIdx],
        ...p,
        email: p.email || result[existingIdx].email,
        cpf: p.cpf || result[existingIdx].cpf,
        phone: p.phone || result[existingIdx].phone,
        deceaLicense: p.deceaLicense || result[existingIdx].deceaLicense,
        photoUrl: p.photoUrl || result[existingIdx].photoUrl,
        avatarUrl: p.photoUrl || result[existingIdx].photoUrl || result[existingIdx].avatarUrl,
        commissionRatePerHa: p.commissionRatePerHa || result[existingIdx].commissionRatePerHa,
      };
    }
  });

  return result;
}

/**
 * Deduplicates crew assistants by ID, CPF, email, or name within the company.
 */
export function deduplicateCrewAssistants(assistants: CrewAssistant[]): CrewAssistant[] {
  if (!Array.isArray(assistants)) return [];
  const result: CrewAssistant[] = [];

  assistants.forEach(a => {
    if (!a) return;
    const cleanId = (a.id || '').trim();
    const cleanEmail = (a.email || '').toLowerCase().trim();
    const cleanCpf = (a.cpf || '').replace(/\D/g, '');
    const aTenant = a.companyId || 'ciclodrone';

    const existingIdx = result.findIndex(item => {
      const itemTenant = item.companyId || 'ciclodrone';
      if (cleanId && item.id && item.id.trim() === cleanId) return true;
      if (cleanEmail && item.email && item.email.toLowerCase().trim() === cleanEmail) return true;
      if (cleanCpf && item.cpf && item.cpf.replace(/\D/g, '') === cleanCpf) return true;
      if (doNamesMatch(item.name, a.name) && itemTenant === aTenant) return true;
      return false;
    });

    if (existingIdx === -1) {
      result.push(a);
    } else {
      result[existingIdx] = {
        ...result[existingIdx],
        ...a,
        email: a.email || result[existingIdx].email,
        cpf: a.cpf || result[existingIdx].cpf,
        phone: a.phone || result[existingIdx].phone,
        photoUrl: a.photoUrl || result[existingIdx].photoUrl,
        avatarUrl: a.photoUrl || result[existingIdx].photoUrl || result[existingIdx].avatarUrl,
        commissionRatePerHa: a.commissionRatePerHa || result[existingIdx].commissionRatePerHa,
      };
    }
  });

  return result;
}

/**
 * Synchronizes and extracts pilots for a target company with 100% precision:
 * - Scans both crew_pilots (allPilots) and user_profiles (allUsers) matching companyId.
 * - Converts any user with role 'PILOT' into CrewPilot objects.
 * - Explicitly excludes Master administrators (e.g. Heber) and non-pilot accounts.
 * - Deduplicates entries by ID, email, or CPF.
 */
export function syncCompanyPilots(
  allPilots: CrewPilot[] = [],
  allUsers: UserProfile[] = [],
  targetCompanyId: string = 'ciclodrone',
  isGlobalView: boolean = false,
  fallbackPilots: CrewPilot[] = []
): CrewPilot[] {
  const targetTenant = targetCompanyId || 'ciclodrone';

  // Helper to test if a record belongs to a Master admin or a non-pilot role
  const isMasterOrNonPilot = (name?: string | null, id?: string | null, role?: string | null) => {
    if (id === 'user-heber-vieira' || id === 'user-thales-vieira') return true;
    if (role === 'MASTER' || role === 'ADMIN' || role === 'USER') return true;
    return false;
  };

  // 1. Direct pilots matching companyId (filtering out any Master/Admin accounts)
  const directPilots = (allPilots || []).filter(p => {
    if (!p) return false;
    if (isMasterOrNonPilot(p.name, p.id, (p as any).role)) return false;
    if (isGlobalView || targetCompanyId === 'ALL') return true;
    const pTenant = p.companyId || 'ciclodrone';
    return pTenant === targetTenant;
  });

  // 2. User profiles with role 'PILOT' belonging to target company (strictly role === 'PILOT')
  const pilotUsers = (allUsers || []).filter(u => {
    if (!u) return false;
    if (isMasterUser(u) || isMasterOrNonPilot(u.name, u.id, u.role)) return false;
    const roleUpper = (u.role || '').toUpperCase();
    if (roleUpper !== 'PILOT') return false;

    if (!isGlobalView && targetCompanyId && targetCompanyId !== 'ALL') {
      const uTenant = u.companyId || 'ciclodrone';
      if (uTenant !== targetTenant) return false;
    }
    return true;
  });

  // 3. Convert user profiles to CrewPilot format
  const convertedPilots: CrewPilot[] = pilotUsers.map(u => ({
    id: u.id,
    companyId: u.companyId || targetTenant,
    name: u.name,
    email: u.email,
    cpf: u.documentNumber,
    phone: u.phone,
    deceaLicense: u.licenseCode || u.badge || 'DECEA Habilitado',
    cmaExpiration: '2027-12-31',
    commissionRatePerHa: 8.00,
    totalHoursFlown: 100.0,
    available: u.status !== 'INACTIVE',
    photoUrl: u.photoUrl,
  }));

  // 4. Merge direct pilots and converted user pilots, then deduplicate
  const merged = deduplicateCrewPilots([...directPilots, ...convertedPilots]).filter(p => 
    !isMasterOrNonPilot(p.name, p.id, (p as any).role)
  );

  // 5. If specific tenant has custom results, return them
  if (merged.length > 0) {
    return merged;
  }

  // 6. Fallback matching company (filtering out Master/Admin)
  if (fallbackPilots && fallbackPilots.length > 0) {
    const cleanFallback = fallbackPilots.filter(p => !isMasterOrNonPilot(p.name, p.id, (p as any).role));
    const tenantFallback = cleanFallback.filter(p => isGlobalView || targetCompanyId === 'ALL' || (p.companyId || 'ciclodrone') === targetTenant);
    return tenantFallback;
  }

  return [];
}

/**
 * Synchronizes and extracts assistants for a target company with 100% precision:
 * - Scans both crew_assistants (allAssistants) and user_profiles (allUsers) matching companyId.
 * - Converts any user with role 'ASSISTANT' into CrewAssistant objects.
 * - Explicitly excludes Master administrators (e.g. Heber) and non-assistant accounts.
 * - Deduplicates entries by ID, CPF, or name.
 */
export function syncCompanyAssistants(
  allAssistants: CrewAssistant[] = [],
  allUsers: UserProfile[] = [],
  targetCompanyId: string = 'ciclodrone',
  isGlobalView: boolean = false,
  fallbackAssistants: CrewAssistant[] = []
): CrewAssistant[] {
  const targetTenant = targetCompanyId || 'ciclodrone';

  const isMasterOrNonAssistant = (name?: string | null, id?: string | null, role?: string | null) => {
    if (id === 'user-heber-vieira' || id === 'user-thales-vieira') return true;
    if (role === 'MASTER' || role === 'ADMIN' || role === 'USER') return true;
    return false;
  };

  // 1. Direct assistants matching companyId
  const directAssistants = (allAssistants || []).filter(a => {
    if (!a) return false;
    if (isMasterOrNonAssistant(a.name, a.id, (a as any).role)) return false;
    if (isGlobalView || targetCompanyId === 'ALL') return true;
    const aTenant = a.companyId || 'ciclodrone';
    return aTenant === targetTenant;
  });

  // 2. User profiles with role 'ASSISTANT' belonging to target company (strictly role === 'ASSISTANT')
  const assistantUsers = (allUsers || []).filter(u => {
    if (!u) return false;
    if (isMasterUser(u) || isMasterOrNonAssistant(u.name, u.id, u.role)) return false;
    const roleUpper = (u.role || '').toUpperCase();
    if (roleUpper !== 'ASSISTANT') return false;

    if (!isGlobalView && targetCompanyId && targetCompanyId !== 'ALL') {
      const uTenant = u.companyId || 'ciclodrone';
      if (uTenant !== targetTenant) return false;
    }
    return true;
  });

  // 3. Convert user profiles to CrewAssistant format
  const convertedAssistants: CrewAssistant[] = assistantUsers.map(u => ({
    id: u.id,
    companyId: u.companyId || targetTenant,
    name: u.name,
    cpf: u.documentNumber,
    phone: u.phone,
    commissionRatePerHa: 3.00,
    nr31Certified: true,
    available: u.status !== 'INACTIVE',
    photoUrl: u.photoUrl,
  }));

  // 4. Merge direct assistants and converted user assistants, then deduplicate
  const merged = deduplicateCrewAssistants([...directAssistants, ...convertedAssistants]).filter(a => 
    !isMasterOrNonAssistant(a.name, a.id, (a as any).role)
  );

  // 5. If specific tenant has custom results, return them
  if (merged.length > 0) {
    return merged;
  }

  // 6. Fallback matching company
  if (fallbackAssistants && fallbackAssistants.length > 0) {
    const cleanFallback = fallbackAssistants.filter(a => !isMasterOrNonAssistant(a.name, a.id, (a as any).role));
    const tenantFallback = cleanFallback.filter(a => isGlobalView || targetCompanyId === 'ALL' || (a.companyId || 'ciclodrone') === targetTenant);
    return tenantFallback;
  }

  return [];
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


