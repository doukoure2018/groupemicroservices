import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDateFr, type Role, type User } from '@sira/core';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { confirmDialog } from 'primereact/confirmdialog';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { useMemo, useState } from 'react';
import { api } from '../../api';
import { StatCarte, useNotif } from './shared';

/** Rôles qu'un administrateur peut attribuer à la création (le serveur revérifie). */
const ROLES_ASSIGNABLES = ['ADMIN_CONFORMITE', 'ADMIN_BACKOFFICE', 'CONTROLEUR', 'MANAGER', 'ADMIN'] as const;

const LIBELLES_ROLE: Record<string, string> = {
    ADMIN_CONFORMITE: 'Conformité (validation agences)',
    ADMIN_BACKOFFICE: 'Back-office (leads immo)',
    CONTROLEUR: 'Contrôleur (validation billets)',
    MANAGER: 'Manager',
    ADMIN: 'Administrateur'
};

function severiteRole(role: string | undefined): 'danger' | 'warning' | 'info' | 'contrast' | 'secondary' | 'success' {
    switch (role) {
        case 'SUPER_ADMIN':
            return 'danger';
        case 'ADMIN':
            return 'warning';
        case 'MANAGER':
        case 'ADMIN_IMMO':
            return 'info';
        case 'CONTROLEUR':
        case 'ADMIN_CONFORMITE':
        case 'ADMIN_BACKOFFICE':
            return 'contrast';
        case 'TECH_SUPPORT':
            return 'secondary';
        default:
            return 'success';
    }
}

/** Alphabet sans caractères ambigus (ni I/O/l/o/0/1), pour un mot de passe dicté au téléphone. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

function genererMotDePasse(): string {
    let out = '';
    for (let i = 0; i < 10; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    return out + '#1';
}

interface EditForm {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
}

interface CreateForm extends EditForm {
    roleName: string;
    password: string;
}

const CREATE_VIDE: CreateForm = { firstName: '', lastName: '', email: '', phone: '', roleName: '', password: '' };

export function UtilisateursAdminPage() {
    const { toast, succes, erreur } = useNotif();
    const queryClient = useQueryClient();
    const CLE = ['admin-utilisateurs'];

    const usersQuery = useQuery({ queryKey: CLE, queryFn: async () => (await api.users.list()).data.users ?? [] });
    const rolesQuery = useQuery({ queryKey: ['roles'], queryFn: async () => (await api.users.roles()).data.roles ?? [] });

    const [recherche, setRecherche] = useState('');
    const [roleDe, setRoleDe] = useState<User | null>(null);
    const [nouveauRole, setNouveauRole] = useState<string | null>(null);
    const [editDe, setEditDe] = useState<User | null>(null);
    const [editForm, setEditForm] = useState<EditForm>({ firstName: '', lastName: '', email: '', phone: '' });
    const [creationOuverte, setCreationOuverte] = useState(false);
    const [createForm, setCreateForm] = useState<CreateForm>(CREATE_VIDE);

    const rafraichir = () => void queryClient.invalidateQueries({ queryKey: CLE });

    const users = usersQuery.data ?? [];
    const liste = useMemo(() => {
        const q = recherche.trim().toLowerCase();
        if (!q) return users;
        return users.filter((u) => [u.firstName, u.lastName, u.email, u.username, u.role].some((v) => v?.toLowerCase().includes(q)));
    }, [users, recherche]);

    const stats = useMemo(
        () => ({
            total: users.length,
            actifs: users.filter((u) => u.enabled).length,
            controleurs: users.filter((u) => u.role === 'CONTROLEUR').length,
            admins: users.filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length
        }),
        [users]
    );

    // Croisement whitelist / rôles serveur ; si le référentiel n'a pas chargé, on garde la whitelist.
    const rolesCreation = useMemo(() => {
        const noms = (rolesQuery.data ?? []).map((r: Role) => r.name);
        const dispo = ROLES_ASSIGNABLES.filter((r) => noms.includes(r));
        const source = dispo.length ? dispo : [...ROLES_ASSIGNABLES];
        return source.map((r) => ({ label: LIBELLES_ROLE[r] ?? r, value: r }));
    }, [rolesQuery.data]);

    const tousRoles = useMemo(() => (rolesQuery.data ?? []).map((r: Role) => ({ label: r.name, value: r.name })), [rolesQuery.data]);

    const changerRole = useMutation({
        mutationFn: async () => api.users.updateRole(roleDe!.userUuid!, nouveauRole!),
        onSuccess: (res) => {
            succes('Succès', res.message || 'Rôle mis à jour avec succès');
            setRoleDe(null);
            rafraichir();
        },
        onError: (err) => erreur(err, 'Une erreur est survenue. Veuillez réessayer.')
    });

    const basculerActivation = useMutation({
        mutationFn: async (u: User) => api.users.toggleEnabled(u.userUuid!),
        onSuccess: (res) => {
            succes('Succès', res.message || 'Statut du compte modifié');
            rafraichir();
        },
        onError: (err) => erreur(err, 'Une erreur est survenue. Veuillez réessayer.')
    });

    const modifier = useMutation({
        mutationFn: async () =>
            api.users.adminUpdate(editDe!.userUuid!, {
                firstName: editForm.firstName.trim(),
                lastName: editForm.lastName.trim(),
                email: editForm.email.trim(),
                phone: editForm.phone.trim() || undefined
            }),
        onSuccess: (res) => {
            succes('Succès', res.message || 'Utilisateur mis à jour');
            setEditDe(null);
            rafraichir();
        },
        onError: (err) => erreur(err, 'Une erreur est survenue. Veuillez réessayer.')
    });

    const creer = useMutation({
        mutationFn: async () =>
            api.users.adminCreate({
                firstName: createForm.firstName.trim(),
                lastName: createForm.lastName.trim(),
                email: createForm.email.trim(),
                phone: createForm.phone.trim() || undefined,
                password: createForm.password,
                roleName: createForm.roleName
            }),
        onSuccess: (res) => {
            succes('Succès', res.message || 'Utilisateur créé et activé');
            setCreationOuverte(false);
            rafraichir();
        },
        onError: (err) => erreur(err, 'Une erreur est survenue. Veuillez réessayer.')
    });

    function ouvrirRole(u: User) {
        setRoleDe(u);
        setNouveauRole(u.role ?? null);
    }

    function ouvrirEdition(u: User) {
        setEditDe(u);
        setEditForm({ firstName: u.firstName ?? '', lastName: u.lastName ?? '', email: u.email ?? '', phone: u.phone ?? '' });
    }

    function ouvrirCreation() {
        setCreateForm({ ...CREATE_VIDE, password: genererMotDePasse() });
        setCreationOuverte(true);
    }

    function confirmerBascule(u: User) {
        const verbe = u.enabled ? 'bloquer' : 'débloquer';
        confirmDialog({
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            message: `Voulez-vous ${verbe} le compte de « ${u.firstName} ${u.lastName} » ?`,
            acceptLabel: `Oui, ${verbe}`,
            rejectLabel: 'Non',
            accept: () => basculerActivation.mutate(u)
        });
    }

    function confirmerRole() {
        if (!roleDe || !nouveauRole) return;
        if (nouveauRole === roleDe.role) {
            setRoleDe(null);
            return;
        }
        confirmDialog({
            header: 'Confirmation',
            icon: 'pi pi-exclamation-triangle',
            message: `Êtes-vous sûr de vouloir changer le rôle de « ${roleDe.firstName} ${roleDe.lastName} » de ${roleDe.role} à ${nouveauRole} ?`,
            acceptLabel: 'Oui, modifier',
            rejectLabel: 'Non',
            accept: () => changerRole.mutate()
        });
    }

    const editValide = !!editForm.firstName && !!editForm.lastName && !!editForm.email;
    const createValide = !!createForm.firstName && !!createForm.lastName && !!createForm.email && !!createForm.roleName && createForm.password.length >= 6;

    return (
        <section className="card card-large">
            <Toast ref={toast} />
            <div className="admin-entete">
                <div>
                    <h1>Gestion des utilisateurs</h1>
                    <p className="muted">Consultez et gérez les rôles des utilisateurs du système</p>
                </div>
                <Button label="Nouvel utilisateur" icon="pi pi-user-plus" onClick={ouvrirCreation} />
            </div>

            <div className="stats-ligne">
                <StatCarte libelle="Total utilisateurs" valeur={stats.total} />
                <StatCarte libelle="Actifs" valeur={stats.actifs} ton="succes" />
                <StatCarte libelle="Contrôleurs" valeur={stats.controleurs} />
                <StatCarte libelle="Admins" valeur={stats.admins} />
            </div>

            <div className="barre-filtres">
                <input placeholder="Rechercher par nom, email, username ou rôle…" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
                <Button icon="pi pi-refresh" text rounded tooltip="Actualiser" loading={usersQuery.isFetching} onClick={rafraichir} />
            </div>

            {usersQuery.isError && <p className="error">Impossible de charger les utilisateurs.</p>}

            <DataTable
                value={liste}
                loading={usersQuery.isLoading}
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25, 50]}
                size="small"
                stripedRows
                emptyMessage="Aucun utilisateur trouvé"
                rowClassName={(u: User) => (u.enabled ? '' : 'ligne-inactive')}
                scrollable
            >
                <Column header="Nom" field="firstName" sortable body={(u: User) => `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()} />
                <Column header="Email" field="email" sortable />
                <Column header="Username" body={(u: User) => <span className="code-badge">{u.username}</span>} />
                <Column header="Téléphone" body={(u: User) => u.phone || '-'} />
                <Column header="Rôle" field="role" sortable body={(u: User) => <Tag value={u.role} severity={severiteRole(u.role)} />} />
                <Column header="Statut" field="enabled" sortable body={(u: User) => <Tag value={u.enabled ? 'Actif' : 'Inactif'} severity={u.enabled ? 'success' : 'danger'} />} />
                <Column header="Dernière connexion" body={(u: User) => (u.lastLogin ? formatDateFr(u.lastLogin) : 'Jamais')} />
                <Column
                    header="Actions"
                    body={(u: User) => (
                        <div className="cellule-actions">
                            <Button icon="pi pi-user-edit" rounded text severity="secondary" tooltip="Modifier les infos" onClick={() => ouvrirEdition(u)} />
                            <Button icon="pi pi-shield" rounded text severity="info" tooltip="Modifier le rôle" onClick={() => ouvrirRole(u)} />
                            <Button
                                icon={u.enabled ? 'pi pi-lock' : 'pi pi-lock-open'}
                                rounded
                                text
                                severity={u.enabled ? 'danger' : 'success'}
                                tooltip={u.enabled ? 'Bloquer le compte' : 'Débloquer le compte'}
                                disabled={basculerActivation.isPending}
                                onClick={() => confirmerBascule(u)}
                            />
                        </div>
                    )}
                />
            </DataTable>

            <Dialog header="Modifier le rôle" visible={!!roleDe} style={{ width: 'min(460px, 95vw)' }} onHide={() => setRoleDe(null)} modal>
                {roleDe && (
                    <>
                        <p>
                            <strong>
                                {roleDe.firstName} {roleDe.lastName}
                            </strong>
                            <br />
                            <span className="muted">{roleDe.email}</span>
                        </p>
                        <p>
                            Rôle actuel : <Tag value={roleDe.role} severity={severiteRole(roleDe.role)} />
                        </p>
                        <label className="champ-plein">
                            Nouveau rôle
                            <Dropdown value={nouveauRole} options={tousRoles} onChange={(e) => setNouveauRole(e.value)} placeholder="Sélectionner un rôle" filter loading={rolesQuery.isLoading} />
                        </label>
                        <div className="dialog-actions">
                            <Button label="Annuler" outlined severity="secondary" onClick={() => setRoleDe(null)} />
                            <Button label="Modifier" icon="pi pi-check" disabled={!nouveauRole || nouveauRole === roleDe.role || changerRole.isPending} loading={changerRole.isPending} onClick={confirmerRole} />
                        </div>
                    </>
                )}
            </Dialog>

            <Dialog header="Modifier l'utilisateur" visible={!!editDe} style={{ width: 'min(480px, 95vw)' }} onHide={() => setEditDe(null)} modal>
                <div className="form-grid">
                    <label>
                        Prénom
                        <input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} />
                    </label>
                    <label>
                        Nom
                        <input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} />
                    </label>
                    <label className="span-2">
                        Email
                        <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                    </label>
                    <label className="span-2">
                        Téléphone
                        <input type="tel" value={editForm.phone} placeholder="+224 6XX XX XX XX" onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                    </label>
                </div>
                <div className="dialog-actions">
                    <Button label="Annuler" outlined severity="secondary" onClick={() => setEditDe(null)} />
                    <Button label="Enregistrer" icon="pi pi-check" disabled={!editValide || modifier.isPending} loading={modifier.isPending} onClick={() => modifier.mutate()} />
                </div>
            </Dialog>

            <Dialog header="Créer un utilisateur backoffice" visible={creationOuverte} style={{ width: 'min(520px, 95vw)' }} onHide={() => setCreationOuverte(false)} modal>
                <p className="muted">Le compte est activé immédiatement. Communiquez le mot de passe temporaire à l'utilisateur.</p>
                <div className="form-grid">
                    <label>
                        Prénom *
                        <input value={createForm.firstName} onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })} />
                    </label>
                    <label>
                        Nom *
                        <input value={createForm.lastName} onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })} />
                    </label>
                    <label className="span-2">
                        Email *
                        <input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
                    </label>
                    <label className="span-2">
                        Téléphone
                        <input type="tel" value={createForm.phone} placeholder="+224 6XX XX XX XX" onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
                    </label>
                    <label className="span-2">
                        Rôle *
                        <Dropdown value={createForm.roleName || null} options={rolesCreation} onChange={(e) => setCreateForm({ ...createForm, roleName: e.value ?? '' })} placeholder="Choisir un rôle" />
                    </label>
                    <label className="span-2">
                        Mot de passe temporaire *
                        <span className="ligne-recherche">
                            <input value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
                            <Button icon="pi pi-refresh" outlined type="button" tooltip="Générer" onClick={() => setCreateForm({ ...createForm, password: genererMotDePasse() })} />
                        </span>
                    </label>
                </div>
                <div className="dialog-actions">
                    <Button label="Annuler" outlined severity="secondary" onClick={() => setCreationOuverte(false)} />
                    <Button label="Créer le compte" icon="pi pi-check" disabled={!createValide || creer.isPending} loading={creer.isPending} onClick={() => creer.mutate()} />
                </div>
            </Dialog>
        </section>
    );
}
