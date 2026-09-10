import { ApiError } from '@sira/api-client';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [touche, setTouche] = useState(false);
    const [pending, setPending] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [erreur, setErreur] = useState<string | null>(null);

    const erreurChamp = !email.trim() ? "L'email est requis" : EMAIL_RE.test(email) ? null : "Format d'email invalide";

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (erreurChamp) {
            setTouche(true);
            return;
        }
        setMessage(null);
        setErreur(null);
        setPending(true);
        try {
            const res = await api.users.resetPassword(email.trim());
            setMessage(res.message || 'Un email de réinitialisation vient de vous être envoyé.');
            setEmail('');
            setTouche(false);
        } catch (err) {
            setErreur(err instanceof ApiError ? err.message : "L'envoi a échoué. Réessayez dans un instant.");
        } finally {
            setPending(false);
        }
    }

    return (
        <section className="card card-narrow">
            <h1>Réinitialisation de mot de passe</h1>
            <p className="muted">Saisissez votre adresse email pour recevoir un lien de réinitialisation.</p>

            <form className="stack-form" onSubmit={onSubmit} noValidate>
                <label>
                    Email
                    <input type="email" value={email} placeholder="nom@email.com" autoComplete="email" onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouche(true)} />
                    {touche && erreurChamp && <span className="texte-danger">{erreurChamp}</span>}
                </label>

                {message && <p className="succes">{message}</p>}
                {erreur && <p className="error">{erreur}</p>}

                <button type="submit" disabled={pending}>
                    {pending ? 'Envoi…' : 'Envoyer le lien'}
                </button>
            </form>

            <p className="muted center">
                <Link to="/login">Retour à la connexion</Link>
            </p>
        </section>
    );
}
