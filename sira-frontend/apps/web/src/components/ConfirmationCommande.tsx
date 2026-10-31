import { formatMontant, type CommandeClient } from '@sira/core';
import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';

/**
 * Commande payée et billets utilisables. Partagé par l'écran de réservation
 * (règlement hors ligne, confirmé sur-le-champ) et par la page de retour de
 * paiement, pour que le client voie la même chose dans les deux cas.
 */
export function ConfirmationCommande({ commande, titre }: { commande: CommandeClient; titre?: string }) {
    return (
        <section className="card card-large">
            <div className="admin-entete">
                <div>
                    <h1>{titre ?? 'Réservation confirmée ✓'}</h1>
                    <p className="muted">Présentez ces billets (QR code) à l'embarquement.</p>
                </div>
            </div>

            {/* Le premier <strong> dans un <p> est le numéro de commande : le test du parcours voyageur le relit ici. */}
            <p className="confirmation-ligne">
                Commande <strong>{commande.numeroCommande}</strong> — {formatMontant(commande.montantTotal, commande.devise)} — {commande.nombrePlaces}{' '}
                {(commande.nombrePlaces ?? 1) > 1 ? 'places' : 'place'}
            </p>

            <h2 className="section-titre">Vos billets</h2>
            <ul className="billets">
                {(commande.billets ?? []).map((billet) => (
                    <li key={billet.billetUuid} className="billet">
                        <QRCodeSVG value={billet.qrCodeData ?? billet.codeBillet ?? ''} size={128} />
                        <div>
                            <strong>{billet.nomPassager}</strong>
                            <span className="muted">Billet {billet.codeBillet}</span>
                            {billet.numeroSiege && <span className="muted">Siège {billet.numeroSiege}</span>}
                        </div>
                    </li>
                ))}
            </ul>

            <div className="commande-actions">
                <Link className="bouton-lien" to="/mes-voyages">
                    <i className="pi pi-ticket" aria-hidden="true" /> Voir mes voyages
                </Link>
                <Link className="lien-discret" to="/">
                    <i className="pi pi-arrow-left" aria-hidden="true" /> Réserver un autre voyage
                </Link>
            </div>
        </section>
    );
}
