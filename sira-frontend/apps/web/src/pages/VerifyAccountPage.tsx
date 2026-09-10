import { ApiError } from '@sira/api-client';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';

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
            <section className="card card-narrow center">
                <h1>Activation du compte</h1>
                <p className="error">Lien invalide. Le jeton d'activation est absent de l'adresse.</p>
                <Link to="/login">Aller à la connexion</Link>
            </section>
        );
    }

    return (
        <section className="card card-narrow center">
            <h1>Activation du compte</h1>
            {verification.isPending && (
                <>
                    <i className="pi pi-spin pi-spinner grand-icone" />
                    <p>Vérification en cours…</p>
                    <p className="muted">Merci de patienter pendant la validation de votre lien.</p>
                </>
            )}
            {verification.isSuccess && (
                <>
                    <i className="pi pi-check-circle grand-icone succes-icone" />
                    <p className="succes">{verification.data || 'Votre compte est activé.'}</p>
                    <Link to="/login">Se connecter</Link>
                </>
            )}
            {verification.isError && (
                <>
                    <i className="pi pi-times-circle grand-icone erreur-icone" />
                    <p className="error">
                        {verification.error instanceof ApiError ? verification.error.message : "L'activation a échoué. Le lien est peut-être expiré."}
                    </p>
                    <Link to="/auth/forgotpassword">Demander un nouveau lien</Link>
                </>
            )}
        </section>
    );
}
