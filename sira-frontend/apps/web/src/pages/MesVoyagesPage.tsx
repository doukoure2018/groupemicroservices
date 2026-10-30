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
import { Button } from 'primereact/button';
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
    const actives = commandes.filter((c) => getStatutCommandeSeverity(c.statut) !== 'danger').length;

    return (
        <section className="card card-large">
            <div className="admin-entete">
                <div>
                    <h1>Mes voyages</h1>
                    <p className="muted">Vos réservations, vos billets QR et leur statut.</p>
                </div>
                <Button
                    icon="pi pi-refresh"
                    label="Actualiser"
                    outlined
                    size="small"
                    loading={commandesQuery.isFetching}
                    onClick={() => void commandesQuery.refetch()}
                />
            </div>

            {commandesQuery.isLoading && <p className="muted">Chargement de vos réservations…</p>}
            {commandesQuery.isError && <p className="error">Impossible de charger vos réservations. Réessayez dans un instant.</p>}

            {commandesQuery.isSuccess && commandes.length === 0 && (
                <div className="etat-vide">
                    <i className="pi pi-ticket grand-icone" aria-hidden="true" />
                    <p>Vous n'avez encore aucune réservation.</p>
                    <Link className="bouton-lien" to="/">
                        <i className="pi pi-search" aria-hidden="true" /> Rechercher un voyage
                    </Link>
                </div>
            )}

            {commandes.length > 0 && (
                <p className="muted compteur-voyages">
                    {commandes.length} réservation{commandes.length > 1 ? 's' : ''} · {actives} active{actives > 1 ? 's' : ''}
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

/** Toutes les commandes ne portent pas les libellés de villes : on retombe sur les gares. */
function titreTrajet(commande: CommandeClient): string {
    const villes = [commande.villeDepartLibelle, commande.villeArriveeLibelle].filter(Boolean);
    if (villes.length === 2) return `${villes[0]} → ${villes[1]}`;
    return `${commande.siteDepart ?? '—'} → ${commande.siteArrivee ?? '—'}`;
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
                        {titreTrajet(commande)}
                    </strong>
                    {commande.villeDepartLibelle && commande.villeArriveeLibelle && (
                        <span className="muted">
                            {commande.siteDepart} → {commande.siteArrivee}
                        </span>
                    )}
                </div>
                <div className="commande-date">
                    <i className="pi pi-calendar" aria-hidden="true" /> {formatDateFr(commande.dateDepart)} à {formatHeure(commande.heureDepart)}
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
                        <i className={billetsOuverts ? 'pi pi-eye-slash' : 'pi pi-qrcode'} aria-hidden="true" />{' '}
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
                    <p>
                        <i className="pi pi-exclamation-triangle" aria-hidden="true" /> Annuler définitivement cette réservation ?
                    </p>
                    <div className="commande-actions">
                        <button type="button" className="danger-btn" disabled={annuler.isPending} onClick={() => annuler.mutate()}>
                            {annuler.isPending ? 'Annulation…' : 'Oui, annuler'}
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
