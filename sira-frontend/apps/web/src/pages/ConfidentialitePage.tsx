import './confidentialite.css';

/** Date de dernière révision du texte, affichée en tête. */
const DERNIERE_MAJ = '24 novembre 2026';

interface Collecte {
    quoi: string;
    pourquoi: string;
    base: string;
}

/**
 * Ce tableau décrit ce que l'application collecte réellement, relevé dans le
 * code et non rédigé d'après un modèle : c'est lui qui doit correspondre, champ
 * par champ, au formulaire « Sécurité des données » de Google Play et à la
 * « Confidentialité de l'app » d'App Store Connect.
 */
const COLLECTES: Collecte[] = [
    {
        quoi: 'Nom, prénom, adresse électronique, numéro de téléphone, mot de passe',
        pourquoi: 'Créer votre compte, vous identifier, vous envoyer vos billets et les messages du service',
        base: 'Exécution du contrat'
    },
    {
        quoi: 'Identité de votre compte Google, si vous choisissez ce mode de connexion',
        pourquoi: 'Vous connecter sans créer un mot de passe de plus',
        base: 'Votre consentement'
    },
    {
        quoi: 'Réservations : trajet, date, nombre de passagers et de bagages, références de paiement',
        pourquoi: 'Émettre le billet, le contrôler à l’embarquement, traiter une annulation',
        base: 'Exécution du contrat'
    },
    {
        quoi: 'Annonces de logement : titre, description, prix, adresse saisie, photos, nom et téléphone de contact',
        pourquoi: 'Publier votre annonce. Ces éléments sont publics, c’est leur raison d’être',
        base: 'Exécution du contrat'
    },
    {
        quoi: 'Mises en relation : messages envoyés à un vendeur, demandes de visite, signalements',
        pourquoi: 'Transmettre votre demande et modérer les annonces',
        base: 'Exécution du contrat'
    },
    {
        quoi: 'Jeton de notification de votre appareil',
        pourquoi: 'Vous prévenir d’un paiement confirmé, d’un départ proche, d’une visite acceptée',
        base: 'Votre consentement, révocable dans les réglages du téléphone'
    },
    {
        quoi: 'Documents justificatifs, pour les comptes professionnels seulement',
        pourquoi: 'Vérifier qu’une agence existe avant de lui ouvrir la publication',
        base: 'Obligation légale et intérêt légitime'
    },
    {
        quoi: 'Adresse IP et horodatage, dans les journaux techniques du serveur',
        pourquoi: 'Sécurité, détection d’abus, diagnostic de panne',
        base: 'Intérêt légitime'
    }
];

interface Duree {
    donnees: string;
    duree: string;
}

const DUREES: Duree[] = [
    { donnees: 'Compte et profil', duree: "Jusqu'à la suppression du compte, puis trente jours" },
    { donnees: 'Réservations et billets', duree: 'Trois ans, pour la comptabilité et les litiges' },
    { donnees: 'Annonces retirées', duree: 'Un an, pour permettre une remise en ligne' },
    { donnees: 'Messages et demandes de visite', duree: 'Un an' },
    { donnees: 'Journaux techniques', duree: 'Douze mois' }
];

interface Tiers {
    nom: string;
    role: string;
    ou: string;
}

const TIERS: Tiers[] = [
    { nom: 'Google', role: 'Connexion avec un compte Google et envoi des notifications', ou: 'Hors Guinée' },
    { nom: 'CinetPay et Chap Chap Pay', role: 'Encaissement des paiements', ou: 'Afrique de l’Ouest' },
    { nom: 'Orange Guinée', role: 'Envoi des SMS du service', ou: 'Guinée' },
    { nom: 'Google Gmail', role: 'Acheminement des courriels du service', ou: 'Hors Guinée' },
    { nom: 'OVHcloud', role: 'Hébergement des serveurs et stockage des photos', ou: 'Europe' }
];

/**
 * Politique de confidentialité. Les deux magasins d'applications exigent une
 * adresse publique de ce document avant d'accepter une fiche : c'est cette page
 * qui sera déclarée. Elle doit donc rester accessible sans compte.
 */
export function ConfidentialitePage() {
    return (
        <main className="conf-page">
            <h1>Politique de confidentialité</h1>
            <p className="conf-maj">Dernière mise à jour : {DERNIERE_MAJ}</p>

            <p className="conf-brouillon">
                <strong>Document en cours de validation.</strong> Les mentions d’identité de l’éditeur et les
                durées de conservation attendent confirmation avant publication sur le site public. Le reste
                décrit le fonctionnement réel de l’application et du site.
            </p>

            <h2>Qui est responsable de vos données</h2>
            <p>
                SYNERGIA, plateforme de transport terrestre et d’immobilier en Guinée. Raison sociale,
                numéro RCCM et adresse du siège : <em>à compléter avant publication</em>. Pour toute question
                sur vos données, écrivez à <a href="mailto:contact@synergia-guinee.com">contact@synergia-guinee.com</a>.
            </p>

            <h2>Ce que nous collectons, et pourquoi</h2>
            <p>
                Nous ne demandons que ce dont le service a besoin pour fonctionner. Chercher un voyage ou un
                logement ne demande aucun compte : les données ci-dessous n’apparaissent qu’au moment où vous
                agissez.
            </p>
            <div className="conf-tableau">
                <table>
                    <thead>
                        <tr>
                            <th scope="col">Données</th>
                            <th scope="col">Pourquoi</th>
                            <th scope="col">Fondement</th>
                        </tr>
                    </thead>
                    <tbody>
                        {COLLECTES.map((c) => (
                            <tr key={c.quoi}>
                                <td>{c.quoi}</td>
                                <td>{c.pourquoi}</td>
                                <td>{c.base}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <h2>Ce que nous ne collectons pas</h2>
            <ul>
                <li>Aucune position géographique. L’application ne demande jamais l’accès à votre localisation.</li>
                <li>Aucun mouchard publicitaire et aucun outil de mesure d’audience.</li>
                <li>Aucune donnée de carte bancaire. Nous ne voyons ni numéro, ni code.</li>
                <li>Aucun accès à vos contacts, à vos messages ou à votre historique de navigation.</li>
            </ul>

            <h2>L’appareil photo et vos photos</h2>
            <p>
                L’accès à l’appareil photo sert à deux choses : lire le code QR d’un billet au contrôle, et
                photographier un bien que vous mettez en annonce. L’accès à votre photothèque sert à choisir
                une image pour une annonce. Les deux autorisations sont demandées au moment où elles servent,
                et un refus laisse l’application utilisable : le contrôle passe par la saisie du code, et une
                annonce se publie sans photo.
            </p>

            <h2>Les paiements</h2>
            <p>
                Le règlement passe par CinetPay ou par Chap Chap Pay. La page de l’opérateur s’ouvre à
                l’intérieur de l’application, vous y saisissez vos informations de paiement, et nous ne
                recevons que la référence de l’opération et son résultat. Aucune donnée de carte ni de compte
                mobile ne transite par nos serveurs.
            </p>

            <h2>Qui reçoit des données</h2>
            <p>
                Nous ne vendons aucune donnée et ne la cédons à aucun courtier. Seuls les prestataires
                nécessaires au service en reçoivent, et uniquement pour la part qui les concerne.
            </p>
            <div className="conf-tableau">
                <table>
                    <thead>
                        <tr>
                            <th scope="col">Prestataire</th>
                            <th scope="col">Rôle</th>
                            <th scope="col">Lieu de traitement</th>
                        </tr>
                    </thead>
                    <tbody>
                        {TIERS.map((t) => (
                            <tr key={t.nom}>
                                <td>{t.nom}</td>
                                <td>{t.role}</td>
                                <td>{t.ou}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <h2>Combien de temps nous gardons vos données</h2>
            <div className="conf-tableau">
                <table>
                    <thead>
                        <tr>
                            <th scope="col">Données</th>
                            <th scope="col">Durée</th>
                        </tr>
                    </thead>
                    <tbody>
                        {DUREES.map((d) => (
                            <tr key={d.donnees}>
                                <td>{d.donnees}</td>
                                <td>{d.duree}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <h2>Vos droits</h2>
            <p>
                Vous pouvez demander à consulter vos données, à les corriger, à les faire supprimer, et
                retirer un consentement que vous avez donné. Les notifications se coupent dans les réglages du
                téléphone, sans passer par nous. Pour les autres demandes, écrivez à{' '}
                <a href="mailto:contact@synergia-guinee.com">contact@synergia-guinee.com</a> : nous répondons
                sous trente jours.
            </p>
            <p>
                La suppression d’un compte efface le profil et les annonces. Les réservations déjà payées sont
                conservées le temps prévu plus haut, parce qu’un billet émis et une recette encaissée doivent
                pouvoir être justifiés.
            </p>

            <h2>Sécurité</h2>
            <ul>
                <li>Toutes les communications passent par HTTPS.</li>
                <li>Les mots de passe sont enregistrés sous forme chiffrée, jamais en clair.</li>
                <li>Sur le téléphone, les jetons de session vivent dans le trousseau chiffré du système.</li>
                <li>L’accès aux données de production est limité aux personnes qui exploitent le service.</li>
            </ul>

            <h2>Mineurs</h2>
            <p>
                Le service n’est pas destiné aux moins de seize ans sans l’accord d’un représentant légal. Un
                enfant peut voyager sur une réservation faite par un adulte : c’est le compte de l’adulte qui
                porte la réservation.
            </p>

            <h2>Modifications</h2>
            <p>
                Toute modification de ce document est publiée sur cette page, avec une nouvelle date de mise à
                jour. Un changement qui élargirait l’usage de vos données vous serait annoncé dans
                l’application avant d’entrer en vigueur.
            </p>

            <div className="conf-contact">
                <p>
                    <strong>Nous écrire</strong>
                </p>
                <p>
                    <a href="mailto:contact@synergia-guinee.com">contact@synergia-guinee.com</a>
                </p>
                <p>SYNERGIA, Conakry, Guinée</p>
            </div>
        </main>
    );
}
