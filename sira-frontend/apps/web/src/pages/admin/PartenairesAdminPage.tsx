import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    formatCommission,
    formatDateFr,
    getLocalisationLabel,
    getStatutPartenaireLabel,
    getStatutPartenaireSeverity,
    getTypePartenaireLabel,
    TYPES_PARTENAIRE,
    type Partenaire,
    type PartenaireRequest
} from '@sira/core';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { useMemo, useState } from 'react';
import { api } from '../../api';
import { confirmerSuppression, num, StatCarte, str, tagSeverity, useNotif } from './shared';

interface PartenaireForm {
    nom: string;
    typePartenaire: string;
    raisonSociale: string;
    numeroRegistre: string;
    telephone: string;
    email: string;
    adresse: string;
    localisationUuid: string;
    responsableNom: string;
    responsableTelephone: string;
    dateDebutPartenariat: string;
    dateFinPartenariat: string;
    commissionPourcentage: string;
    commissionFixe: string;
}

const FORM_VIDE: PartenaireForm = {
    nom: '',
    typePartenaire: 'AGENCE',
    raisonSociale: '',
    numeroRegistre: '',
    telephone: '',
    email: '',
    adresse: '',
    localisationUuid: '',
    responsableNom: '',
    responsableTelephone: '',
    dateDebutPartenariat: '',
    dateFinPartenariat: '',
    commissionPourcentage: '',
    commissionFixe: ''
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function PartenairesAdminPage() {
    const { toast, succes, erreur } = useNotif();
    const queryClient = useQueryClient();
    const CLE = ['admin-partenaires'];

    const partenairesQuery = useQuery({
        queryKey: CLE,
        queryFn: async () => (await api.commercial.partenaires()).data.partenaires
    });
    const localisationsQuery = useQuery({
        queryKey: ['localisations'],
        queryFn: async () => (await api.geo.localisations()).data.localisations
    });

    const [recherche, setRecherche] = useState('');
    const [dialogOuvert, setDialogOuvert] = useState(false);
    const [enEdition, setEnEdition] = useState<Partenaire | null>(null);
    const [form, setForm] = useState<PartenaireForm>(FORM_VIDE);
    const [commissionsDe, setCommissionsDe] = useState<Partenaire | null>(null);
    const [commissions, setCommissions] = useState({ pourcentage: '', fixe: '' });

    const rafraichir = () => void queryClient.invalidateQueries({ queryKey: CLE });

    const liste = useMemo(() => {
        const q = recherche.trim().toLowerCase();
        const tous = partenairesQuery.data ?? [];
        if (!q) return tous;
        return tous.filter((p) => [p.nom, p.typePartenaire, p.villeLibelle, p.responsableNom].some((v) => v?.toLowerCase().includes(q)));
    }, [partenairesQuery.data, recherche]);

    const stats = useMemo(() => {
        const tous = partenairesQuery.data ?? [];
        return { total: tous.length, actifs: tous.filter((p) => p.statut === 'ACTIF').length, enAttente: tous.filter((p) => p.statut === 'EN_ATTENTE').length };
    }, [partenairesQuery.data]);

    const localisationsOptions = useMemo(
        () => (localisationsQuery.data ?? []).map((l) => ({ label: getLocalisationLabel(l), value: l.localisationUuid })),
        [localisationsQuery.data]
    );

    const sauvegarder = useMutation({
        mutationFn: async () => {
            const body: PartenaireRequest = {
                nom: form.nom.trim(),
                typePartenaire: form.typePartenaire,
                raisonSociale: form.raisonSociale || undefined,
                numeroRegistre: form.numeroRegistre || undefined,
                telephone: form.telephone || undefined,
                email: form.email || undefined,
                adresse: form.adresse || undefined,
                localisationUuid: form.localisationUuid || undefined,
                logoUrl: enEdition?.logoUrl,
                responsableNom: form.responsableNom || undefined,
                responsableTelephone: form.responsableTelephone || undefined,
                dateDebutPartenariat: form.dateDebutPartenariat || undefined,
                dateFinPartenariat: form.dateFinPartenariat || undefined,
                commissionPourcentage: num(form.commissionPourcentage) ?? 0,
                commissionFixe: num(form.commissionFixe) ?? 0
            };
            return enEdition ? api.commercial.updatePartenaire(enEdition.partenaireUuid!, body) : api.commercial.createPartenaire(body);
        },
        onSuccess: () => {
            succes(enEdition ? 'Partenaire mis à jour' : 'Partenaire créé');
            setDialogOuvert(false);
            rafraichir();
        },
        onError: (err) => erreur(err, "L'enregistrement du partenaire a échoué.")
    });

    const changerStatut = useMutation({
        mutationFn: async ({ p, statut }: { p: Partenaire; statut: 'ACTIF' | 'SUSPENDU' }) => api.commercial.setStatutPartenaire(p.partenaireUuid!, statut),
        onSuccess: () => {
            succes('Statut mis à jour');
            rafraichir();
        },
        onError: (err) => erreur(err, 'Impossible de changer le statut.')
    });

    const sauverCommissions = useMutation({
        mutationFn: async () =>
            api.commercial.setCommissionsPartenaire(commissionsDe!.partenaireUuid!, num(commissions.pourcentage) ?? 0, num(commissions.fixe) ?? 0),
        onSuccess: () => {
            succes('Commissions mises à jour');
            setCommissionsDe(null);
            rafraichir();
        },
        onError: (err) => erreur(err, 'La mise à jour des commissions a échoué.')
    });

    const supprimer = useMutation({
        mutationFn: async (p: Partenaire) => api.commercial.deletePartenaire(p.partenaireUuid!),
        onSuccess: () => {
            succes('Partenaire supprimé');
            rafraichir();
        },
        onError: (err) => erreur(err, 'La suppression a échoué.')
    });

    function ouvrirCreation() {
        setEnEdition(null);
        setForm(FORM_VIDE);
        setDialogOuvert(true);
    }

    function ouvrirEdition(p: Partenaire) {
        setEnEdition(p);
        setForm({
            nom: p.nom ?? '',
            typePartenaire: p.typePartenaire ?? 'AGENCE',
            raisonSociale: p.raisonSociale ?? '',
            numeroRegistre: p.numeroRegistre ?? '',
            telephone: p.telephone ?? '',
            email: p.email ?? '',
            adresse: p.adresse ?? '',
            localisationUuid: p.localisationUuid ?? '',
            responsableNom: p.responsableNom ?? '',
            responsableTelephone: p.responsableTelephone ?? '',
            dateDebutPartenariat: (p.dateDebutPartenariat ?? '').slice(0, 10),
            dateFinPartenariat: (p.dateFinPartenariat ?? '').slice(0, 10),
            commissionPourcentage: str(p.commissionPourcentage),
            commissionFixe: str(p.commissionFixe)
        });
        setDialogOuvert(true);
    }

    function ouvrirCommissions(p: Partenaire) {
        setCommissionsDe(p);
        setCommissions({ pourcentage: str(p.commissionPourcentage), fixe: str(p.commissionFixe) });
    }

    const emailValide = !form.email || EMAIL_RE.test(form.email);
    const formValide = form.nom.trim().length > 0 && emailValide;

    return (
        <section className="card card-large">
            <Toast ref={toast} />
            <div className="admin-entete">
                <h1>Partenaires</h1>
                <Button label="Nouveau partenaire" icon="pi pi-plus" onClick={ouvrirCreation} />
            </div>

            <div className="stats-ligne">
                <StatCarte libelle="Total" valeur={stats.total} />
                <StatCarte libelle="Actifs" valeur={stats.actifs} ton="succes" />
                <StatCarte libelle="En attente" valeur={stats.enAttente} ton="alerte" />
            </div>

            <div className="barre-filtres">
                <input placeholder="Rechercher (nom, type, ville, responsable)…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
                <Button icon="pi pi-refresh" text rounded tooltip="Actualiser" onClick={rafraichir} />
            </div>

            {partenairesQuery.isError && <p className="error">Impossible de charger les partenaires.</p>}

            <DataTable value={liste} loading={partenairesQuery.isLoading} paginator rows={10} size="small" stripedRows emptyMessage="Aucun partenaire trouvé" scrollable>
                <Column
                    header="Nom"
                    sortable
                    field="nom"
                    body={(p: Partenaire) => (
                        <div className="cellule-trajet">
                            <strong>{p.nom}</strong>
                            {p.raisonSociale && <span className="muted">{p.raisonSociale}</span>}
                        </div>
                    )}
                />
                <Column header="Type" body={(p: Partenaire) => <Tag value={getTypePartenaireLabel(p.typePartenaire)} severity="info" />} />
                <Column
                    header="Contact"
                    body={(p: Partenaire) => (
                        <div className="cellule-trajet">
                            {p.telephone && <span>{p.telephone}</span>}
                            {p.email && <span className="muted">{p.email}</span>}
                        </div>
                    )}
                />
                <Column header="Localisation" body={(p: Partenaire) => p.villeLibelle ?? p.adresse ?? '-'} />
                <Column
                    header="Responsable"
                    body={(p: Partenaire) =>
                        p.responsableNom ? (
                            <div className="cellule-trajet">
                                <span>{p.responsableNom}</span>
                                {p.responsableTelephone && <span className="muted">{p.responsableTelephone}</span>}
                            </div>
                        ) : (
                            '-'
                        )
                    }
                />
                <Column header="Commission" body={(p: Partenaire) => formatCommission(p.commissionPourcentage, p.commissionFixe)} />
                <Column header="Statut" body={(p: Partenaire) => <Tag value={getStatutPartenaireLabel(p.statut)} severity={tagSeverity(getStatutPartenaireSeverity(p.statut))} />} />
                <Column
                    header="Actions"
                    body={(p: Partenaire) => (
                        <div className="cellule-actions">
                            <Button icon="pi pi-pencil" rounded text severity="secondary" tooltip="Modifier" onClick={() => ouvrirEdition(p)} />
                            <Button icon="pi pi-percentage" rounded text severity="info" tooltip="Commissions" onClick={() => ouvrirCommissions(p)} />
                            {p.statut !== 'ACTIF' && (
                                <Button icon="pi pi-check" rounded text severity="success" tooltip="Activer" disabled={changerStatut.isPending} onClick={() => changerStatut.mutate({ p, statut: 'ACTIF' })} />
                            )}
                            {p.statut !== 'SUSPENDU' && (
                                <Button icon="pi pi-ban" rounded text severity="warning" tooltip="Suspendre" disabled={changerStatut.isPending} onClick={() => changerStatut.mutate({ p, statut: 'SUSPENDU' })} />
                            )}
                            <Button icon="pi pi-trash" rounded text severity="danger" tooltip="Supprimer" onClick={() => confirmerSuppression(p.nom ?? 'ce partenaire', () => supprimer.mutate(p))} />
                        </div>
                    )}
                />
            </DataTable>

            <Dialog header={enEdition ? 'Modifier le partenaire' : 'Nouveau partenaire'} visible={dialogOuvert} style={{ width: 'min(760px, 95vw)' }} onHide={() => setDialogOuvert(false)} modal>
                <h3 className="section-titre">Informations générales</h3>
                <div className="form-grid">
                    <label>
                        Nom *
                        <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
                    </label>
                    <label>
                        Type
                        <Dropdown value={form.typePartenaire} options={TYPES_PARTENAIRE} onChange={(e) => setForm({ ...form, typePartenaire: e.value })} />
                    </label>
                    <label>
                        Raison sociale
                        <input value={form.raisonSociale} onChange={(e) => setForm({ ...form, raisonSociale: e.target.value })} />
                    </label>
                    <label>
                        N° Registre
                        <input value={form.numeroRegistre} onChange={(e) => setForm({ ...form, numeroRegistre: e.target.value })} />
                    </label>
                </div>

                <h3 className="section-titre">Contact</h3>
                <div className="form-grid">
                    <label>
                        Téléphone
                        <input type="tel" maxLength={20} value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
                    </label>
                    <label>
                        Email
                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                        {!emailValide && <span className="texte-danger">Adresse email invalide.</span>}
                    </label>
                    <label className="span-2">
                        Adresse
                        <textarea rows={2} value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
                    </label>
                    <label className="span-2">
                        Localisation
                        <Dropdown
                            value={form.localisationUuid || null}
                            options={localisationsOptions}
                            onChange={(e) => setForm({ ...form, localisationUuid: e.value ?? '' })}
                            placeholder="Sélectionner"
                            filter
                            showClear
                            loading={localisationsQuery.isLoading}
                        />
                        {localisationsQuery.isError && <span className="texte-danger">Impossible de charger les localisations (liste déroulante indisponible)</span>}
                    </label>
                </div>

                <h3 className="section-titre">Responsable</h3>
                <div className="form-grid">
                    <label>
                        Nom du responsable
                        <input value={form.responsableNom} onChange={(e) => setForm({ ...form, responsableNom: e.target.value })} />
                    </label>
                    <label>
                        Téléphone du responsable
                        <input type="tel" value={form.responsableTelephone} onChange={(e) => setForm({ ...form, responsableTelephone: e.target.value })} />
                    </label>
                </div>

                <h3 className="section-titre">Partenariat</h3>
                <div className="form-grid">
                    <label>
                        Début du partenariat
                        <input type="date" value={form.dateDebutPartenariat} onChange={(e) => setForm({ ...form, dateDebutPartenariat: e.target.value })} />
                    </label>
                    <label>
                        Fin du partenariat
                        <input type="date" value={form.dateFinPartenariat} onChange={(e) => setForm({ ...form, dateFinPartenariat: e.target.value })} />
                    </label>
                    <label>
                        Commission (%)
                        <input type="number" min={0} max={100} step={0.1} value={form.commissionPourcentage} onChange={(e) => setForm({ ...form, commissionPourcentage: e.target.value })} />
                    </label>
                    <label>
                        Commission fixe (GNF)
                        <input type="number" min={0} step={500} value={form.commissionFixe} onChange={(e) => setForm({ ...form, commissionFixe: e.target.value })} />
                    </label>
                </div>
                <div className="dialog-actions">
                    <Button label="Annuler" text severity="secondary" onClick={() => setDialogOuvert(false)} />
                    <Button label={sauvegarder.isPending ? 'Enregistrement…' : enEdition ? 'Mettre à jour' : 'Créer'} icon="pi pi-check" disabled={!formValide || sauvegarder.isPending} onClick={() => sauvegarder.mutate()} />
                </div>
            </Dialog>

            <Dialog header="Modifier les commissions" visible={!!commissionsDe} style={{ width: 'min(420px, 95vw)' }} onHide={() => setCommissionsDe(null)} modal>
                <p>
                    <strong>{commissionsDe?.nom}</strong>
                    {commissionsDe?.dateFinPartenariat && <span className="muted"> · partenariat jusqu'au {formatDateFr(commissionsDe.dateFinPartenariat)}</span>}
                </p>
                <div className="form-grid">
                    <label>
                        Commission en %
                        <input type="number" min={0} max={100} step={0.1} value={commissions.pourcentage} onChange={(e) => setCommissions({ ...commissions, pourcentage: e.target.value })} />
                    </label>
                    <label>
                        Commission fixe (GNF)
                        <input type="number" min={0} step={500} value={commissions.fixe} onChange={(e) => setCommissions({ ...commissions, fixe: e.target.value })} />
                    </label>
                </div>
                <div className="dialog-actions">
                    <Button label="Annuler" text severity="secondary" onClick={() => setCommissionsDe(null)} />
                    <Button label="Enregistrer" icon="pi pi-check" disabled={sauverCommissions.isPending} onClick={() => sauverCommissions.mutate()} />
                </div>
            </Dialog>
        </section>
    );
}
