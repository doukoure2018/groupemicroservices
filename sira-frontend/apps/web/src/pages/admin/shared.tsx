import { ApiError } from '@sira/api-client';
import { confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { useCallback, useRef } from 'react';

/**
 * Notifications Toast partagées par tous les écrans admin : un seul point pour
 * extraire le message serveur (ApiError) et garder des durées homogènes.
 */
export function useNotif() {
    const toast = useRef<Toast>(null);
    const succes = useCallback((summary: string, detail?: string) => {
        toast.current?.show({ severity: 'success', summary, detail, life: 3500 });
    }, []);
    const erreur = useCallback((err: unknown, fallback: string) => {
        const detail = err instanceof ApiError ? err.message : fallback;
        toast.current?.show({ severity: 'error', summary: 'Échec', detail, life: 6000 });
    }, []);
    const info = useCallback((summary: string, detail?: string) => {
        toast.current?.show({ severity: 'info', summary, detail, life: 4000 });
    }, []);
    return { toast, succes, erreur, info };
}

/** Confirmation de suppression uniforme (nécessite un <ConfirmDialog /> monté, voir AdminLayout). */
export function confirmerSuppression(libelle: string, onConfirme: () => void, detail?: string) {
    confirmDialog({
        message: detail ?? `Voulez-vous vraiment supprimer « ${libelle} » ? Cette action est irréversible.`,
        header: 'Confirmer la suppression',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Supprimer',
        rejectLabel: 'Annuler',
        acceptClassName: 'p-button-danger',
        accept: onConfirme
    });
}

/** Convertit un champ texte de formulaire en nombre ou undefined (champ vide). */
export function num(v: string): number | undefined {
    if (v === '' || v === undefined || v === null) return undefined;
    const n = Number(v);
    return Number.isNaN(n) ? undefined : n;
}

/** Valeur de formulaire depuis un champ optionnel du modèle. */
export function str(v: string | number | null | undefined): string {
    return v === null || v === undefined ? '' : String(v);
}

/** Petite carte de statistique réutilisée par les écrans admin. */
export function StatCarte({ libelle, valeur, ton }: { libelle: string; valeur: number | string; ton?: 'succes' | 'alerte' | 'danger' }) {
    return (
        <div className={`stat-carte${ton ? ` stat-${ton}` : ''}`}>
            <span className="stat-valeur">{valeur}</span>
            <span className="stat-libelle">{libelle}</span>
        </div>
    );
}

/** Tronque un texte long pour les cellules de tableau. */
export function tronquer(texte: string | undefined | null, max: number): string {
    if (!texte) return '';
    return texte.length > max ? texte.slice(0, max - 1) + '…' : texte;
}

/** Les helpers @sira/core parlent « warn » (convention PrimeNG) ; PrimeReact attend « warning ». */
export function tagSeverity(s: 'success' | 'info' | 'warn' | 'danger' | 'secondary'): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    return s === 'warn' ? 'warning' : s;
}
