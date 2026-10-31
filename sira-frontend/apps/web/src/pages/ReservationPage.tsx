import { useMutation, useQuery } from '@tanstack/react-query';
import {
    formatDateFr,
    formatHeure,
    formatMontant,
    getMontantEffectif,
    hasPromotion,
    type CommandeClient,
    type PassagerRequest
} from '@sira/core';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { ConfirmationCommande } from '../components/ConfirmationCommande';
import { CLE_REFERENCE_PAIEMENT } from './PaiementRetourPage';

const MAX_PLACES = 8;

const passagerVide = (): PassagerRequest => ({ nom: '', prenom: '', telephone: '', pieceIdentite: '' });

export function ReservationPage() {
    const { offreUuid } = useParams<{ offreUuid: string }>();

    const offreQuery = useQuery({
        queryKey: ['offre', offreUuid],
        queryFn: async () => (await api.offres.byUuid(offreUuid!)).data.offre,
        enabled: !!offreUuid
    });

    const modesQuery = useQuery({
        queryKey: ['modes-reglement'],
        queryFn: async () => (await api.commercial.modesReglement()).data.modesReglement
    });

    const [passagers, setPassagers] = useState<PassagerRequest[]>([passagerVide()]);
    const [modeReglementCode, setModeReglementCode] = useState('');
    const [commande, setCommande] = useState<CommandeClient | null>(null);
    const [redirection, setRedirection] = useState(false);

    const offre = offreQuery.data;
    const prixUnitaire = offre ? getMontantEffectif(offre) : 0;
    const total = prixUnitaire * passagers.length;
    const maxPassagers = Math.min(MAX_PLACES, offre?.nombrePlacesDisponibles ?? MAX_PLACES);

    const reserver = useMutation({
        mutationFn: async () =>
            (
                await api.commandes.create({
                    offreUuid: offreUuid!,
                    passagers: passagers.map((p) => ({ ...p, pieceIdentite: p.pieceIdentite || undefined })),
                    modeReglementCode,
                    montantTotal: total
                })
            ).data.commande,
        onSuccess: (cmd) => {
            // Paiement en ligne : la commande attend les fonds, les billets ne
            // sont pas encore utilisables, et c'est le prestataire qui prend la
            // main. Hors ligne, rien ne change : la commande est déjà confirmée.
            if (cmd.urlPaiement) {
                try {
                    // Filet pour le retour : certains prestataires ne renvoient
                    // pas la référence dans l'adresse.
                    sessionStorage.setItem(CLE_REFERENCE_PAIEMENT, cmd.referencePaiement ?? '');
                } catch {
                    /* navigation privée : la référence viendra de l'adresse de retour */
                }
                setRedirection(true);
                window.location.assign(cmd.urlPaiement);
                return;
            }
            setCommande(cmd);
        }
    });

    if (offreQuery.isLoading) return <p className="muted center">Chargement du voyage…</p>;
    if (offreQuery.isError || !offre) {
        return (
            <section className="card card-large">
                <div className="etat-vide">
                    <i className="pi pi-compass grand-icone erreur-icone" aria-hidden="true" />
                    <p className="error">Ce voyage est introuvable ou n'est plus disponible.</p>
                    <Link className="bouton-lien" to="/">
                        <i className="pi pi-arrow-left" aria-hidden="true" /> Retour à la recherche
                    </Link>
                </div>
            </section>
        );
    }

    if (redirection) {
        return (
            <section className="card card-large">
                <div className="etat-vide">
                    <i className="pi pi-spin pi-spinner grand-icone" aria-hidden="true" />
                    <h1>Redirection vers le paiement…</h1>
                    <p className="muted">Vous allez régler votre réservation chez votre opérateur. Ne fermez pas cette fenêtre.</p>
                </div>
            </section>
        );
    }

    if (commande) return <ConfirmationCommande commande={commande} />;

    function setPassager(index: number, champ: keyof PassagerRequest, valeur: string) {
        setPassagers((prev) => prev.map((p, i) => (i === index ? { ...p, [champ]: valeur } : p)));
    }

    const modeChoisi = (modesQuery.data ?? []).find((m) => m.code === modeReglementCode);
    const paiementEnLigne = modeChoisi?.enLigne === true;
    const formulaireValide = modeReglementCode !== '' && passagers.every((p) => p.nom.trim() && p.prenom.trim() && p.telephone.trim());

    return (
        <section className="card card-large">
            <div className="admin-entete">
                <div>
                    <h1>Finaliser la réservation</h1>
                    <p className="muted">Renseignez les passagers et le mode de règlement pour recevoir vos billets QR.</p>
                </div>
                <Link className="lien-discret" to="/">
                    <i className="pi pi-arrow-left" aria-hidden="true" /> Retour à la recherche
                </Link>
            </div>

            <div className="recap-voyage">
                <div>
                    <strong>
                        {offre.villeDepartLibelle} → {offre.villeArriveeLibelle}
                    </strong>
                    <span className="muted">
                        {offre.siteDepart} → {offre.siteArrivee}
                    </span>
                </div>
                <div>
                    {formatDateFr(offre.dateDepart)} à {formatHeure(offre.heureDepart)}
                </div>
                <div>
                    {hasPromotion(offre) && <span className="prix-barre">{formatMontant(offre.montant, offre.devise)}</span>}{' '}
                    <strong>{formatMontant(prixUnitaire, offre.devise)}</strong> / place
                </div>
            </div>

            <h2 className="section-titre">Passagers ({passagers.length})</h2>
            {passagers.map((p, i) => (
                <fieldset key={i} className="passager">
                    <legend>Passager {i + 1}</legend>
                    <div className="passager-grid">
                        <label>
                            Nom *
                            <input value={p.nom} onChange={(e) => setPassager(i, 'nom', e.target.value)} required />
                        </label>
                        <label>
                            Prénom *
                            <input value={p.prenom} onChange={(e) => setPassager(i, 'prenom', e.target.value)} required />
                        </label>
                        <label>
                            Téléphone *
                            <input type="tel" placeholder="+224 6XX XX XX XX" value={p.telephone} onChange={(e) => setPassager(i, 'telephone', e.target.value)} required />
                        </label>
                        <label>
                            Pièce d'identité
                            <input value={p.pieceIdentite ?? ''} onChange={(e) => setPassager(i, 'pieceIdentite', e.target.value)} />
                        </label>
                    </div>
                    {passagers.length > 1 && (
                        <button type="button" className="link-btn danger" onClick={() => setPassagers((prev) => prev.filter((_, j) => j !== i))}>
                            Retirer ce passager
                        </button>
                    )}
                </fieldset>
            ))}
            {passagers.length < maxPassagers && (
                <button type="button" className="secondary bouton-ajout-passager" onClick={() => setPassagers((prev) => [...prev, passagerVide()])}>
                    + Ajouter un passager
                </button>
            )}

            <h2 className="section-titre">Mode de règlement</h2>
            {modesQuery.isError && <p className="error">Impossible de charger les modes de règlement.</p>}
            <div className="modes">
                {(modesQuery.data ?? [])
                    .filter((m) => m.actif !== false)
                    .map((m) => (
                        <label key={m.code} className={`mode ${modeReglementCode === m.code ? 'mode-actif' : ''}`}>
                            <input
                                type="radio"
                                name="modeReglement"
                                value={m.code}
                                checked={modeReglementCode === m.code}
                                onChange={() => setModeReglementCode(m.code ?? '')}
                            />
                            {m.libelle}
                        </label>
                    ))}
            </div>

            {paiementEnLigne && (
                <p className="bandeau-info">
                    Vous serez redirigé vers <strong>{modeChoisi?.libelle}</strong> pour régler. Vos billets sont émis dès que le paiement est confirmé.
                </p>
            )}
            {modeChoisi && !paiementEnLigne && <p className="bandeau-info">Règlement sur place, au départ. Vos billets sont émis immédiatement.</p>}

            <div className="total-bar">
                <span>
                    Total ({passagers.length} {passagers.length > 1 ? 'places' : 'place'})
                </span>
                <strong>{formatMontant(total, offre.devise)}</strong>
            </div>

            {reserver.isError && (
                <p className="error">
                    {paiementEnLigne
                        ? "Le paiement n'a pas pu être ouvert. Aucune place n'a été retenue, réessayez dans un instant."
                        : 'La réservation a échoué. Vérifiez les places disponibles et réessayez.'}
                </p>
            )}
            <button className="bouton-confirmer" disabled={!formulaireValide || reserver.isPending} onClick={() => reserver.mutate()}>
                {reserver.isPending
                    ? paiementEnLigne
                        ? 'Ouverture du paiement…'
                        : 'Réservation en cours…'
                    : paiementEnLigne
                      ? 'Payer et confirmer'
                      : 'Confirmer la réservation'}
            </button>
        </section>
    );
}
