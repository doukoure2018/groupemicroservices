import { formatDateFr } from '@sira/core';
import { useMutation } from '@tanstack/react-query';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth-context';
import { useNotif } from './admin/shared';

/** Étiquette lisible pour un rôle CSV (on montre le rôle principal). */
function roleLisible(role?: string): string {
    return (role ?? '').split(',')[0]?.replace(/_/g, ' ') || 'Utilisateur';
}

export function ProfilPage() {
    const { user, rafraichirProfil } = useAuth();
    const { toast, succes, erreur } = useNotif();

    const [form, setForm] = useState({
        firstName: user?.firstName ?? '',
        lastName: user?.lastName ?? '',
        email: user?.email ?? '',
        phone: user?.phone ?? '',
        bio: user?.bio ?? ''
    });

    const enregistrer = useMutation({
        // Chaîne vide (pas null) pour pouvoir effacer un champ : le backend
        // ignore les valeurs null (mise à jour partielle).
        mutationFn: async () =>
            api.users.updateProfile({
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                bio: form.bio.trim()
            }),
        onSuccess: async () => {
            succes('Profil mis à jour', 'Vos informations ont été enregistrées.');
            await rafraichirProfil();
        },
        onError: (e) => erreur(e, 'La mise à jour du profil a échoué.')
    });

    if (!user) return <p className="muted center">Chargement du profil…</p>;

    const initiales = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || (user.username?.[0]?.toUpperCase() ?? '?');
    const modifie =
        form.firstName !== (user.firstName ?? '') ||
        form.lastName !== (user.lastName ?? '') ||
        form.email !== (user.email ?? '') ||
        (form.phone || '') !== (user.phone ?? '') ||
        (form.bio || '') !== (user.bio ?? '');
    const valide = form.firstName.trim().length > 0 && form.lastName.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

    return (
        <section className="card card-large">
            <Toast ref={toast} />
            <div className="admin-entete">
                <div>
                    <h1>Mon profil</h1>
                    <p className="muted">Consultez et mettez à jour vos informations.</p>
                </div>
            </div>

            <div className="profil-tete">
                <span className="profil-avatar" aria-hidden="true">
                    {initiales}
                </span>
                <div className="profil-tete-texte">
                    <h2>
                        {user.firstName} {user.lastName} <Tag value={roleLisible(user.role)} severity="success" />
                        {user.enabled ? null : <Tag value="Compte bloqué" severity="danger" />}
                    </h2>
                    <p className="muted">@{user.username}</p>
                    <div className="profil-contacts">
                        <span>
                            <i className="pi pi-envelope" aria-hidden="true" /> {user.email}
                        </span>
                        {user.phone && (
                            <span>
                                <i className="pi pi-phone" aria-hidden="true" /> {user.phone}
                            </span>
                        )}
                        <span>
                            <i className="pi pi-calendar" aria-hidden="true" /> Membre depuis {formatDateFr(user.createdAt)}
                        </span>
                        {user.lastLogin && (
                            <span>
                                <i className="pi pi-clock" aria-hidden="true" /> Dernière connexion {formatDateFr(user.lastLogin)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <h2 className="section-titre">Informations personnelles</h2>
            <form
                className="form-grid"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (valide && modifie) enregistrer.mutate();
                }}
            >
                <label>
                    Prénom *
                    <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                </label>
                <label>
                    Nom *
                    <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </label>
                <label className="span-2">
                    Email *
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </label>
                <label className="span-2">
                    Téléphone
                    <input type="tel" value={form.phone} placeholder="+224 6XX XX XX XX" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </label>
                <label className="span-2">
                    Bio
                    <textarea rows={3} value={form.bio} placeholder="Quelques mots sur vous…" onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                </label>
                <div className="dialog-actions span-2">
                    <Button type="submit" label="Enregistrer les modifications" icon="pi pi-check" disabled={!valide || !modifie || enregistrer.isPending} loading={enregistrer.isPending} />
                </div>
            </form>
        </section>
    );
}
