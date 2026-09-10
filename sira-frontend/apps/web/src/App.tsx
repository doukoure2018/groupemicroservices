import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './auth-context';
import { hasRole } from '@sira/core';
import { AdminLayout, RequireRole, ROLES_ADMIN } from './pages/admin/AdminLayout';
import { ArriveesAdminPage } from './pages/admin/ArriveesAdminPage';
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
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { MesVoyagesPage } from './pages/MesVoyagesPage';
import { ReservationPage } from './pages/ReservationPage';

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
                            <Route
                                path="/reserver/:offreUuid"
                                element={
                                    <RequireAuth>
                                        <ReservationPage />
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
                                <Route index element={<Navigate to="offres" replace />} />
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
                    <Link to="/login" className="login-link">
                        Se connecter
                    </Link>
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
