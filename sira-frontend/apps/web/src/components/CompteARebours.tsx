import { useEffect, useState } from 'react';

function secondesRestantes(iso: string): number {
    return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
}

/** Le temps qu'il reste avant que le serveur n'abandonne la commande : le sien, pas une minuterie locale. */
export function CompteARebours({ jusqua }: { jusqua: string }) {
    const [restant, setRestant] = useState(() => secondesRestantes(jusqua));
    useEffect(() => {
        setRestant(secondesRestantes(jusqua));
        const minuterie = window.setInterval(() => setRestant(secondesRestantes(jusqua)), 1000);
        return () => window.clearInterval(minuterie);
    }, [jusqua]);
    if (restant <= 0) return <p className="compte-a-rebours ecoule">Délai de paiement écoulé</p>;
    const minutes = Math.floor(restant / 60);
    const secondes = String(restant % 60).padStart(2, '0');
    return (
        <p className={`compte-a-rebours ${restant < 120 ? 'presse' : ''}`} aria-live="polite">
            Il vous reste {minutes}:{secondes} pour payer
        </p>
    );
}
