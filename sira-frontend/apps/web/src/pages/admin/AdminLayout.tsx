import { hasRole, type RoleName, type User } from '@sira/core';
import { useQuery } from '@tanstack/react-query';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth-context';

/** Rôles autorisés à entrer dans le back-office (aligné sur le menu Angular). */
export const ROLES_ADMIN: RoleName[] = ['SUPER_ADMIN', 'ADMIN', 'ADMIN_BACKOFFICE', 'MANAGER'];

export function RequireRole({ roles, children }: { roles: RoleName[]; children: ReactNode }) {
    const { user } = useAuth();
    if (!user) return null; // RequireAuth a déjà géré la redirection
    const autorise = roles.some((r) => hasRole(user, r));
    if (!autorise) {
        return (
            <section className="card card-large">
                <div className="etat-vide">
                    <i className="pi pi-lock grand-icone erreur-icone" aria-hidden="true" />
                    <h1>Accès restreint</h1>
                    <p className="error">Vous n'avez pas les droits nécessaires pour accéder à cette section.</p>
                    <p className="muted">Si vous pensez qu'il s'agit d'une erreur, contactez un administrateur.</p>
                </div>
            </section>
        );
    }
    return <>{children}</>;
}

/** Rôles « back-office complet » : un MANAGER ne voit que ses offres, trajets et véhicules. */
const ROLES_BACKOFFICE: RoleName[] = ['SUPER_ADMIN', 'ADMIN', 'ADMIN_BACKOFFICE'];

interface Item {
    to: string;
    libelle: string;
    icone: string;
    /** Réservé au back-office complet (masqué au MANAGER). */
    backoffice?: boolean;
    /** Pastille de compteur (voir usePointsAttention). */
    badge?: 'moderation' | 'partenaires';
    end?: boolean;
}

interface Section {
    titre: string;
    /** Section entièrement réservée au back-office complet. */
    backoffice?: boolean;
    items: Item[];
}

/** Modèle unique de navigation : sert au menu ET à la recherche rapide. */
const NAV: Section[] = [
    { titre: "Vue d'ensemble", items: [{ to: '/admin', libelle: 'Tableau de bord', icone: 'pi-th-large', end: true }] },
    { titre: 'Offres', items: [{ to: '/admin/offres', libelle: 'Offres de transport', icone: 'pi-ticket' }] },
    {
        titre: 'Infrastructure',
        items: [
            { to: '/admin/sites', libelle: 'Sites / Gares', icone: 'pi-building', backoffice: true },
            { to: '/admin/departs', libelle: 'Points de départ', icone: 'pi-arrow-circle-right', backoffice: true },
            { to: '/admin/arrivees', libelle: "Points d'arrivée", icone: 'pi-map-marker', backoffice: true },
            { to: '/admin/trajets', libelle: 'Trajets', icone: 'pi-directions' }
        ]
    },
    {
        titre: 'Véhicules',
        items: [
            { to: '/admin/types-vehicules', libelle: 'Types de véhicules', icone: 'pi-tags', backoffice: true },
            { to: '/admin/vehicules', libelle: 'Véhicules', icone: 'pi-car' }
        ]
    },
    {
        titre: 'Référentiel géographique',
        backoffice: true,
        items: [
            { to: '/admin/regions', libelle: 'Régions', icone: 'pi-globe' },
            { to: '/admin/villes', libelle: 'Villes / Préfectures', icone: 'pi-map' },
            { to: '/admin/communes', libelle: 'Communes', icone: 'pi-map-marker' },
            { to: '/admin/quartiers', libelle: 'Quartiers', icone: 'pi-compass' },
            { to: '/admin/localisations', libelle: 'Localisations', icone: 'pi-map-marker' }
        ]
    },
    {
        titre: 'Commercial',
        backoffice: true,
        items: [
            { to: '/admin/modes-reglement', libelle: 'Modes de règlement', icone: 'pi-credit-card' },
            { to: '/admin/partenaires', libelle: 'Partenaires', icone: 'pi-briefcase', badge: 'partenaires' }
        ]
    },
    {
        titre: 'Immobilier',
        backoffice: true,
        items: [
            { to: '/admin/moderation', libelle: 'Modération des annonces', icone: 'pi-flag', badge: 'moderation' },
            { to: '/admin/leads', libelle: 'Demandes (leads)', icone: 'pi-inbox' },
            { to: '/admin/agences', libelle: 'Agences', icone: 'pi-building' }
        ]
    },
    {
        titre: 'Comptes',
        backoffice: true,
        items: [{ to: '/admin/utilisateurs', libelle: 'Utilisateurs', icone: 'pi-users' }]
    }
];

/**
 * Compteurs de points d'attention (modération immo, partenaires en attente),
 * chargés seulement pour le back-office et silencieux en cas d'erreur.
 */
function usePointsAttention(actif: boolean) {
    return useQuery({
        queryKey: ['nav-points-attention'],
        enabled: actif,
        staleTime: 5 * 60_000,
        retry: false,
        // Un seul chargement : pas de refetch au focus/reconnexion (évite les
        // re-rendus et appels répétés pendant une longue session).
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        queryFn: async () => {
            const [moderation, partenaires] = await Promise.allSettled([
                api.immo.proprietes.moderation({ limit: 1, offset: 0 }),
                api.commercial.partenairesByStatut('EN_ATTENTE')
            ]);
            return {
                moderation: moderation.status === 'fulfilled' ? (moderation.value.data.total ?? 0) : 0,
                partenaires: partenaires.status === 'fulfilled' ? (partenaires.value.data.partenaires?.length ?? 0) : 0
            };
        }
    });
}

const CLE_REPLIE = 'sira.admin.nav';

export function AdminLayout() {
    const { user, logout } = useAuth();
    const backoffice = ROLES_BACKOFFICE.some((r) => hasRole(user, r));
    const points = usePointsAttention(backoffice);

    const [replie, setReplie] = useState(() => {
        try {
            return localStorage.getItem(CLE_REPLIE) === 'replie';
        } catch {
            return false;
        }
    });
    useEffect(() => {
        try {
            localStorage.setItem(CLE_REPLIE, replie ? 'replie' : 'ouvert');
        } catch {
            /* stockage indisponible : préférence non mémorisée */
        }
    }, [replie]);

    /** Sections/entrées visibles pour le rôle courant. */
    const sectionsVisibles = useMemo(
        () =>
            NAV.filter((s) => !s.backoffice || backoffice)
                .map((s) => ({ ...s, items: s.items.filter((i) => !i.backoffice || backoffice) }))
                .filter((s) => s.items.length > 0),
        [backoffice]
    );
    const destinations = useMemo(() => sectionsVisibles.flatMap((s) => s.items), [sectionsVisibles]);

    const badge = (cle?: Item['badge']): number | undefined => {
        if (!cle || !points.data) return undefined;
        const n = points.data[cle];
        return n > 0 ? n : undefined;
    };
    const totalAttention = (points.data?.moderation ?? 0) + (points.data?.partenaires ?? 0);

    return (
        <div className={`admin-app${replie ? ' est-replie' : ''}`}>
            <aside className="admin-nav">
                <div className="admin-nav-marque">
                    <Link to="/admin" className="admin-nav-logo" aria-label="SYNERGIA Administration">
                        <img src="/brand/synergia-emblem-512x512.png" alt="SYNERGIA" width={34} height={34} />
                    </Link>
                    <span className="admin-nav-marque-texte">
                        <strong>SYNERGIA</strong>
                        <small>Administration</small>
                    </span>
                    <button type="button" className="admin-nav-toggle" onClick={() => setReplie((v) => !v)} aria-label={replie ? 'Déplier le menu' : 'Replier le menu'} title={replie ? 'Déplier le menu' : 'Replier le menu'}>
                        <i className={`pi ${replie ? 'pi-angle-right' : 'pi-angle-left'}`} aria-hidden="true" />
                    </button>
                </div>

                <nav className="admin-nav-liens">
                    {sectionsVisibles.map((s) => (
                        <div key={s.titre} className="admin-nav-groupe">
                            <span className="admin-nav-section">{s.titre}</span>
                            {s.items.map((i) => (
                                <NavLink key={i.to} to={i.to} end={i.end} className="nav-lien" title={i.libelle}>
                                    <i className={`pi ${i.icone}`} aria-hidden="true" />
                                    <span className="nav-libelle">{i.libelle}</span>
                                    {badge(i.badge) !== undefined && <span className="nav-pastille">{badge(i.badge)}</span>}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                {user && <ProfilSidebar user={user} onLogout={() => void logout()} />}
            </aside>

            <div className="admin-corps">
                <header className="admin-topbar">
                    <RechercheAdmin destinations={destinations} />
                    <div className="admin-topbar-actions">
                        <Link to="/admin/nouvelle-liaison" className="admin-action-primaire">
                            <i className="pi pi-bolt" aria-hidden="true" /> Nouvelle liaison
                        </Link>
                        <Link to="/admin/moderation" className="admin-icone-btn" title="Points d'attention" aria-label="Points d'attention">
                            <i className="pi pi-bell" aria-hidden="true" />
                            {totalAttention > 0 && <span className="admin-icone-pastille">{totalAttention}</span>}
                        </Link>
                        <Link to="/" className="admin-icone-btn" title="Voir le site public" aria-label="Voir le site public">
                            <i className="pi pi-external-link" aria-hidden="true" />
                        </Link>
                        {user && (
                            <Link to="/admin/profil" className="admin-topbar-avatar" title={`${user.firstName} ${user.lastName} — Mon profil`} aria-label="Mon profil">
                                {initiales(user)}
                            </Link>
                        )}
                    </div>
                </header>

                <main className="admin-contenu">
                    <ConfirmDialog />
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

/** Recherche rapide d'écran (« command palette » légère) alimentée par le modèle de nav. */
function RechercheAdmin({ destinations }: { destinations: Item[] }) {
    const [q, setQ] = useState('');
    const [ouvert, setOuvert] = useState(false);
    const navigate = useNavigate();
    const conteneur = useRef<HTMLDivElement>(null);

    const resultats = useMemo(() => {
        const t = q.trim().toLowerCase();
        if (!t) return [];
        return destinations.filter((d) => d.libelle.toLowerCase().includes(t)).slice(0, 7);
    }, [q, destinations]);

    useEffect(() => {
        function surClic(e: MouseEvent) {
            if (conteneur.current && !conteneur.current.contains(e.target as Node)) setOuvert(false);
        }
        document.addEventListener('mousedown', surClic);
        return () => document.removeEventListener('mousedown', surClic);
    }, []);

    function aller(to: string) {
        setQ('');
        setOuvert(false);
        navigate(to);
    }

    return (
        <div className="admin-recherche" ref={conteneur}>
            <i className="pi pi-search" aria-hidden="true" />
            <input
                type="search"
                placeholder="Rechercher un écran…"
                value={q}
                onChange={(e) => {
                    setQ(e.target.value);
                    setOuvert(true);
                }}
                onFocus={() => setOuvert(true)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && resultats[0]) aller(resultats[0].to);
                    if (e.key === 'Escape') setOuvert(false);
                }}
            />
            {ouvert && resultats.length > 0 && (
                <ul className="admin-recherche-menu">
                    {resultats.map((d) => (
                        <li key={d.to}>
                            <button type="button" onClick={() => aller(d.to)}>
                                <i className={`pi ${d.icone}`} aria-hidden="true" />
                                {d.libelle}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function ProfilSidebar({ user, onLogout }: { user: User; onLogout: () => void }) {
    return (
        <div className="admin-nav-profil">
            <Link to="/admin/profil" className="admin-nav-profil-lien" title="Mon profil">
                <span className="admin-nav-avatar" aria-hidden="true">
                    {initiales(user)}
                </span>
                <span className="admin-nav-profil-texte">
                    <strong>
                        {user.firstName} {user.lastName}
                    </strong>
                    <small>{user.role}</small>
                </span>
            </Link>
            <button type="button" className="admin-nav-deconnexion" onClick={onLogout} title="Se déconnecter" aria-label="Se déconnecter">
                <i className="pi pi-sign-out" aria-hidden="true" />
            </button>
        </div>
    );
}

function initiales(user: User): string {
    return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || (user.username?.[0]?.toUpperCase() ?? '?');
}
