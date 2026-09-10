import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';

type EtatPont = 'chargement' | 'mobile-ok' | 'desktop-ok' | 'erreur';

/**
 * Pont web de l'application mobile : le lien de vérification reçu par email est
 * ouvert dans le navigateur, échangé contre des jetons, puis transmis à l'app
 * via un lien profond. Dette connue « web-bridge-tokens-in-url » : les jetons
 * transitent dans l'adresse du lien profond.
 */
export function VerifyMobilePage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const estMobile = useMemo(() => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent), []);

    const [etat, setEtat] = useState<EtatPont>('chargement');
    const [message, setMessage] = useState('');
    const [lienProfond, setLienProfond] = useState('');

    useEffect(() => {
        if (!token) {
            setEtat('erreur');
            setMessage('Lien invalide. Token manquant.');
            return;
        }
        let annule = false;
        void (async () => {
            try {
                const jetons = await api.users.verifyMobile(token);
                if (annule) return;
                if (estMobile && jetons.access_token && jetons.refresh_token) {
                    let lien = `sira://verify?accessToken=${encodeURIComponent(jetons.access_token)}&refreshToken=${encodeURIComponent(jetons.refresh_token)}`;
                    if (jetons.id_token) lien += `&idToken=${encodeURIComponent(jetons.id_token)}`;
                    setLienProfond(lien);
                    setEtat('mobile-ok');
                } else {
                    setEtat('desktop-ok');
                }
            } catch {
                if (!annule) {
                    setEtat('erreur');
                    setMessage('Échec de la vérification. Lien invalide ou expiré.');
                }
            }
        })();
        return () => {
            annule = true;
        };
    }, [token, estMobile]);

    // Laisse le temps au navigateur de peindre l'écran avant de basculer vers l'app.
    useEffect(() => {
        if (etat !== 'mobile-ok' || !lienProfond) return;
        const t = window.setTimeout(() => {
            window.location.href = lienProfond;
        }, 500);
        return () => window.clearTimeout(t);
    }, [etat, lienProfond]);

    return (
        <section className="card card-narrow center">
            {etat === 'chargement' && (
                <>
                    <i className="pi pi-spin pi-spinner grand-icone" />
                    <h1>Vérification en cours…</h1>
                    <p className="muted">Activation de votre compte SYNERGIA.</p>
                </>
            )}
            {etat === 'mobile-ok' && (
                <>
                    <i className="pi pi-check-circle grand-icone succes-icone" />
                    <h1>Compte vérifié</h1>
                    <p className="muted">Ouverture de l'application SYNERGIA…</p>
                    <button type="button" onClick={() => (window.location.href = lienProfond)}>
                        Ouvrir l'app
                    </button>
                </>
            )}
            {etat === 'desktop-ok' && (
                <>
                    <i className="pi pi-check-circle grand-icone succes-icone" />
                    <h1>Compte vérifié</h1>
                    <p className="muted">
                        Ouvrez l'application <strong>SYNERGIA</strong> sur votre téléphone pour vous connecter et accéder à votre profil.
                    </p>
                </>
            )}
            {etat === 'erreur' && (
                <>
                    <i className="pi pi-exclamation-triangle grand-icone erreur-icone" />
                    <h1>Vérification impossible</h1>
                    <p className="error">{message}</p>
                </>
            )}
        </section>
    );
}
