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
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';

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
        onSuccess: (cmd) => setCommande(cmd)
    });

    if (offreQuery.isLoading) return <p className="muted center">Chargement du voyage…</p>;
    if (offreQuery.isError || !offre) {
        return (
            <section className="card">
                <p className="error">Ce voyage est introuvable ou n'est plus disponible.</p>
                <Link to="/">← Retour à la recherche</Link>
            </section>
        );
    }

    if (commande) return <Confirmation commande={commande} />;

    function setPassager(index: number, champ: keyof PassagerRequest, valeur: string) {
        setPassagers((prev) => prev.map((p, i) => (i === index ? { ...p, [champ]: valeur } : p)));
    }

    const formulaireValide = modeReglementCode !== '' && passagers.every((p) => p.nom.trim() && p.prenom.trim() && p.telephone.trim());

    return (
        <section className="card">
            <h1>Finaliser la réservation</h1>

            <div className="recap">
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

            <h2>Passagers ({passagers.length})</h2>
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
                <button type="button" className="secondary" onClick={() => setPassagers((prev) => [...prev, passagerVide()])}>
                    + Ajouter un passager
                </button>
            )}

            <h2>Mode de règlement</h2>
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

            <div className="total-bar">
                <span>
                    Total ({passagers.length} {passagers.length > 1 ? 'places' : 'place'})
                </span>
                <strong>{formatMontant(total, offre.devise)}</strong>
            </div>

            {reserver.isError && <p className="error">La réservation a échoué. Vérifiez les places disponibles et réessayez.</p>}
            <button disabled={!formulaireValide || reserver.isPending} onClick={() => reserver.mutate()}>
                {reserver.isPending ? 'Réservation en cours…' : 'Confirmer la réservation'}
            </button>
        </section>
    );
}

function Confirmation({ commande }: { commande: CommandeClient }) {
    return (
        <section className="card">
            <h1>Réservation confirmée ✓</h1>
            <p>
                Commande <strong>{commande.numeroCommande}</strong> — {formatMontant(commande.montantTotal, commande.devise)} —{' '}
                {commande.nombrePlaces} {(commande.nombrePlaces ?? 1) > 1 ? 'places' : 'place'}
            </p>
            <p className="muted">Présentez ces billets (QR code) à l'embarquement.</p>

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
                <Link to="/mes-voyages">Voir mes voyages</Link>
                <Link to="/">← Réserver un autre voyage</Link>
            </div>
        </section>
    );
}
