import { ApiError } from '@sira/api-client';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth-context';
import { CarteAuth } from '../components/CarteAuth';

type TypeCompte = 'PARTICULIER' | 'AGENCE';

interface RegisterForm {
    accountType: TypeCompte;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    phone: string;
    address: string;
    password: string;
}

const FORM_VIDE: RegisterForm = {
    accountType: 'PARTICULIER',
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    phone: '',
    address: '',
    password: ''
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9]+$/;
/** Le serveur d'autorisation refuse en dessous, et `users.address` plafonne à 100. */
const MDP_MIN = 8;
const ADRESSE_MAX = 100;

/** Validation par champ, alignée sur l'Angular (le message du username court manquait, il est ajouté). */
function erreurChamp(champ: keyof RegisterForm, valeur: string): string | null {
    switch (champ) {
        case 'firstName':
            return valeur.trim() ? null : 'Le prénom est requis';
        case 'lastName':
            return valeur.trim() ? null : 'Le nom est requis';
        case 'email':
            if (!valeur.trim()) return "L'email est requis";
            return EMAIL_RE.test(valeur) ? null : "Format d'email invalide";
        case 'username':
            if (!valeur.trim()) return "Le nom d'utilisateur est requis";
            if (!USERNAME_RE.test(valeur)) return 'Uniquement des lettres et chiffres';
            return valeur.length >= 4 ? null : "Le nom d'utilisateur doit faire au moins 4 caractères";
        case 'address':
            if (!valeur.trim()) return "L'adresse est requise";
            return valeur.trim().length <= ADRESSE_MAX ? null : `Adresse trop longue (${ADRESSE_MAX} caractères max)`;
        case 'password':
            if (!valeur) return 'Le mot de passe est requis';
            return valeur.length >= MDP_MIN ? null : `Mot de passe trop court (min. ${MDP_MIN} caractères)`;
        default:
            return null;
    }
}

export function RegisterPage() {
    const { user, loginWithOAuth } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState<RegisterForm>(FORM_VIDE);
    const [touche, setTouche] = useState<Partial<Record<keyof RegisterForm, boolean>>>({});
    const [pending, setPending] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [erreur, setErreur] = useState<string | null>(null);

    // Déjà connecté : l'écran d'inscription n'a plus de sens.
    useEffect(() => {
        if (user) navigate('/', { replace: true });
    }, [user, navigate]);

    const estAgence = form.accountType === 'AGENCE';
    // Les deux inscriptions n'empruntent pas le même service : une agence passe
    // par userservice, qui réclame un nom d'utilisateur et attribue ADMIN_IMMO ;
    // un particulier passe par le serveur d'autorisation, qui réclame une
    // adresse et remplace le nom d'utilisateur par l'email.
    const champs: (keyof RegisterForm)[] = estAgence
        ? ['firstName', 'lastName', 'email', 'username', 'password']
        : ['firstName', 'lastName', 'email', 'address', 'password'];
    const formValide = champs.every((c) => !erreurChamp(c, form[c] as string));

    function maj(champ: keyof RegisterForm, valeur: string) {
        setForm((f) => ({ ...f, [champ]: valeur }));
    }

    function messageErreur(champ: keyof RegisterForm): string | null {
        if (!touche[champ]) return null;
        return erreurChamp(champ, form[champ] as string);
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMessage(null);
        setErreur(null);
        setPending(true);
        try {
            const res = estAgence
                ? await api.users.register({
                      accountType: 'AGENCE',
                      firstName: form.firstName.trim(),
                      lastName: form.lastName.trim(),
                      email: form.email.trim(),
                      username: form.username.trim(),
                      phone: form.phone.trim() || undefined,
                      password: form.password
                  })
                : await api.users.registerParticulier({
                      firstName: form.firstName.trim(),
                      lastName: form.lastName.trim(),
                      email: form.email.trim(),
                      address: form.address.trim(),
                      phone: form.phone.trim() || undefined,
                      password: form.password
                  });
            setMessage(res.message || 'Votre compte a été créé. Vérifiez votre email pour l’activer.');
            // Le formulaire n'est vidé qu'en cas de succès, contrairement à l'Angular
            // qui le réinitialisait même après une erreur.
            setForm({ ...FORM_VIDE, accountType: form.accountType });
            setTouche({});
        } catch (err) {
            setErreur(err instanceof ApiError ? err.message : "L'inscription a échoué. Réessayez dans un instant.");
        } finally {
            setPending(false);
        }
    }

    return (
        <CarteAuth titre="Créer un compte" sousTitre="Rejoignez SYNERGIA : voyages et immobilier en Guinée." large>
            <form className="stack-form" onSubmit={onSubmit} noValidate>
                <fieldset className="choix-compte">
                    <legend>Je suis</legend>
                    <label className={form.accountType === 'PARTICULIER' ? 'carte-choix active' : 'carte-choix'}>
                        <input type="radio" name="accountType" checked={!estAgence} onChange={() => maj('accountType', 'PARTICULIER')} />
                        <i className="pi pi-user" aria-hidden="true" />
                        Particulier
                    </label>
                    <label className={estAgence ? 'carte-choix active' : 'carte-choix'}>
                        <input type="radio" name="accountType" checked={estAgence} onChange={() => maj('accountType', 'AGENCE')} />
                        <i className="pi pi-building" aria-hidden="true" />
                        Agence immobilière
                    </label>
                </fieldset>

                {estAgence && (
                    <p className="bandeau-info">
                        Après vérification de votre email, vous compléterez le profil de votre agence (RCCM/NIF, coordonnées…) avant validation par la conformité.
                    </p>
                )}

                <div className="duo-champs">
                    <label>
                        {estAgence ? 'Prénom du représentant' : 'Prénom'}
                        <input
                            value={form.firstName}
                            placeholder="Ex. : Amadou"
                            onChange={(e) => maj('firstName', e.target.value)}
                            onBlur={() => setTouche((t) => ({ ...t, firstName: true }))}
                        />
                        {messageErreur('firstName') && <span className="texte-danger">{messageErreur('firstName')}</span>}
                    </label>
                    <label>
                        {estAgence ? 'Nom du représentant' : 'Nom'}
                        <input
                            value={form.lastName}
                            placeholder="Ex. : Diallo"
                            onChange={(e) => maj('lastName', e.target.value)}
                            onBlur={() => setTouche((t) => ({ ...t, lastName: true }))}
                        />
                        {messageErreur('lastName') && <span className="texte-danger">{messageErreur('lastName')}</span>}
                    </label>
                </div>

                <label>
                    Email
                    <input
                        type="email"
                        value={form.email}
                        placeholder="nom@email.com"
                        autoComplete="email"
                        onChange={(e) => maj('email', e.target.value)}
                        onBlur={() => setTouche((t) => ({ ...t, email: true }))}
                    />
                    {messageErreur('email') && <span className="texte-danger">{messageErreur('email')}</span>}
                </label>

                {/* Un particulier se connecte avec son email : afficher un champ que
                    le serveur remplacerait par l'email ne ferait qu'induire en erreur. */}
                {estAgence && (
                    <label>
                        Nom d'utilisateur
                        <input
                            value={form.username}
                            placeholder="au moins 4 caractères"
                            autoComplete="username"
                            onChange={(e) => maj('username', e.target.value)}
                            onBlur={() => setTouche((t) => ({ ...t, username: true }))}
                        />
                        {messageErreur('username') && <span className="texte-danger">{messageErreur('username')}</span>}
                    </label>
                )}

                {!estAgence && (
                    <label>
                        Adresse
                        <input
                            value={form.address}
                            placeholder="Ex. : Kaloum, Conakry"
                            maxLength={ADRESSE_MAX}
                            autoComplete="street-address"
                            onChange={(e) => maj('address', e.target.value)}
                            onBlur={() => setTouche((t) => ({ ...t, address: true }))}
                        />
                        {messageErreur('address') && <span className="texte-danger">{messageErreur('address')}</span>}
                    </label>
                )}

                <label>
                    Téléphone
                    <input type="tel" value={form.phone} placeholder="+224 6XX XX XX XX" onChange={(e) => maj('phone', e.target.value)} />
                </label>

                <label>
                    Mot de passe
                    <input
                        type="password"
                        value={form.password}
                        placeholder={`au moins ${MDP_MIN} caractères`}
                        autoComplete="new-password"
                        onChange={(e) => maj('password', e.target.value)}
                        onBlur={() => setTouche((t) => ({ ...t, password: true }))}
                    />
                    {messageErreur('password') && <span className="texte-danger">{messageErreur('password')}</span>}
                </label>

                {message && <p className="succes">{message}</p>}
                {erreur && <p className="error">{erreur}</p>}

                <button type="submit" disabled={!formValide || pending}>
                    {pending ? 'Inscription…' : "S'inscrire"}
                </button>
            </form>

            <div className="auth-sep">
                <span>ou</span>
            </div>

            <button type="button" className="auth-google" onClick={() => void loginWithOAuth()}>
                <i className="pi pi-google" aria-hidden="true" /> Continuer avec Google
            </button>

            <p className="auth-pied">
                Vous avez déjà un compte ? <Link to="/login">Se connecter</Link>
            </p>
        </CarteAuth>
    );
}
