import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@sira/api-client';
import { formatMontant, libellePeriode, resumeBien, type Propriete } from '@sira/core';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';

/**
 * La fiche publique d'un bien sur le site : c'est là que mènent les liens des
 * courriels, des SMS et des notifications. Le site n'a pas de recherche de
 * biens, l'application en a une : la page montre l'essentiel et renvoie vers
 * elle pour contacter, visiter ou mettre de côté. Sur Android, si
 * l'application est installée, le lien ouvre directement la fiche.
 */
export function BienPage() {
    const { uuid = '' } = useParams<{ uuid: string }>();
    const [photo, setPhoto] = useState(0);
    const bien = useQuery({
        queryKey: ['bien-public', uuid],
        queryFn: async () => (await api.immo.proprietes.byUuid(uuid)).data.propriete,
        enabled: !!uuid,
        retry: (n, e) => !(e instanceof ApiError && e.status === 404) && n < 2
    });

    if (bien.isPending) {
        return (
            <section className="card">
                <p className="muted">Chargement du bien…</p>
            </section>
        );
    }
    if (bien.isError || !bien.data) {
        return (
            <section className="card">
                <h1>Bien introuvable</h1>
                <p className="muted">L'annonce a peut-être été retirée. Les biens à louer ou à acheter se cherchent dans l'application SYNERGIA.</p>
                <a className="bouton-lien" href="sira://biens">
                    <i className="pi pi-mobile" aria-hidden="true" /> Ouvrir l'application
                </a>
            </section>
        );
    }

    const p: Propriete = bien.data;
    const photos = p.photos ?? [];
    const courante = photos[photo] ?? photos[0];
    const location = p.typeAnnonce === 'LOCATION';
    const periode = libellePeriode(p.periode);
    const resume = resumeBien(p);
    const lienApplication = `sira://bien/${encodeURIComponent(p.proprieteUuid)}`;

    return (
        <article className="card card-large">
            <p className="muted">
                <span className={`badge ${location ? 'badge-warn' : 'badge-success'}`}>{location ? 'Location' : 'Vente'}</span>
                {p.statut !== 'PUBLIE' ? <span className="badge badge-secondary">Annonce retirée</span> : null}
            </p>
            <h1>{p.titre}</h1>
            <p className="prix-bien">
                {p.prixSurDemande ? 'Prix sur demande' : formatMontant(p.prix, p.devise)}
                {periode && !p.prixSurDemande ? <span className="muted"> {periode}</span> : null}
            </p>

            {courante ? (
                <figure className="galerie">
                    <img className="galerie-image" src={courante.url} alt={p.titre} />
                    {photos.length > 1 && (
                        <div className="galerie-vignettes">
                            {photos.map((ph, i) => (
                                <button key={ph.photoUuid} type="button" className={`galerie-bouton${i === photo ? ' active' : ''}`} onClick={() => setPhoto(i)} aria-label={`Photo ${i + 1} sur ${photos.length}`}>
                                    <img className="galerie-vignette" src={ph.urlThumbnail || ph.url} alt="" />
                                </button>
                            ))}
                        </div>
                    )}
                </figure>
            ) : (
                <p className="muted">Cette annonce n'a pas encore de photo.</p>
            )}

            <div className="grille-detail">
                {!!resume && (
                    <div className="bloc-detail">
                        <strong>Le bien</strong>
                        <p>{resume}</p>
                        {location && (p.moisCaution || p.moisAvance) ? (
                            <p className="muted">
                                {p.moisCaution ? `Caution ${p.moisCaution} mois` : ''}
                                {p.moisCaution && p.moisAvance ? ' · ' : ''}
                                {p.moisAvance ? `Avance ${p.moisAvance} mois` : ''}
                            </p>
                        ) : null}
                    </div>
                )}
                {!!p.adresseComplete && (
                    <div className="bloc-detail">
                        <strong>Où</strong>
                        <p>{p.adresseComplete}</p>
                    </div>
                )}
                {!!p.description && (
                    <div className="bloc-detail span-2">
                        <strong>Description</strong>
                        <p style={{ whiteSpace: 'pre-line' }}>{p.description}</p>
                    </div>
                )}
                {p.commodites?.length > 0 && (
                    <div className="bloc-detail span-2">
                        <strong>Commodités</strong>
                        <p>{p.commodites.map((c) => c.libelle).join(' · ')}</p>
                    </div>
                )}
                <div className="bloc-detail span-2">
                    <strong>Qui publie</strong>
                    <p>
                        {p.nomContactPublic || 'Particulier'}
                        {p.reference ? <span className="muted"> · référence {p.reference}</span> : null}
                    </p>
                </div>
            </div>

            <div className="actions-bien">
                <a className="bouton-lien" href={lienApplication}>
                    <i className="pi pi-mobile" aria-hidden="true" /> Contacter ou visiter dans l'application
                </a>
                <p className="muted">
                    Contacter le publieur, demander une visite et mettre de côté se font dans l'application SYNERGIA. Sur Android, ce lien l'ouvre directement si elle est installée.{' '}
                    <Link className="lien-discret" to="/">
                        Retour à l'accueil
                    </Link>
                </p>
            </div>
        </article>
    );
}
