/** Notification in-app, miroir de `InAppNotification` côté billetterieservice. */
export interface AppNotification {
    notificationId?: number;
    notificationUuid?: string;
    typeNotification?: string;
    categorie?: string;
    titre?: string;
    message?: string;
    lue?: boolean;
    envoyee?: boolean;
    dateEnvoi?: string;
    dateLecture?: string;
    referenceId?: number;
    referenceType?: string;
    /** JSON sérialisé par le serveur ; voir {@link metadataNotification}. */
    metadata?: string | Record<string, unknown> | null;
    createdAt?: string;
}

/** Le serveur range les données utiles au tap dans une chaîne JSON : on la lit sans jamais planter. */
export function metadataNotification(n: AppNotification): Record<string, unknown> {
    const brut = n.metadata;
    if (!brut) return {};
    if (typeof brut === 'object') return brut;
    try {
        const obj: unknown = JSON.parse(brut);
        return obj && typeof obj === 'object' ? (obj as Record<string, unknown>) : {};
    } catch {
        return {};
    }
}

/** Demande d'avis après le voyage : le tap doit mener à la notation de la commande. */
export function estDemandeAvis(n: AppNotification): boolean {
    const cat = `${n.categorie ?? ''} ${n.typeNotification ?? ''}`.toUpperCase();
    return cat.includes('AVIS');
}

/** Identifiant de commande porté par la notification, s'il y en a un. */
export function commandeUuidDeNotification(n: AppNotification): string | undefined {
    const meta = metadataNotification(n);
    const v = meta['commandeUuid'];
    return typeof v === 'string' && v ? v : undefined;
}
