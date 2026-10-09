import { AuthHttpError } from '@sira/auth';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth-context';
import { CarteAuth } from '../components/CarteAuth';

export function LoginPage() {
    const { login, loginWithOAuth } = useAuth();
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
        <CarteAuth titre="Connexion" sousTitre="Accédez à votre espace SYNERGIA.">
            <form className="stack-form" onSubmit={onSubmit}>
                <label>
                    Email
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="nom@email.com" />
                </label>
                <label>
                    Mot de passe
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="Votre mot de passe" />
                </label>
                <div className="auth-oubli">
                    <Link to="/auth/forgotpassword">Mot de passe oublié ?</Link>
                </div>
                {error && <p className="error">{error}</p>}
                <button type="submit" disabled={pending}>
                    {pending ? 'Connexion…' : 'Se connecter'}
                </button>
            </form>

            <div className="auth-sep">
                <span>ou</span>
            </div>

            <button type="button" className="auth-google" onClick={() => void loginWithOAuth()}>
                <i className="pi pi-google" aria-hidden="true" /> Continuer avec Google
            </button>

            <p className="auth-pied">
                Pas encore de compte ? <Link to="/auth/register">Créer un compte</Link>
            </p>
        </CarteAuth>
    );
}
