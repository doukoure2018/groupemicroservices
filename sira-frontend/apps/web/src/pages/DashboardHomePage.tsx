import { hasRole } from '@sira/core';
import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth-context';
import { DashboardAdminPage } from './admin/DashboardAdminPage';

/**
 * Aiguillage après connexion, porté de l'écran `dashboards/home` Angular.
 * Une agence immobilière dont le dossier n'est pas encore validé est renvoyée
 * vers son espace d'onboarding.
 */
export function DashboardHomePage() {
    const { user } = useAuth();
    const estAgence = hasRole(user, 'ADMIN_IMMO');

    const onboarding = useQuery({
        queryKey: ['agence-onboarding-me'],
        queryFn: async () => (await api.immo.agences.onboardingMe()).data,
        enabled: estAgence,
        retry: false
    });

    if (user === undefined) return <p className="muted center">Chargement…</p>;

    if (estAgence) {
        if (onboarding.isPending) return <p className="muted center">Chargement de votre espace…</p>;
        // Comme dans l'Angular, une erreur renvoie aussi vers l'onboarding : c'est
        // le cas d'un compte agence sans dossier encore créé.
        const statut = onboarding.data?.agence?.statutVerification;
        if (onboarding.isError || statut !== 'VERIFIE') return <Navigate to="/agence" replace />;
    }

    if (hasRole(user, 'SUPER_ADMIN') || hasRole(user, 'ADMIN')) return <DashboardAdminPage />;
    if (hasRole(user, 'ADMIN_CONFORMITE')) return <Navigate to="/conformite" replace />;
    if (hasRole(user, 'ADMIN_BACKOFFICE')) return <Navigate to="/admin/leads" replace />;
    if (estAgence) return <Navigate to="/agence/demandes" replace />;

    // Client particulier : rien d'administratif à afficher, on renvoie au parcours voyageur.
    return <Navigate to="/mes-voyages" replace />;
}
