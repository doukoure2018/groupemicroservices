import { useQuery } from '@tanstack/react-query';
import { formatMontant, type CommandeClient } from '@sira/core';
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth-context';
import { ConfirmationCommande } from '../components/ConfirmationCommande';

/**
 * Clé de secours. Les prestataires ne renvoient pas tous la référence dans
 * l'adresse de retour ; on la dépose donc avant de quitter le site, dans le
 * seul stockage qui survit à l'aller-retour sans suivre le client ailleurs.
 */
export const CLE_REFERENCE_PAIEMENT = 'synergia.paiement.reference';

/** Noms de paramètre vus chez les prestataires, par ordre de préférence. */
const PARAMS_REFERENCE = ['reference', 'cpm_trans_id', 'transaction_id', 'merchant_transaction_id', 'token'];

/** Une minute trente d'attente : au-delà, le client mérite une réponse franche. */
const INTERVALLE_MS = 3000;
const TENTATIVES_MAX = 30;

export function PaiementRetourPage() {
    const [params] = useSearchParams();
    const { user } = useAuth();

    // Lue une seule fois : la référence ne change pas en cours de route, et la
    // relire déclencherait une nouvelle requête à chaque rendu.
    const [reference] = useState(() => {
        for (const nom of PARAMS_REFERENCE) {
            const valeur = params.get(nom);
            if (valeur) return valeur;
        }
        try {
            return sessionStorage.getItem(CLE_REFERENCE_PAIEMENT) ?? '';
        } catch {
            return '';
        }
    });

    const [tentatives, setTentatives] = useState(0);
    const abandonne = tentatives >= TENTATIVES_MAX;

    const etatQuery = useQuery({
        queryKey: ['paiement-etat', reference],
        queryFn: async () => (await api.paiements.etat(reference)).data.commande,
        // Sans session web, interroger l'état donnerait un 401 : la page bascule
        // alors sur le renvoi vers l'application, qui suit le paiement elle-même.
        enabled: !!reference && !!user,
        // Tant que la commande attend, on redemande : le serveur interroge le
        // prestataire à chaque appel, c'est ce qui finit par trancher.
        refetchInterval: (query) => {
            const commande = query.state.data as CommandeClient | undefined;
            if (!commande || commande.statut !== 'EN_ATTENTE') return false;
            return INTERVALLE_MS;
        },
        retry: 1
    });

    const commande = etatQuery.data;
    const enAttente = commande?.statut === 'EN_ATTENTE';

    // Compte les passages en attente pour savoir quand cesser d'espérer.
    const dernierCompte = useRef(0);
    useEffect(() => {
        if (!enAttente) return;
        const compte = etatQuery.dataUpdatedAt;
        if (compte === dernierCompte.current) return;
        dernierCompte.current = compte;
        setTentatives((n) => n + 1);
    }, [enAttente, etatQuery.dataUpdatedAt]);

    // Le règlement est tranché : la référence n'a plus à traîner dans l'onglet.
    useEffect(() => {
        if (!commande || commande.statut === 'EN_ATTENTE') return;
        try {
            sessionStorage.removeItem(CLE_REFERENCE_PAIEMENT);
        } catch {
            /* navigation privée : sans conséquence, la référence est dans l'adresse */
        }
    }, [commande]);

    if (user === undefined) {
        return <Message icone="pi-spin pi-spinner" titre="Un instant…" texte="Nous retrouvons votre session." />;
    }

    // Aucune session web : le paiement a presque sûrement été lancé depuis
    // l'application mobile, dont le navigateur revient ici après le prestataire.
    // L'application suit le paiement d'elle-même ; il suffit d'y retourner.
    if (user === null) {
        const lienApp = reference ? `sira://paiement/${encodeURIComponent(reference)}` : 'sira://';
        return (
            <Message
                icone="pi-mobile"
                titre="Retournez dans l'application"
                texte="Votre paiement est pris en compte. L'application SYNERGIA vérifie son état et affichera vos billets dès que l'opérateur l'aura confirmé. Vous pouvez fermer cette page."
                action={
                    <>
                        <a className="bouton-lien" href={lienApp}>
                            <i className="pi pi-mobile" aria-hidden="true" /> Ouvrir l'application
                        </a>
                        <Link className="lien-discret" to={`/login?redirect=${encodeURIComponent('/paiement/retour' + (reference ? `?reference=${encodeURIComponent(reference)}` : ''))}`}>
                            J'ai payé depuis le site : me connecter
                        </Link>
                    </>
                }
            />
        );
    }

    if (!reference) {
        return (
            <Message
                icone="pi-question-circle"
                classeIcone="alerte-icone"
                titre="Paiement introuvable"
                texte="Nous n'avons pas retrouvé la référence de ce paiement. Ouvrez « Mes voyages » : votre réservation y figure avec son statut."
            />
        );
    }

    if (etatQuery.isPending) {
        return <Message icone="pi-spin pi-spinner" titre="Vérification du paiement…" texte="Un instant, nous interrogeons votre opérateur." />;
    }

    if (etatQuery.isError) {
        return (
            <Message
                icone="pi-exclamation-triangle"
                classeIcone="erreur-icone"
                titre="Vérification impossible"
                texte="Nous ne parvenons pas à vérifier ce paiement pour l'instant. Si vous avez été débité, votre réservation sera confirmée automatiquement."
                action={
                    <button type="button" className="secondary" onClick={() => void etatQuery.refetch()}>
                        <i className="pi pi-refresh" aria-hidden="true" /> Réessayer
                    </button>
                }
            />
        );
    }

    if (commande?.statut === 'CONFIRMEE' || commande?.statut === 'PAYEE') {
        return <ConfirmationCommande commande={commande} titre="Paiement reçu ✓" />;
    }

    if (commande?.statut === 'ANNULEE') {
        return (
            <Message
                icone="pi-times-circle"
                classeIcone="erreur-icone"
                titre="Paiement non abouti"
                texte="Votre opérateur n'a pas confirmé le règlement, la réservation a donc été annulée et les places remises en vente. Vous n'avez pas été débité."
                action={
                    <Link className="bouton-lien" to="/">
                        <i className="pi pi-search" aria-hidden="true" /> Chercher un autre voyage
                    </Link>
                }
            />
        );
    }

    if (abandonne) {
        return (
            <Message
                icone="pi-clock"
                classeIcone="alerte-icone"
                titre="Paiement toujours en attente"
                texte="Votre opérateur n'a pas encore répondu. Si le règlement aboutit, votre réservation sera confirmée automatiquement et vous recevrez un email. Vous pouvez suivre son statut dans « Mes voyages »."
                action={
                    <>
                        <Link className="bouton-lien" to="/mes-voyages">
                            <i className="pi pi-ticket" aria-hidden="true" /> Mes voyages
                        </Link>
                        <button
                            type="button"
                            className="secondary"
                            onClick={() => {
                                setTentatives(0);
                                void etatQuery.refetch();
                            }}
                        >
                            <i className="pi pi-refresh" aria-hidden="true" /> Vérifier encore
                        </button>
                    </>
                }
            />
        );
    }

    return (
        <Message
            icone="pi-spin pi-spinner"
            titre="Paiement en cours de validation"
            texte={
                commande?.montantPaye
                    ? `Nous attendons la confirmation de votre opérateur pour ${formatMontant(commande.montantPaye, commande.devise)}. Ne fermez pas cette page.`
                    : "Nous attendons la confirmation de votre opérateur. Ne fermez pas cette page."
            }
            action={
                commande?.urlPaiement ? (
                    <a className="bouton-lien" href={commande.urlPaiement}>
                        <i className="pi pi-external-link" aria-hidden="true" /> Reprendre le paiement
                    </a>
                ) : undefined
            }
        />
    );
}

/** Même habillage pour les cinq issues possibles de la page. */
function Message({
    icone,
    classeIcone,
    titre,
    texte,
    action
}: {
    icone: string;
    classeIcone?: string;
    titre: string;
    texte: string;
    action?: React.ReactNode;
}) {
    return (
        <section className="card card-large">
            <div className="etat-vide">
                <i className={`pi ${icone} grand-icone ${classeIcone ?? ''}`} aria-hidden="true" />
                <h1>{titre}</h1>
                <p className="muted">{texte}</p>
                {action && <div className="commande-actions">{action}</div>}
            </div>
        </section>
    );
}
