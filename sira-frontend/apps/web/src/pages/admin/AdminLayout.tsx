import { hasRole, type RoleName } from '@sira/core';
import { ConfirmDialog } from 'primereact/confirmdialog';
import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth-context';

/** Rôles autorisés à entrer dans le back-office (aligné sur le menu Angular). */
export const ROLES_ADMIN: RoleName[] = ['SUPER_ADMIN', 'ADMIN', 'ADMIN_BACKOFFICE', 'MANAGER'];

export function RequireRole({ roles, children }: { roles: RoleName[]; children: ReactNode }) {
    const { user } = useAuth();
    if (!user) return null; // RequireAuth a déjà géré la redirection
    const autorise = roles.some((r) => hasRole(user, r));
    if (!autorise) {
        return (
            <section className="card">
                <p className="error">Vous n'avez pas les droits nécessaires pour accéder à cette section.</p>
            </section>
        );
    }
    return <>{children}</>;
}

/** Rôles « back-office complet » : un MANAGER ne voit que ses offres, trajets et véhicules. */
const ROLES_BACKOFFICE: RoleName[] = ['SUPER_ADMIN', 'ADMIN', 'ADMIN_BACKOFFICE'];

export function AdminLayout() {
    const { user } = useAuth();
    const backoffice = ROLES_BACKOFFICE.some((r) => hasRole(user, r));
    return (
        <div className="admin-shell">
            <nav className="admin-nav">
                <span className="admin-nav-titre">Administration</span>
                <NavLink to="/admin/nouvelle-liaison" className="nav-accent">
                    ⚡ Assistant Nouvelle liaison
                </NavLink>

                <span className="admin-nav-section">Offres</span>
                <NavLink to="/admin/offres">Offres de transport</NavLink>

                <span className="admin-nav-section">Infrastructure</span>
                {backoffice && <NavLink to="/admin/sites">Sites / Gares</NavLink>}
                {backoffice && <NavLink to="/admin/departs">Points de départ</NavLink>}
                {backoffice && <NavLink to="/admin/arrivees">Points d'arrivée</NavLink>}
                <NavLink to="/admin/trajets">Trajets</NavLink>

                <span className="admin-nav-section">Véhicules</span>
                {backoffice && <NavLink to="/admin/types-vehicules">Types de véhicules</NavLink>}
                <NavLink to="/admin/vehicules">Véhicules</NavLink>

                {backoffice && (
                    <>
                        <span className="admin-nav-section">Référentiel géographique</span>
                        <NavLink to="/admin/regions">Régions</NavLink>
                        <NavLink to="/admin/villes">Villes / Préfectures</NavLink>
                        <NavLink to="/admin/communes">Communes</NavLink>
                        <NavLink to="/admin/quartiers">Quartiers</NavLink>
                        <NavLink to="/admin/localisations">Localisations</NavLink>

                        <span className="admin-nav-section">Commercial</span>
                        <NavLink to="/admin/modes-reglement">Modes de règlement</NavLink>
                        <NavLink to="/admin/partenaires">Partenaires</NavLink>
                    </>
                )}
                {/* Écrans suivants de la phase 2 : utilisateurs, dashboards, immo admin */}
            </nav>
            <div className="admin-contenu">
                <ConfirmDialog />
                <Outlet />
            </div>
        </div>
    );
}
