import { useMutation } from '@tanstack/react-query';
import { ApiError } from '@sira/api-client';
import { formatDateFr, formatHeure, formatMontant, getStatutCommandeLabel, libelleVoyageurs, type CommandeClient } from '@sira/core';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

/**
 * Retrouver ses billets sans compte : le numéro de la confirmation et le
 * contact laissé à la réservation suffisent. Le serveur ne dit jamais si
 * c'est le numéro ou le contact qui ne va pas — sans quoi on pourrait
 * apprendre qu'une réservation existe chez quelqu'un d'autre.
 */
export function ReservationConsultationPage() {
    const [numero, setNumero] = useState('');
    const [contact, setContact] = useState('');

    const recherche = useMutation({
        mutationFn: async () => (await api.commandes.consultation(numero.trim(), contact.trim())).data.commande
    });

    const valide = numero.trim().length >= 6 && contact.trim().length >= 6;
    const commande = recherche.data;

    if (commande) return <Reservation commande={commande} onRecommencer={() => recherche.reset()} />;

    return (
        <section className="card">
            <div className="admin-entete">
                <div>
                    <h1>Rechercher une réservation</h1>
                    <p className="muted">Sans compte : le numéro de votre confirmation et le contact laissé en réservant suffisent.</p>
                </div>
            </div>

            <form
                className="form-grid"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (valide) recherche.mutate();
                }}
            >
                <label className="span-2">
                    Numéro de réservation *
                    <input value={numero} onChange={(e) => setNumero(e.target.value.toUpperCase())} placeholder="CMD-20261101-000012" required />
                </label>
                <label className="span-2">
                    E-mail ou numéro de téléphone *
                    <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="nom@email.com ou +224 6XX XX XX XX" required />
                </label>
                {recherche.isError && (
                    <p className="error span-2">
                        {recherche.error instanceof ApiError && recherche.error.message ? recherche.error.message : 'La recherche a échoué. Réessayez dans un instant.'}
                    </p>
                )}
                <div className="dialog-actions span-2">
                    <button type="submit" className="bouton-confirmer" disabled={!valide || recherche.isPending}>
                        {recherche.isPending ? 'Recherche…' : 'Rechercher une réservation'}
                    </button>
                </div>
            </form>
        </section>
    );
}

function Reservation({ commande, onRecommencer }: { commande: CommandeClient; onRecommencer: () => void }) {
    const billets = commande.billets ?? [];
    const utilisables = commande.statut !== 'EN_ATTENTE' && commande.statut !== 'ANNULEE';

    return (
        <section className="card card-large">
            <div className="admin-entete">
                <div>
                    <h1>
                        {commande.villeDepartLibelle} → {commande.villeArriveeLibelle}
                    </h1>
                    <p className="muted">
                        {formatDateFr(commande.dateDepart)} à {formatHeure(commande.heureDepart)}
                    </p>
                </div>
                <button type="button" className="secondary" onClick={onRecommencer}>
                    <i className="pi pi-search" aria-hidden="true" /> Chercher une autre réservation
                </button>
            </div>

            <p className="confirmation-ligne">
                Commande <strong>{commande.numeroCommande}</strong> — {getStatutCommandeLabel(commande.statut)} —{' '}
                {libelleVoyageurs({
                    adultes: commande.nombreAdultes ?? commande.nombrePlaces ?? 1,
                    enfants: commande.nombreEnfants ?? 0,
                    bagages: commande.nombreBagages ?? 0
                })}{' '}
                — {formatMontant(commande.montantPaye ?? commande.montantTotal, commande.devise)}
            </p>

            {!utilisables ? (
                <p className="bandeau-alerte">
                    {commande.statut === 'ANNULEE'
                        ? 'Cette réservation a été annulée, ses billets ne sont plus valables.'
                        : "Le paiement n'est pas encore confirmé : les billets seront émis dès son encaissement."}
                </p>
            ) : (
                <>
                    <h2 className="section-titre">Vos billets</h2>
                    <ul className="billets">
                        {billets.map((billet) => (
                            <li key={billet.billetUuid} className="billet">
                                <QRCodeSVG value={billet.qrCodeData ?? billet.codeBillet ?? ''} size={128} />
                                <div>
                                    <strong>{billet.nomPassager}</strong>
                                    <span className="muted">
                                        {billet.typePassager === 'ENFANT' ? 'Enfant · ' : ''}Billet {billet.codeBillet}
                                    </span>
                                    {billet.numeroSiege && <span className="muted">Siège {billet.numeroSiege}</span>}
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            <div className="commande-actions">
                <Link className="lien-discret" to="/">
                    <i className="pi pi-arrow-left" aria-hidden="true" /> Retour à l'accueil
                </Link>
            </div>
        </section>
    );
}
