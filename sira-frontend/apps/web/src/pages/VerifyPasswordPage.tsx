import { ApiError } from '@sira/api-client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';

/**
 * Deux étapes dans un seul écran : on valide d'abord le jeton reçu par email,
 * puis on affiche le formulaire de nouveau mot de passe.
 */
export function VerifyPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const verification = useQuery({
        queryKey: ['verify-password', token],
        queryFn: async () => (await api.users.verifyPassword(token!)).data.user,
        enabled: !!token,
        retry: false
    });

    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [touche, setTouche] = useState(false);

    const reinitialiser = useMutation({
        mutationFn: async () =>
            api.users.resetPasswordConfirm({
                userUuid: verification.data?.userUuid ?? '',
                token: token ?? '',
                password,
                confirmPassword: confirmation
            })
    });

    if (!token) {
        return (
            <section className="card card-narrow center">
                <h1>Nouveau mot de passe</h1>
                <p className="error">Lien invalide. Le jeton de réinitialisation est absent de l'adresse.</p>
                <Link to="/auth/forgotpassword">Demander un nouveau lien</Link>
            </section>
        );
    }

    if (verification.isPending) {
        return (
            <section className="card card-narrow center">
                <h1>Nouveau mot de passe</h1>
                <i className="pi pi-spin pi-spinner grand-icone" />
                <p>Vérification du lien…</p>
            </section>
        );
    }

    if (verification.isError) {
        return (
            <section className="card card-narrow center">
                <h1>Nouveau mot de passe</h1>
                <i className="pi pi-times-circle grand-icone erreur-icone" />
                <p className="error">
                    {verification.error instanceof ApiError ? verification.error.message : 'Ce lien est invalide ou a expiré.'}
                </p>
                <Link to="/auth/forgotpassword">Demander un nouveau lien</Link>
            </section>
        );
    }

    if (reinitialiser.isSuccess) {
        return (
            <section className="card card-narrow center">
                <h1>Nouveau mot de passe</h1>
                <i className="pi pi-check-circle grand-icone succes-icone" />
                <p className="succes">{reinitialiser.data.message || 'Votre mot de passe a été modifié.'}</p>
                <Link to="/login">Se connecter</Link>
            </section>
        );
    }

    // Le backend recontrôle la correspondance, mais l'afficher côté client évite
    // un aller-retour inutile — l'Angular ne le faisait pas.
    const tropCourt = password.length > 0 && password.length < 6;
    const discordant = confirmation.length > 0 && password !== confirmation;
    const formValide = password.length >= 6 && password === confirmation;

    return (
        <section className="card card-narrow">
            <h1>Nouveau mot de passe</h1>
            <p className="muted">Compte : {verification.data?.email}</p>

            <form
                className="stack-form"
                noValidate
                onSubmit={(e) => {
                    e.preventDefault();
                    setTouche(true);
                    if (formValide) reinitialiser.mutate();
                }}
            >
                <label>
                    Mot de passe
                    <input type="password" value={password} autoComplete="new-password" placeholder="au moins 6 caractères" onChange={(e) => setPassword(e.target.value)} />
                    {touche && !password && <span className="texte-danger">Le mot de passe est requis</span>}
                    {tropCourt && <span className="texte-danger">Mot de passe trop court (min. 6 caractères)</span>}
                </label>
                <label>
                    Confirmer le mot de passe
                    <input type="password" value={confirmation} autoComplete="new-password" onChange={(e) => setConfirmation(e.target.value)} />
                    {discordant && <span className="texte-danger">Les deux mots de passe ne correspondent pas</span>}
                </label>

                {reinitialiser.isError && (
                    <p className="error">
                        {reinitialiser.error instanceof ApiError ? reinitialiser.error.message : 'La réinitialisation a échoué. Réessayez.'}
                    </p>
                )}

                <button type="submit" disabled={!formValide || reinitialiser.isPending}>
                    {reinitialiser.isPending ? 'Enregistrement…' : 'Changer le mot de passe'}
                </button>
            </form>
        </section>
    );
}
