import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
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
                <div className="page">
                    <Topbar />
                    <main>
                        <Routes>
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
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>
                    <footer className="footer">Frontend React (phase 1) — même API, même gateway que l'app actuelle.</footer>
                </div>
            </AuthProvider>
        </BrowserRouter>
    );
}

function Topbar() {
    const { user, logout } = useAuth();
    return (
        <header className="topbar">
            <Link to="/" className="brand">
                SYNERGIA
            </Link>
            <span className="tagline">Voyagez à travers la Guinée</span>
            <span className="topbar-right">
                {user ? (
                    <>
                        {ROLES_ADMIN.some((r) => hasRole(user, r)) && (
                            <Link to="/admin/offres" className="login-link">
                                Administration
                            </Link>
                        )}
                        <Link to="/tableau-de-bord" className="login-link">
                            Mon espace
                        </Link>
                        <Link to="/mes-voyages" className="login-link">
                            Mes voyages
                        </Link>
                        <span className="user-name">
                            {user.firstName} {user.lastName}
                        </span>
                        <button className="link-btn" onClick={() => void logout()}>
                            Se déconnecter
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/auth/register" className="login-link">
                            Créer un compte
                        </Link>
                        <Link to="/login" className="login-link">
                            Se connecter
                        </Link>
                    </>
                )}
            </span>
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
