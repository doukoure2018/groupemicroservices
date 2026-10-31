import { BrowserRouter, Link, NavLink, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './auth-context';
import { BarriereErreur } from './components/BarriereErreur';
import { TitreDocument } from './components/TitreDocument';
import './components/pied-de-page.css';
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
import { PaiementRetourPage } from './pages/PaiementRetourPage';
import { RegisterPage } from './pages/RegisterPage';
import { ReservationPage } from './pages/ReservationPage';
import { VerifyAccountPage } from './pages/VerifyAccountPage';
import { VerifyMobilePage } from './pages/VerifyMobilePage';
import { VerifyPasswordPage } from './pages/VerifyPasswordPage';

export function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <TitreDocument />
                <BarriereErreur>
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
                        {/* Pas de RequireAuth : un paiement lancé depuis l'application mobile
                            revient ici dans le navigateur du téléphone, sans session web. La page
                            distingue elle-même ce cas et renvoie vers l'application. */}
                        <Route path="/paiement/retour" element={<PaiementRetourPage />} />
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
                </BarriereErreur>
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
            <SiteFooter />
        </div>
    );
}

interface ColonnePied {
    titre: string;
    liens: { libelle: string; vers: string }[];
}

/**
 * Colonnes du pied de page, reprises de l'Angular en ne gardant que des liens qui
 * mènent quelque part : les ancres de l'accueil, les pages du compte, le contact.
 * Les entrées sans page (carrières, presse, CGU...) attendront d'exister.
 */
const COLONNES_PIED: ColonnePied[] = [
    {
        titre: 'Destinations',
        liens: ['Conakry', 'Kankan', 'Labé', 'Nzérékoré', 'Mamou', 'Boké'].map((v) => ({ libelle: v, vers: '/#guide' }))
    },
    {
        titre: 'Entreprise',
        liens: [
            { libelle: 'À propos', vers: '/#about' },
            { libelle: 'Nos services', vers: '/#services' },
            { libelle: 'Comment ça marche', vers: '/#how-it-works' },
            { libelle: 'L’application mobile', vers: '/#application' }
        ]
    },
    {
        titre: 'Support',
        liens: [
            { libelle: 'Guide du voyageur', vers: '/#guide' },
            { libelle: 'Conseils pratiques', vers: '/#conseils' },
            { libelle: 'Contact', vers: 'mailto:contact@synergia-guinee.com' },
            { libelle: 'Réclamations', vers: 'mailto:contact@synergia-guinee.com?subject=R%C3%A9clamation' }
        ]
    },
    {
        titre: 'Mon compte',
        liens: [
            { libelle: 'Rechercher un voyage', vers: '/' },
            { libelle: 'Mes voyages', vers: '/mes-voyages' },
            { libelle: 'Se connecter', vers: '/login' },
            { libelle: 'Créer un compte', vers: '/auth/register' }
        ]
    }
];

/** Pied de page public : marque et contact, colonnes de liens, mention légale. */
function SiteFooter() {
    return (
        <footer className="footer pied-de-page" id="contact">
            <div className="pied-contenu">
                <div className="pied-marque">
                    <Link to="/" className="pied-marque-logo" aria-label="Accueil SYNERGIA">
                        <img src="/brand/synergia-emblem-512x512.png" alt="" width={42} height={42} />
                        <span>
                            <strong>SYNERGIA</strong>
                            <small>Immobilier et transport en Guinée</small>
                        </span>
                    </Link>
                    <p>La plateforme de référence pour la réservation de billets de transport terrestre en Guinée.</p>
                    <ul className="pied-contact" aria-label="Nous contacter">
                        <li>
                            <a href="tel:+224620000000">
                                <i className="pi pi-phone" aria-hidden="true" /> +224 620 00 00 00
                            </a>
                        </li>
                        <li>
                            <a href="mailto:contact@synergia-guinee.com">
                                <i className="pi pi-envelope" aria-hidden="true" /> contact@synergia-guinee.com
                            </a>
                        </li>
                    </ul>
                </div>

                <div className="pied-colonnes">
                    {COLONNES_PIED.map((col) => (
                        <nav key={col.titre} className="pied-colonne" aria-label={col.titre}>
                            <h3>{col.titre}</h3>
                            <ul>
                                {col.liens.map((l) => (
                                    <li key={l.libelle}>{l.vers.startsWith('mailto:') ? <a href={l.vers}>{l.libelle}</a> : <Link to={l.vers}>{l.libelle}</Link>}</li>
                                ))}
                            </ul>
                        </nav>
                    ))}
                </div>
            </div>
            <div className="pied-bas">
                <p>© {new Date().getFullYear()} SYNERGIA · IMMO · TRANS · GUINÉE. Tous droits réservés.</p>
                <p>Fait avec passion en Guinée</p>
            </div>
        </footer>
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
