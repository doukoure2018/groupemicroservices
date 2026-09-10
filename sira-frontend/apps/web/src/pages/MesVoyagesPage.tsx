import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    formatDateFr,
    formatHeure,
    formatMontant,
    getStatutCommandeLabel,
    getStatutCommandeSeverity,
    isCommandeAnnulable,
    type CommandeClient
} from '@sira/core';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export function MesVoyagesPage() {
    const commandesQuery = useQuery({
        queryKey: ['mes-commandes'],
        queryFn: async () => (await api.commandes.mesCommandes()).data.commandes
    });

    const commandes = commandesQuery.data ?? [];

    return (
        <section className="card">
            <h1>Mes voyages</h1>

            {commandesQuery.isLoading && <p className="muted">Chargement de vos réservations…</p>}
            {commandesQuery.isError && <p className="error">Impossible de charger vos réservations. Réessayez dans un instant.</p>}

            {commandesQuery.isSuccess && commandes.length === 0 && (
                <p className="muted">
                    Vous n'avez encore aucune réservation. <Link to="/">Rechercher un voyage</Link>
                </p>
            )}

            <ul className="commandes">
                {commandes.map((commande) => (
                    <CommandeCard key={commande.commandeUuid} commande={commande} />
                ))}
            </ul>
        </section>
    );
}

function CommandeCard({ commande }: { commande: CommandeClient }) {
    const [billetsOuverts, setBilletsOuverts] = useState(false);
    const [confirmerAnnulation, setConfirmerAnnulation] = useState(false);
    const queryClient = useQueryClient();

    const annuler = useMutation({
        mutationFn: async () => (await api.commandes.annuler(commande.commandeUuid!)).data.commande,
        onSuccess: () => {
            setConfirmerAnnulation(false);
            void queryClient.invalidateQueries({ queryKey: ['mes-commandes'] });
        }
    });

    const billets = commande.billets ?? [];

    return (
        <li className={`commande statut-${getStatutCommandeSeverity(commande.statut)}`}>
            <div className="commande-entete">
                <div className="commande-trajet">
                    <strong>
                        {commande.villeDepartLibelle} → {commande.villeArriveeLibelle}
                    </strong>
                    <span className="muted">
                        {commande.siteDepart} → {commande.siteArrivee}
                    </span>
                </div>
                <div className="commande-date">
                    {formatDateFr(commande.dateDepart)} à {formatHeure(commande.heureDepart)}
                </div>
                <span className={`badge badge-${getStatutCommandeSeverity(commande.statut)}`}>{getStatutCommandeLabel(commande.statut)}</span>
            </div>

            <div className="commande-details">
                <span className="muted">Commande {commande.numeroCommande}</span>
                <span>
                    {commande.nombrePlaces} {(commande.nombrePlaces ?? 1) > 1 ? 'places' : 'place'} —{' '}
                    <strong>{formatMontant(commande.montantTotal, commande.devise)}</strong>
                </span>
            </div>

            <div className="commande-actions">
                {billets.length > 0 && (
                    <button type="button" className="secondary" onClick={() => setBilletsOuverts((o) => !o)}>
                        {billetsOuverts ? 'Masquer les billets' : `Voir les billets (${billets.length})`}
                    </button>
                )}
                {isCommandeAnnulable(commande.statut) && !confirmerAnnulation && (
                    <button type="button" className="danger-btn" onClick={() => setConfirmerAnnulation(true)}>
                        Annuler la réservation
                    </button>
                )}
            </div>

            {confirmerAnnulation && (
                <div className="confirm-annulation">
                    <p>Annuler définitivement cette réservation ?</p>
                    <div className="commande-actions">
                        <button type="button" className="danger-btn" disabled={annuler.isPending} onClick={() => annuler.mutate()}>
                            {annuler.isPending ? 'Annulation…' : "Oui, annuler"}
                        </button>
                        <button type="button" className="secondary" onClick={() => setConfirmerAnnulation(false)}>
                            Non, conserver
                        </button>
                    </div>
                    {annuler.isError && <p className="error">L'annulation a été refusée (délai dépassé ou voyage déjà commencé).</p>}
                </div>
            )}

            {billetsOuverts && (
                <ul className="billets">
                    {billets.map((billet) => (
                        <li key={billet.billetUuid} className="billet">
                            <QRCodeSVG value={billet.qrCodeData ?? billet.codeBillet ?? ''} size={110} />
                            <div>
                                <strong>{billet.nomPassager}</strong>
                                <span className="muted">Billet {billet.codeBillet}</span>
                                {billet.numeroSiege && <span className="muted">Siège {billet.numeroSiege}</span>}
                                {billet.statut && <span className="muted">{billet.statut}</span>}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
}
