import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    erreur: Error | null;
}

/**
 * Dernier filet : sans elle, une exception de rendu laisse une page blanche
 * sans aucun moyen de revenir en arrière. React n'offre que l'API de classe
 * pour cela, il n'existe pas d'équivalent en hook.
 */
export class BarriereErreur extends Component<Props, State> {
    state: State = { erreur: null };

    static getDerivedStateFromError(erreur: Error): State {
        return { erreur };
    }

    componentDidCatch(erreur: Error, infos: ErrorInfo) {
        console.error('Erreur de rendu non rattrapée', erreur, infos.componentStack);
    }

    render() {
        if (!this.state.erreur) return this.props.children;
        return (
            <div className="barriere-erreur">
                <section className="card card-large">
                    <div className="etat-vide">
                        <img src="/brand/synergia-emblem-512x512.png" alt="SYNERGIA" width={56} height={56} />
                        <h1>Cette page n'a pas pu s'afficher</h1>
                        <p className="muted">
                            Une erreur inattendue est survenue. Rechargez la page, et si le problème persiste, revenez à l'accueil.
                        </p>
                        <div className="commande-actions">
                            <button type="button" onClick={() => window.location.reload()}>
                                <i className="pi pi-refresh" aria-hidden="true" /> Recharger la page
                            </button>
                            <button type="button" className="secondary" onClick={() => (window.location.href = '/')}>
                                Retour à l'accueil
                            </button>
                        </div>
                        <details className="barriere-details">
                            <summary>Détail technique</summary>
                            <pre>{this.state.erreur.message}</pre>
                        </details>
                    </div>
                </section>
            </div>
        );
    }
}
