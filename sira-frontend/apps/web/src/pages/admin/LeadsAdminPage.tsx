import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDateFr, type LeadContactView, type LeadVisiteView, type Propriete, type Proprietaire } from '@sira/core';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Divider } from 'primereact/divider';
import { TabPanel, TabView } from 'primereact/tabview';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { useState } from 'react';
import { api } from '../../api';
import { formatPrixImmo, photoPrincipale } from './immo-partage';
import { useNotif } from './shared';

type Famille = 'contact' | 'visite';
type ActionLead = 'TRAITE' | 'REJETE';

function severiteStatutLead(statut: string | undefined): 'success' | 'warning' | 'danger' | 'secondary' {
    switch (statut) {
        case 'TRAITE':
            return 'success';
        case 'NOUVEAU':
            return 'warning';
        case 'REJETE':
            return 'danger';
        default:
            return 'secondary';
    }
}

interface CibleLead {
    famille: Famille;
    uuid: string;
    libelle: string;
    proprieteUuid?: string;
}

export function LeadsAdminPage() {
    const { toast, succes, erreur } = useNotif();
    const queryClient = useQueryClient();

    const contactsQuery = useQuery({
        queryKey: ['leads-contacts'],
        queryFn: async () => (await api.immo.leads.contacts({ statut: 'NOUVEAU', limit: 50, offset: 0 })).data
    });
    const visitesQuery = useQuery({
        queryKey: ['leads-visites'],
        queryFn: async () => (await api.immo.leads.visites({ statut: 'NOUVEAU', limit: 50, offset: 0 })).data
    });

    const [note, setNote] = useState('');
    const [traiterCible, setTraiterCible] = useState<CibleLead | null>(null);
    const [detailCible, setDetailCible] = useState<CibleLead | null>(null);

    const detailQuery = useQuery({
        queryKey: ['lead-annonce', detailCible?.proprieteUuid],
        queryFn: async () => (await api.immo.proprietes.byUuid(detailCible!.proprieteUuid!)).data.propriete,
        enabled: !!detailCible?.proprieteUuid,
        retry: false
    });

    // Appel secondaire toléré : si le userservice ne répond pas, l'annonce reste consultable.
    const proprietaireQuery = useQuery({
        queryKey: ['lead-proprietaire', detailCible?.proprieteUuid],
        queryFn: async () => (await api.immo.leads.proprietaire(detailCible!.proprieteUuid!)).data.proprietaire,
        enabled: !!detailCible?.proprieteUuid,
        retry: false
    });

    const traiter = useMutation({
        mutationFn: async ({ cible, action }: { cible: CibleLead; action: ActionLead }) => {
            const body = { action, noteAdmin: note.trim() || undefined };
            return cible.famille === 'contact' ? api.immo.leads.traiterContact(cible.uuid, body) : api.immo.leads.traiterVisite(cible.uuid, body);
        },
        onSuccess: (res, { cible, action }) => {
            succes('Succès', res.message || (action === 'TRAITE' ? 'Lead traité' : 'Lead rejeté'));
            void queryClient.invalidateQueries({ queryKey: cible.famille === 'contact' ? ['leads-contacts'] : ['leads-visites'] });
            setTraiterCible(null);
            setDetailCible(null);
            setNote('');
        },
        onError: (err) => erreur(err, 'Une erreur est survenue. Veuillez réessayer.')
    });

    function ouvrirTraitement(cible: CibleLead) {
        setNote('');
        setTraiterCible(cible);
    }

    function ouvrirAnnonce(cible: CibleLead) {
        setNote('');
        setDetailCible(cible);
    }

    const contacts = contactsQuery.data?.contacts ?? [];
    const visites = visitesQuery.data?.visites ?? [];
    const totalContacts = contactsQuery.data?.total ?? contacts.length;
    const totalVisites = visitesQuery.data?.total ?? visites.length;

    const boutonsTraitement = (cible: CibleLead | null, fermer: () => void) => (
        <div className="dialog-actions">
            <Button label="Annuler" text severity="secondary" disabled={traiter.isPending} onClick={fermer} />
            <Button
                label="Rejeter"
                icon="pi pi-times"
                severity="danger"
                disabled={!cible || traiter.isPending}
                loading={traiter.isPending}
                onClick={() => cible && traiter.mutate({ cible, action: 'REJETE' })}
            />
            <Button
                label="Marquer traité"
                icon="pi pi-check"
                severity="success"
                disabled={!cible || traiter.isPending}
                loading={traiter.isPending}
                onClick={() => cible && traiter.mutate({ cible, action: 'TRAITE' })}
            />
        </div>
    );

    const colonnesActions = (famille: Famille) => (
        <Column
            header=""
            body={(row: LeadContactView | LeadVisiteView) => {
                const uuid = famille === 'contact' ? (row as LeadContactView).contact.contactUuid : (row as LeadVisiteView).visite.visiteUuid;
                const cible: CibleLead = { famille, uuid, libelle: row.proprieteTitre, proprieteUuid: row.proprieteUuid };
                return (
                    <div className="cellule-actions">
                        <Button label="Voir" icon="pi pi-eye" size="small" outlined severity="secondary" onClick={() => ouvrirAnnonce(cible)} />
                        <Button label="Traiter" icon="pi pi-check" size="small" onClick={() => ouvrirTraitement(cible)} />
                    </div>
                );
            }}
        />
    );

    const colonneAnnonce = (
        <Column
            header="Annonce"
            body={(row: LeadContactView | LeadVisiteView) => (
                <div className="cellule-trajet">
                    <strong>{row.proprieteTitre}</strong>
                    <span className="muted">{row.proprieteReference}</span>
                </div>
            )}
        />
    );

    const annonce = detailQuery.data;
    const proprietaire: Proprietaire | undefined = proprietaireQuery.data;

    return (
        <section className="card card-large">
            <Toast ref={toast} />
            <div className="admin-entete">
                <div>
                    <h1>Demandes (leads) immobilier</h1>
                    <p className="muted">Contacts et visites à traiter, puis relayer au propriétaire</p>
                </div>
                <Button
                    label="Rafraîchir"
                    icon="pi pi-refresh"
                    size="small"
                    severity="secondary"
                    onClick={() => {
                        void contactsQuery.refetch();
                        void visitesQuery.refetch();
                    }}
                />
            </div>

            <TabView>
                <TabPanel header={`Contacts (${totalContacts})`}>
                    <DataTable value={contacts} loading={contactsQuery.isLoading} paginator={contacts.length > 10} rows={10} size="small" stripedRows emptyMessage="Aucun lead contact en attente." scrollable>
                        {colonneAnnonce}
                        <Column
                            header="Prospect"
                            body={(r: LeadContactView) => (
                                <div className="cellule-trajet">
                                    <span>{r.contact.nomDemandeur}</span>
                                    <span className="muted">{[r.contact.telephoneDemandeur, r.contact.emailDemandeur].filter(Boolean).join(' · ')}</span>
                                </div>
                            )}
                        />
                        <Column header="Type" body={(r: LeadContactView) => r.contact.typeDemande} />
                        <Column header="Message" body={(r: LeadContactView) => <span className="deux-lignes" title={r.contact.message}>{r.contact.message}</span>} />
                        <Column header="Date" body={(r: LeadContactView) => formatDateFr(r.contact.createdAt)} />
                        <Column header="Statut" body={(r: LeadContactView) => <Tag value={r.contact.leadStatut} severity={severiteStatutLead(r.contact.leadStatut)} />} />
                        {colonnesActions('contact')}
                    </DataTable>
                </TabPanel>

                <TabPanel header={`Visites (${totalVisites})`}>
                    <DataTable value={visites} loading={visitesQuery.isLoading} paginator={visites.length > 10} rows={10} size="small" stripedRows emptyMessage="Aucun lead visite en attente." scrollable>
                        {colonneAnnonce}
                        <Column header="Visiteur" body={(r: LeadVisiteView) => `#${r.visite.visiteurUserId}`} />
                        <Column header="Date visite" body={(r: LeadVisiteView) => [formatDateFr(r.visite.dateVisite), r.visite.heureVisite ? `à ${r.visite.heureVisite}` : ''].filter(Boolean).join(' ')} />
                        <Column header="Notes" body={(r: LeadVisiteView) => <span className="deux-lignes" title={r.visite.notesVisiteur ?? ''}>{r.visite.notesVisiteur || '—'}</span>} />
                        <Column header="Demandé le" body={(r: LeadVisiteView) => formatDateFr(r.visite.createdAt)} />
                        <Column header="Statut" body={(r: LeadVisiteView) => <Tag value={r.visite.leadStatut} severity={severiteStatutLead(r.visite.leadStatut)} />} />
                        {colonnesActions('visite')}
                    </DataTable>
                </TabPanel>
            </TabView>

            <Dialog header="Traiter le lead" visible={!!traiterCible} style={{ width: 'min(520px, 95vw)' }} onHide={() => setTraiterCible(null)} modal>
                <p>
                    Annonce : <strong>{traiterCible?.libelle}</strong>
                </p>
                <label className="champ-plein">
                    Note interne (optionnelle)
                    <textarea rows={3} value={note} placeholder="Note de traitement (visible back-office uniquement)…" onChange={(e) => setNote(e.target.value)} />
                </label>
                {boutonsTraitement(traiterCible, () => setTraiterCible(null))}
            </Dialog>

            <Dialog header={`Annonce — ${detailCible?.libelle ?? ''}`} visible={!!detailCible} style={{ width: 'min(740px, 95vw)' }} onHide={() => setDetailCible(null)} modal>
                {detailQuery.isPending && <p className="muted center">Chargement de l'annonce…</p>}
                {detailQuery.isError && <p className="error">Impossible de charger cette annonce.</p>}
                {annonce && (
                    <>
                        {photoPrincipale(annonce, 'url') && <img className="photo-annonce" src={photoPrincipale(annonce, 'url')!} alt="Photo annonce" />}
                        <p className="ligne-titre-annonce">
                            <strong>{annonce.titre}</strong> <Tag value={annonce.typeAnnonce} severity="info" /> <span className="muted">{annonce.reference}</span>
                        </p>
                        <p className="prix-annonce">{formatPrixImmo(annonce, false)}</p>
                        {annonce.adresseComplete && (
                            <p className="muted">
                                <i className="pi pi-map-marker" /> {annonce.adresseComplete}
                            </p>
                        )}
                        <p className="muted meta-annonce">
                            {annonce.nombreChambres != null && <span>{annonce.nombreChambres} ch.</span>}
                            {annonce.nombreSallesBain != null && <span>{annonce.nombreSallesBain} sdb</span>}
                            {annonce.surfaceM2 != null && <span>{annonce.surfaceM2} m²</span>}
                            <span>
                                <i className="pi pi-eye" /> {annonce.nombreVues ?? 0} vues
                            </span>
                        </p>
                        {annonce.description && (
                            <>
                                <Divider />
                                <p className="texte-pre">{annonce.description}</p>
                            </>
                        )}
                        <Divider />
                        <div className="encart-proprietaire">
                            <h3>
                                <i className="pi pi-user" /> Propriétaire de l'annonce
                            </h3>
                            {proprietaire ? (
                                <>
                                    <p>
                                        Nom : {proprietaire.firstName} {proprietaire.lastName}
                                        {proprietaire.typeProfil && <span className="muted"> ({proprietaire.typeProfil})</span>}
                                    </p>
                                    {proprietaire.telephone && <p>Contact : {proprietaire.telephone}</p>}
                                    {proprietaire.email && <p>Email : {proprietaire.email}</p>}
                                    {proprietaire.address && <p>Adresse : {proprietaire.address}</p>}
                                </>
                            ) : (
                                <p className="muted">{proprietaireQuery.isError ? 'Informations propriétaire indisponibles.' : 'Chargement du propriétaire…'}</p>
                            )}
                        </div>
                        <Divider />
                        <label className="champ-plein">
                            Note interne (optionnelle)
                            <textarea rows={2} value={note} placeholder="Note de traitement…" onChange={(e) => setNote(e.target.value)} />
                        </label>
                    </>
                )}
                {boutonsTraitement(annonce ? detailCible : null, () => setDetailCible(null))}
            </Dialog>
        </section>
    );
}
