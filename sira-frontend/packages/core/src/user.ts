export interface User {
    userId: number;
    userUuid: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password?: string | null;
    phone?: string | null;
    bio?: string | null;
    imageUrl?: string | null;
    qrCodeImageUri?: string | null;
    qrCodeSecret?: string | null;
    lastLogin?: string | null;
    loginAttempts: number;
    createdAt: string;
    updatedAt: string;
    /** Rôles séparés par des virgules, ex. "USER,SUPER_ADMIN". */
    role: string;
    authorities: string;
    mfa: boolean;
    accountNonExpired: boolean;
    accountNonLocked: boolean;
    credentialsNonExpired: boolean;
    enabled: boolean;
}

export interface Role {
    roleId?: number;
    name?: string;
    authority?: string;
}

/** Rôles applicatifs connus (seed V27/V31/V33 des migrations). */
export const ROLES = [
    'SUPER_ADMIN',
    'ADMIN',
    'ADMIN_BACKOFFICE',
    'ADMIN_CONFORMITE',
    'ADMIN_IMMO',
    'AGENT_AGENCE',
    'DEMARCHEUR',
    'PROPRIETAIRE_SIMPLE',
    'CONTROLEUR',
    'MANAGER',
    'USER'
] as const;
export type RoleName = (typeof ROLES)[number];

/** Le backend renvoie les rôles en CSV ; toujours tester l'appartenance, jamais l'égalité stricte. */
export function hasRole(user: Pick<User, 'role'> | null | undefined, role: RoleName): boolean {
    if (!user?.role) return false;
    return user.role
        .split(',')
        .map((r) => r.trim())
        .includes(role);
}
