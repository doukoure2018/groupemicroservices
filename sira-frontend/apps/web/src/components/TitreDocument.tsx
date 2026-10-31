import { useEffect } from 'react';
import { matchPath, useLocation } from 'react-router-dom';

const SUFFIXE = 'SYNERGIA';

/** Titre d'onglet par route. L'ordre compte : la première correspondance gagne. */
const TITRES: Array<[string, string]> = [
    ['/', 'Rechercher un voyage'],
    ['/login', 'Connexion'],
    ['/auth/register', 'Créer un compte'],
    ['/auth/forgotpassword', 'Mot de passe oublié'],
    ['/auth/verify/account', 'Activation du compte'],
    ['/auth/verify/password', 'Nouveau mot de passe'],
    ['/auth/verify/mobile', 'Vérification du compte'],
    ['/reserver/:offreUuid', 'Finaliser la réservation'],
    ['/paiement/retour', 'Paiement'],
    ['/mes-voyages', 'Mes voyages'],
    ['/tableau-de-bord', 'Mon espace'],
    ['/agence/demandes', 'Demandes clients'],
    ['/agence', "Profil de l'agence"],
    ['/conformite', 'Dossiers agence'],
    ['/admin/profil', 'Mon profil'],
    ['/admin/offres', 'Offres de transport'],
    ['/admin/nouvelle-liaison', 'Nouvelle liaison'],
    ['/admin/sites', 'Sites et gares'],
    ['/admin/departs', 'Points de départ'],
    ['/admin/arrivees', "Points d'arrivée"],
    ['/admin/trajets', 'Trajets'],
    ['/admin/types-vehicules', 'Types de véhicules'],
    ['/admin/vehicules', 'Véhicules'],
    ['/admin/regions', 'Régions'],
    ['/admin/villes', 'Villes'],
    ['/admin/communes', 'Communes'],
    ['/admin/quartiers', 'Quartiers'],
    ['/admin/localisations', 'Localisations'],
    ['/admin/modes-reglement', 'Modes de règlement'],
    ['/admin/partenaires', 'Partenaires'],
    ['/admin/utilisateurs', 'Utilisateurs'],
    ['/admin/agences', 'Agences'],
    ['/admin/moderation', 'Modération'],
    ['/admin/leads', 'Demandes'],
    ['/admin', 'Tableau de bord']
];

/**
 * Met à jour le titre de l'onglet à chaque navigation : sans cela, tous les
 * écrans partagent le même titre et l'historique du navigateur est illisible.
 */
export function TitreDocument() {
    const { pathname } = useLocation();

    useEffect(() => {
        const trouve = TITRES.find(([motif]) => matchPath({ path: motif, end: true }, pathname));
        document.title = trouve ? `${trouve[1]} · ${SUFFIXE}` : `${SUFFIXE} — IMMO · TRANS · GUINÉE`;
    }, [pathname]);

    return null;
}
