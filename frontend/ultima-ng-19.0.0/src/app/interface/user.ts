export interface IUser {
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
    role: string;
    authorities: string;
    mfa: boolean;
    accountNonExpired: boolean;
    accountNonLocked: boolean;
    credentialsNonExpired: boolean;
    enabled: boolean;
}
