import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDateFr, type Commodite, type Photo, type Propriete, type Vendeur } from '@sira/core';
import { Button } from 'primereact/button';
import { Chip } from 'primereact/chip';
import { Column } from 'primereact/column';
import { confirmDialog } from 'primereact/confirmdialog';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Divider } from 'primereact/divider';
import { Galleria } from 'primereact/galleria';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { useState } from 'react';
import { api } from '../../api';
import { formatPrixImmo, libelleTypeProfil, lienCarte, photoPrincipale, severiteVerification } from './immo-partage';
import { StatCarte, useNotif } from './shared';

const MOTIF_MIN = 15;
const MOTIF_MAX = 500;

const PLACEHOLDER_MOTIF = `Soyez constructif. Exemples :
• « Photos floues, merci de reuploader des photos plus nettes »
• « Description incomplète, ajoutez le quartier exact et les commodités »
• « Le prix annoncé semble incohérent avec la surface »`;

export function ModerationAdminPage() {
    const { toast, succes, erreur } = useNotif();
    const queryClient = useQueryClient();
    const CLE = ['moderation-proprietes'];

    const fileQuery = useQuery({
        queryKey: CLE,
        queryFn: async () => (await api.immo.proprietes.moderation({ limit: 50, offset: 0 })).data
    });

    const [detailUuid, setDetailUuid] = useState<string | null>(null);
    const [rejetDe, setRejetDe] = useState<Propriete | null>(null);
    const [motif, setMotif] = useState('');
    const [motifTouche, setMotifTouche] = useState(false);

    const detailQuery = useQuery({
        queryKey: ['moderation-detail', detailUuid],
        queryFn: async () => (await api.immo.proprietes.moderationDetail(detailUuid!)).data,
        enabled: !!detailUuid,
        retry: false
    });

    const rafraichir = () => void queryClient.invalidateQueries({ queryKey: CLE });

    const valider = useMutation({
        mutationFn: async (p: Propriete) => api.immo.proprietes.valider(p.proprieteUuid),
        onSuccess: (res) => {
            succes('Succès', res.message || 'Annonce validée');
            setDetailUuid(null);
            rafraichir();
        },
        onError: (err) => erreur(err, 'Une erreur est survenue. Veuillez réessayer.')
    });

    const rejeter = useMutation({
        mutationFn: async () => api.immo.proprietes.rejeter(rejetDe!.proprieteUuid, { motif: motif.trim() }),
        onSuccess: (res) => {
            succes('Succès', res.message || 'Annonce rejetée — annonceur notifié');
            setRejetDe(null);
            setMotif('');
            setMotifTouche(false);
            setDetailUuid(null);
            rafraichir();
        },
        onError: (err) => erreur(err, 'Une erreur est survenue. Veuillez réessayer.')
    });

    /**
     * Validation depuis la liste : le bouton secondaire ouvre le détail plutôt que
     * d'annuler. PrimeReact n'appelle `reject` que sur ce bouton, jamais sur une
     * fermeture par Échap, ce qui reproduit la distinction de l'écran Angular.
     */
    function confirmerValidationRapide(p: Propriete) {
        confirmDialog({
            header: 'Confirmation rapide',
            icon: 'pi pi-question-circle',
            message: `Valider « ${p.titre} » sans avoir ouvert le détail ?`,
            acceptLabel: "J'ai vérifié, valider",
            rejectLabel: 'Voir les détails d’abord',
            acceptClassName: 'p-button-success',
            rejectClassName: 'p-button-text',
            accept: () => valider.mutate(p),
            reject: () => setDetailUuid(p.proprieteUuid)
        });
    }

    function confirmerValidationDetail(p: Propriete) {
        confirmDialog({
            header: 'Valider la publication',
            icon: 'pi pi-check-circle',
            message: `Publier « ${p.titre} » ? L'annonceur sera notifié par email.`,
            acceptLabel: 'Valider et publier',
            rejectLabel: 'Annuler',
            acceptClassName: 'p-button-success',
            accept: () => valider.mutate(p)
        });
    }

    function ouvrirRejet(p: Propriete) {
        setRejetDe(p);
        setMotif('');
        setMotifTouche(false);
    }

    const motifTrim = motif.trim();
    const erreurMotif = !motifTrim ? 'Le motif est obligatoire' : motifTrim.length < MOTIF_MIN ? `Minimum ${MOTIF_MIN} caractères (motif clair pour le vendeur)` : motif.length > MOTIF_MAX ? `Maximum ${MOTIF_MAX} caractères` : null;

    const proprietes = fileQuery.data?.proprietes ?? [];
    const total = fileQuery.data?.total ?? proprietes.length;
    const detail = detailQuery.data;
    const p = detail?.propriete;
    const vendeur: Vendeur | undefined = detail?.vendeur;

    return (
        <section className="card card-large">
            <Toast ref={toast} />
            <div className="admin-entete">
                <div>
                    <h1>Modération des annonces immobilières</h1>
                    <p className="muted">Validation des annonces en attente avant publication publique</p>
                </div>
                <Button label="Actualiser" icon="pi pi-refresh" outlined loading={fileQuery.isFetching} onClick={rafraichir} />
            </div>

            <div className="stats-ligne">
                <StatCarte libelle="En attente de modération" valeur={total} ton="alerte" />
            </div>

            {fileQuery.isError && <p className="error">Impossible de charger la file de modération.</p>}

            <DataTable
                value={proprietes}
                loading={fileQuery.isLoading}
                paginator
                rows={10}
                rowsPerPageOptions={[10, 25, 50]}
                size="small"
                stripedRows
                emptyMessage="Aucune annonce en attente de modération"
                scrollable
            >
                <Column
                    header="Photo"
                    body={(row: Propriete) => {
                        const url = photoPrincipale(row, 'thumbnail');
                        return url ? <img className="vignette-annonce" src={url} alt="" /> : <span className="vignette-vide"><i className="pi pi-image" /></span>;
                    }}
                />
                <Column
                    header="Titre"
                    field="titre"
                    sortable
                    body={(row: Propriete) => (
                        <div className="cellule-trajet">
                            <strong>{row.titre}</strong>
                            <span className="muted">{row.reference}</span>
                        </div>
                    )}
                />
                <Column header="Type" body={(row: Propriete) => <Tag value={row.typeAnnonce} severity={row.typeAnnonce === 'VENTE' ? 'info' : 'success'} />} />
                <Column header="Prix" body={(row: Propriete) => formatPrixImmo(row)} />
                <Column header="Localisation" body={(row: Propriete) => row.adresseComplete || '—'} />
                <Column header="Créée le" field="createdAt" sortable body={(row: Propriete) => formatDateFr(row.createdAt)} />
                <Column
                    header="Actions"
                    body={(row: Propriete) => (
                        <div className="cellule-actions">
                            <Button label="Voir détails" icon="pi pi-eye" size="small" outlined severity="info" tooltip="Galerie photos + profil vendeur" onClick={() => setDetailUuid(row.proprieteUuid)} />
                            <Button icon="pi pi-check" rounded text severity="success" tooltip="Valider rapidement" disabled={valider.isPending} onClick={() => confirmerValidationRapide(row)} />
                            <Button icon="pi pi-times" rounded text severity="danger" tooltip="Rejeter avec motif" onClick={() => ouvrirRejet(row)} />
                        </div>
                    )}
                />
            </DataTable>

            <Dialog
                header={p ? `${p.reference} · soumise le ${formatDateFr(p.createdAt)}` : 'Chargement…'}
                visible={!!detailUuid}
                style={{ width: '90vw', maxWidth: '1100px' }}
                onHide={() => setDetailUuid(null)}
                modal
                maximizable
            >
                {detailQuery.isPending && <p className="muted center">Chargement du détail…</p>}
                {detailQuery.isError && <p className="error">Impossible de charger cette annonce.</p>}
                {p && (
                    <>
                        <p className="ligne-titre-annonce">
                            <Tag value={p.typeAnnonce} severity={p.typeAnnonce === 'VENTE' ? 'info' : 'success'} /> <strong>{p.titre}</strong>
                        </p>

                        {p.photos?.length ? (
                            <Galleria
                                value={p.photos}
                                numVisible={5}
                                style={{ maxWidth: '100%' }}
                                showItemNavigatorsOnHover
                                showIndicators={false}
                                item={(photo: Photo) => <img className="galerie-image" src={photo.url} alt="" />}
                                thumbnail={(photo: Photo) => <img className="galerie-vignette" src={photo.urlThumbnail ?? photo.url} alt="" />}
                            />
                        ) : (
                            <p className="bandeau-alerte">
                                <i className="pi pi-exclamation-triangle" /> Aucune photo fournie par le vendeur — à signaler dans le motif si vous rejetez
                            </p>
                        )}

                        <div className="grille-detail">
                            <div className="bloc-detail">
                                <h3 className="section-titre">Prix &amp; conditions</h3>
                                <p className="prix-annonce">{formatPrixImmo(p)}</p>
                                {p.prixNegociable && <Tag value="Négociable" severity="info" />}
                                {p.typeAnnonce === 'LOCATION' && p.dureeLocation && <p>Durée : {p.dureeLocation}</p>}
                            </div>

                            <div className="bloc-detail">
                                <h3 className="section-titre">Spécifications</h3>
                                {p.nombreChambres != null && <p>Chambres : {p.nombreChambres}</p>}
                                {p.nombreSallesBain != null && <p>Salles de bain : {p.nombreSallesBain}</p>}
                                {p.surfaceM2 != null && <p>Surface : {p.surfaceM2} m²</p>}
                            </div>

                            <div className="bloc-detail span-2">
                                <h3 className="section-titre">Localisation</h3>
                                <p>Adresse : {p.adresseComplete || '—'}</p>
                                {lienCarte(p) && (
                                    <p>
                                        Coordonnées : {p.latitude}, {p.longitude}{' '}
                                        <a href={lienCarte(p)!} target="_blank" rel="noopener noreferrer">
                                            Voir sur la carte <i className="pi pi-external-link" />
                                        </a>
                                    </p>
                                )}
                            </div>

                            <div className="bloc-detail span-2">
                                <h3 className="section-titre">Description</h3>
                                <p className="texte-pre">{p.description || '—'}</p>
                            </div>

                            {p.commodites?.length > 0 && (
                                <div className="bloc-detail span-2">
                                    <h3 className="section-titre">Commodités ({p.commodites.length})</h3>
                                    <div className="cellule-actions">
                                        {p.commodites.map((c: Commodite) => (
                                            <Chip key={c.commoditeId} label={c.libelle} icon={`pi pi-${c.icone || 'tag'}`} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {vendeur && (
                                <div className="bloc-detail span-2">
                                    <h3 className="section-titre">Profil vendeur</h3>
                                    {vendeur.userLookupError && (
                                        <p className="bandeau-alerte">
                                            <i className="pi pi-exclamation-triangle" /> Informations utilisateur indisponibles au moment de la requête
                                        </p>
                                    )}
                                    <dl className="recap">
                                        <dt>Nom</dt>
                                        <dd>{`${vendeur.firstName || '—'} ${vendeur.lastName || ''}`.trim()}</dd>
                                        <dt>Type</dt>
                                        <dd>{libelleTypeProfil(vendeur.typeProfil)}</dd>
                                        <dt>Email</dt>
                                        <dd>{vendeur.email || '—'}</dd>
                                        <dt>Téléphone</dt>
                                        <dd>{vendeur.phone || vendeur.telephoneContactProfil || 'Non renseigné'}</dd>
                                        <dt>Profil vérifié</dt>
                                        <dd>
                                            <Tag value={vendeur.statutVerification || 'INCONNU'} severity={severiteVerification(vendeur.statutVerification)} />
                                        </dd>
                                        <dt>Annonces actives</dt>
                                        <dd>{vendeur.nombreProprietesActives ?? 0}</dd>
                                        {vendeur.bio && (
                                            <>
                                                <dt>Bio</dt>
                                                <dd>{vendeur.bio}</dd>
                                            </>
                                        )}
                                    </dl>
                                    <Divider />
                                    <p className="muted">Contact affiché dans l'annonce</p>
                                    <p>
                                        {p.nomContactPublic || '—'} · {p.telephoneContact || '—'}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="dialog-actions">
                            <Button label="Rejeter" icon="pi pi-times" severity="danger" outlined onClick={() => ouvrirRejet(p)} />
                            <Button label="Valider et publier" icon="pi pi-check" severity="success" disabled={valider.isPending} onClick={() => confirmerValidationDetail(p)} />
                        </div>
                    </>
                )}
            </Dialog>

            <Dialog header="Rejeter l'annonce" visible={!!rejetDe} style={{ width: 'min(620px, 95vw)' }} onHide={() => setRejetDe(null)} modal>
                <p className="muted">{rejetDe?.reference}</p>
                <p>
                    <strong>{rejetDe?.titre}</strong>
                </p>
                <label className="champ-plein">
                    Motif du rejet *
                    <span className="muted">Ce message sera envoyé par email à l'annonceur. Restez constructif et précis pour qu'il puisse corriger.</span>
                    <textarea
                        rows={6}
                        maxLength={MOTIF_MAX}
                        value={motif}
                        placeholder={PLACEHOLDER_MOTIF}
                        onChange={(e) => setMotif(e.target.value)}
                        onBlur={() => setMotifTouche(true)}
                    />
                    <span className="muted">
                        {motifTrim.length} / {MOTIF_MAX} caractères
                    </span>
                    {motifTouche && erreurMotif && <span className="texte-danger">{erreurMotif}</span>}
                </label>
                <div className="dialog-actions">
                    <Button label="Annuler" outlined severity="secondary" onClick={() => setRejetDe(null)} />
                    <Button
                        label="Rejeter et notifier"
                        icon="pi pi-send"
                        severity="danger"
                        disabled={!!erreurMotif || rejeter.isPending}
                        loading={rejeter.isPending}
                        onClick={() => {
                            setMotifTouche(true);
                            if (!erreurMotif) rejeter.mutate();
                        }}
                    />
                </div>
            </Dialog>
        </section>
    );
}
