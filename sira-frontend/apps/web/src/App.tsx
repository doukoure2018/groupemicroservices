import { BrowserRouter, Link, NavLink, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './auth-context';
import { hasRole } from '@sira/core';
import { AdminLayout, RequireRole, ROLES_ADMIN } from './pages/admin/AdminLayout';
import { AgencesAdminPage } from './pages/admin/AgencesAdminPage';
import { ArriveesAdminPage } from './pages/admin/ArriveesAdminPage';
import { DashboardAdminPage } from './pages/admin/DashboardAdminPage';
import { LeadsAdminPage } from './pages/admin/LeadsAdminPage';
import { ModerationAdminPage } from './pages/admin/ModerationAdminPage';
import { UtilisateursAdminPage } from './pages/admin/UtilisateursAdminPage';
import { CommunesAdminPage } from './pages/admin/CommunesAdminPage';
import { DepartsAdminPage } from './pages/admin/DepartsAdminPage';
import { LocalisationsAdminPage } from './pages/admin/LocalisationsAdminPage';
import { ModesReglementAdminPage } from './pages/admin/ModesReglementAdminPage';
import { NouvelleLiaisonPage } from './pages/admin/NouvelleLiaisonPage';
import { OffresAdminPage } from './pages/admin/OffresAdminPage';
import { PartenairesAdminPage } from './pages/admin/PartenairesAdminPage';
import { QuartiersAdminPage } from './pages/admin/QuartiersAdminPage';
import { RegionsAdminPage } from './pages/admin/RegionsAdminPage';
import { SitesAdminPage } from './pages/admin/SitesAdminPage';
import { TrajetsAdminPage } from './pages/admin/TrajetsAdminPage';
import { TypesVehiculesAdminPage } from './pages/admin/TypesVehiculesAdminPage';
import { VehiculesAdminPage } from './pages/admin/VehiculesAdminPage';
import { VillesAdminPage } from './pages/admin/VillesAdminPage';
import { ProfilPage } from './pages/ProfilPage';
import { AgenceOnboardingPage } from './pages/AgenceOnboardingPage';
import { ConformitePage } from './pages/ConformitePage';
import { DashboardHomePage } from './pages/DashboardHomePage';
import { DemandesClientsPage } from './pages/DemandesClientsPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { MesVoyagesPage } from './pages/MesVoyagesPage';
import { RegisterPage } from './pages/RegisterPage';
import { ReservationPage } from './pages/ReservationPage';
import { VerifyAccountPage } from './pages/VerifyAccountPage';
import { VerifyMobilePage } from './pages/VerifyMobilePage';
import { VerifyPasswordPage } from './pages/VerifyPasswordPage';

export function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Espace admin : coquille plein écran (sidebar + barre de contenu),
                        sans la barre verte publique — voir AdminLayout. */}
                    <Route
                        path="/admin"
                        element={
                            <RequireAuth>
                                <RequireRole roles={ROLES_ADMIN}>
                                    <AdminLayout />
                                </RequireRole>
                            </RequireAuth>
                        }
                    >
                        <Route index element={<DashboardAdminPage />} />
                        <Route path="profil" element={<ProfilPage />} />
                        <Route path="offres" element={<OffresAdminPage />} />
                        {/* Référentiel géographique */}
                        <Route path="regions" element={<RegionsAdminPage />} />
                        <Route path="villes" element={<VillesAdminPage />} />
                        <Route path="communes" element={<CommunesAdminPage />} />
                        <Route path="quartiers" element={<QuartiersAdminPage />} />
                        <Route path="localisations" element={<LocalisationsAdminPage />} />
                        {/* Infrastructure transport */}
                        <Route path="nouvelle-liaison" element={<NouvelleLiaisonPage />} />
                        <Route path="sites" element={<SitesAdminPage />} />
                        <Route path="departs" element={<DepartsAdminPage />} />
                        <Route path="arrivees" element={<ArriveesAdminPage />} />
                        <Route path="trajets" element={<TrajetsAdminPage />} />
                        {/* Véhicules */}
                        <Route path="types-vehicules" element={<TypesVehiculesAdminPage />} />
                        <Route path="vehicules" element={<VehiculesAdminPage />} />
                        {/* Configuration commerciale */}
                        <Route path="modes-reglement" element={<ModesReglementAdminPage />} />
                        <Route path="partenaires" element={<PartenairesAdminPage />} />
                        {/* Utilisateurs et immobilier */}
                        <Route path="utilisateurs" element={<UtilisateursAdminPage />} />
                        <Route path="agences" element={<AgencesAdminPage />} />
                        <Route path="moderation" element={<ModerationAdminPage />} />
                        <Route path="leads" element={<LeadsAdminPage />} />
                    </Route>

                    {/* Tout le reste : chrome public (barre verte + pied de page). */}
                    <Route element={<ChromePublic />}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<LoginPage />} />
                        {/* Chemins conservés à l'identique : ce sont ceux des liens envoyés par email. */}
                        <Route path="/auth/register" element={<RegisterPage />} />
                        <Route path="/auth/forgotpassword" element={<ForgotPasswordPage />} />
                        <Route path="/auth/verify/account" element={<VerifyAccountPage />} />
                        <Route path="/auth/verify/password" element={<VerifyPasswordPage />} />
                        <Route path="/auth/verify/mobile" element={<VerifyMobilePage />} />
                        <Route
                            path="/reserver/:offreUuid"
                            element={
                                <RequireAuth>
                                    <ReservationPage />
                                </RequireAuth>
                            }
                        />
                        <Route
                            path="/tableau-de-bord"
                            element={
                                <RequireAuth>
                                    <DashboardHomePage />
                                </RequireAuth>
                            }
                        />
                        <Route
                            path="/agence"
                            element={
                                <RequireAuth>
                                    <RequireRole roles={['ADMIN_IMMO', 'SUPER_ADMIN']}>
                                        <AgenceOnboardingPage />
                                    </RequireRole>
                                </RequireAuth>
                            }
                        />
                        <Route
                            path="/agence/demandes"
                            element={
                                <RequireAuth>
                                    <RequireRole roles={['ADMIN_IMMO', 'SUPER_ADMIN']}>
                                        <DemandesClientsPage />
                                    </RequireRole>
                                </RequireAuth>
                            }
                        />
                        <Route
                            path="/conformite"
                            element={
                                <RequireAuth>
                                    <RequireRole roles={['ADMIN_CONFORMITE', 'SUPER_ADMIN']}>
                                        <ConformitePage />
                                    </RequireRole>
                                </RequireAuth>
                            }
                        />
                        <Route
                            path="/mes-voyages"
                            element={
                                <RequireAuth>
                                    <MesVoyagesPage />
                                </RequireAuth>
                            }
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

/** Chrome des pages publiques et client : barre verte + zone centrée + pied de page. */
function ChromePublic() {
    return (
        <div className="page">
            <Topbar />
            <main>
                <Outlet />
            </main>
            <footer className="footer">Frontend React (phase 1) — même API, même gateway que l'app actuelle.</footer>
        </div>
    );
}

function Topbar() {
    const { user, logout } = useAuth();
    const estAdmin = user ? ROLES_ADMIN.some((r) => hasRole(user, r)) : false;
    const initiales = user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || (user.username?.[0]?.toUpperCase() ?? '?') : '';

    return (
        <header className="navbar">
            <Link to="/" className="navbar-marque" aria-label="Accueil SYNERGIA">
                <img className="navbar-logo" src="/brand/synergia-emblem-512x512.png" alt="SYNERGIA" width={40} height={40} />
                <span className="navbar-marque-texte">
                    <strong>SYNERGIA</strong>
                    <small>IMMO · TRANS · GUINÉE</small>
                </span>
            </Link>

            {user && (
                <nav className="navbar-liens">
                    <NavLink to="/" end className="navbar-lien">
                        Accueil
                    </NavLink>
                    {estAdmin && (
                        <NavLink to="/admin" className="navbar-lien">
                            Administration
                        </NavLink>
                    )}
                    <NavLink to="/tableau-de-bord" className="navbar-lien">
                        Mon espace
                    </NavLink>
                    <NavLink to="/mes-voyages" className="navbar-lien">
                        Mes voyages
                    </NavLink>
                </nav>
            )}

            <div className="navbar-actions">
                {user ? (
                    <>
                        <span className="navbar-user" title={`${user.firstName} ${user.lastName}`}>
                            <span className="navbar-avatar" aria-hidden="true">
                                {initiales}
                            </span>
                            <span className="navbar-user-nom">{user.firstName}</span>
                        </span>
                        <button type="button" className="navbar-deconnexion" onClick={() => void logout()}>
                            Se déconnecter
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="navbar-lien-ghost">
                            Se connecter
                        </Link>
                        <Link to="/auth/register" className="navbar-cta">
                            Créer un compte
                        </Link>
                    </>
                )}
            </div>
        </header>
    );
}

function RequireAuth({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const location = useLocation();

    if (user === undefined) return <p className="muted center">Vérification de la session…</p>;
    if (user === null) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
    return <>{children}</>;
}
