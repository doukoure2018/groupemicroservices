import { AuthHttpError } from '@sira/auth';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth-context';

export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirect = searchParams.get('redirect') ?? '/';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setPending(true);
        try {
            await login(email, password);
            navigate(redirect, { replace: true });
        } catch (err) {
            if (err instanceof AuthHttpError) {
                // 401 = identifiants incorrects, 403 = compte verrouillé/non activé —
                // le serveur fournit le message précis.
                setError(err.serverMessage ?? 'Email ou mot de passe incorrect.');
            } else {
                setError("Impossible de joindre le serveur d'authentification. Vérifiez que le backend est démarré.");
            }
        } finally {
            setPending(false);
        }
    }

    return (
        <section className="card card-narrow">
            <h1>Connexion</h1>
            <form className="stack-form" onSubmit={onSubmit}>
                <label>
                    Email
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                </label>
                <label>
                    Mot de passe
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                </label>
                {error && <p className="error">{error}</p>}
                <button type="submit" disabled={pending}>
                    {pending ? 'Connexion…' : 'Se connecter'}
                </button>
            </form>
        </section>
    );
}
