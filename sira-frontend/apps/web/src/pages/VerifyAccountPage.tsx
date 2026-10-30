import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { CarteAuth, messageServeur } from '../components/CarteAuth';

export function VerifyAccountPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const verification = useQuery({
        queryKey: ['verify-account', token],
        queryFn: async () => (await api.users.verifyAccount(token!)).message,
        enabled: !!token,
        retry: false
    });

    if (!token) {
        return (
            <CarteAuth titre="Activation du compte">
                <i className="pi pi-link grand-icone erreur-icone" aria-hidden="true" />
                <p className="error">Lien invalide. Le jeton d'activation est absent de l'adresse.</p>
                <p className="auth-pied">
                    <Link to="/login">Aller à la connexion</Link>
                </p>
            </CarteAuth>
        );
    }

    return (
        <CarteAuth titre="Activation du compte">
            {verification.isPending && (
                <>
                    <i className="pi pi-spin pi-spinner grand-icone" aria-hidden="true" />
                    <p>Vérification en cours…</p>
                    <p className="muted">Merci de patienter pendant la validation de votre lien.</p>
                </>
            )}
            {verification.isSuccess && (
                <>
                    <i className="pi pi-check-circle grand-icone succes-icone" aria-hidden="true" />
                    <p className="succes">{verification.data || 'Votre compte est activé.'}</p>
                    <p className="auth-pied">
                        <Link to="/login">Se connecter</Link>
                    </p>
                </>
            )}
            {verification.isError && (
                <>
                    <i className="pi pi-times-circle grand-icone erreur-icone" aria-hidden="true" />
                    <p className="error">{messageServeur(verification.error, "L'activation a échoué. Le lien est peut-être expiré.")}</p>
                    <p className="auth-pied">
                        <Link to="/auth/forgotpassword">Demander un nouveau lien</Link>
                    </p>
                </>
            )}
        </CarteAuth>
    );
}
