import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { ApiError } from '@sira/api-client';
import {
    estEnfant,
    formatDateFr,
    formatHeure,
    formatMontant,
    getMontantEffectif,
    hasPromotion,
    jourIso,
    nombreSiegesLibres,
    voyageursDepuisParams,
    type CommandeClient,
    type TypePassager
} from '@sira/core';
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth-context';
import { ConfirmationCommande } from '../components/ConfirmationCommande';
import { LegendeSieges, PlanSiegesVue } from '../components/PlanSieges';
import { Compteur } from '../components/Compteur';
import { CLE_REFERENCE_PAIEMENT } from './PaiementRetourPage';

const MAX_PLACES = 8;
const BAGAGES_MAX = 10;

interface PassagerForm {
    typePassager: TypePassager;
    nom: string;
    prenom: string;
    telephone: string;
    pieceIdentite: string;
    /** AAAA-MM-JJ (champ date du navigateur), exigée pour un enfant. */
    naissance: string;
}

const passagerVide = (typePassager: TypePassager): PassagerForm => ({ typePassager, nom: '', prenom: '', telephone: '', pieceIdentite: '', naissance: '' });

/**
 * Le tunnel de réservation : passagers (adultes et enfants), sièges, bagages,
 * contact, règlement. Le prix vient du serveur — le devis se recalcule à
 * chaque changement et c'est son total qui repart à la création, si bien
 * qu'un tarif modifié entre-temps fait refuser la commande plutôt que de
 * faire payer un montant jamais affiché.
 */
export function ReservationPage() {
    const { offreUuid } = useParams<{ offreUuid: string }>();
    const [params] = useSearchParams();
    const initial = voyageursDepuisParams({
        adultes: params.get('adultes') ?? undefined,
        enfants: params.get('enfants') ?? undefined,
        bagages: params.get('bagages') ?? undefined
    });
    const { user } = useAuth();

    const offreQuery = useQuery({
        queryKey: ['offre', offreUuid],
        queryFn: async () => (await api.offres.byUuid(offreUuid!)).data.offre,
        enabled: !!offreUuid
    });

    const modesQuery = useQuery({
        queryKey: ['modes-reglement'],
        queryFn: async () => (await api.commercial.modesReglement()).data.modesReglement
    });

    const [passagers, setPassagers] = useState<PassagerForm[]>(() => [
        ...Array.from({ length: initial.adultes }, () => passagerVide('ADULTE')),
        ...Array.from({ length: initial.enfants }, () => passagerVide('ENFANT'))
    ]);
    const [bagages, setBagages] = useState(initial.bagages);
    const [sieges, setSieges] = useState<string[]>([]);
    const [planOuvert, setPlanOuvert] = useState(false);
    const [contactEmail, setContactEmail] = useState(user?.email ?? '');
    const [contactTelephone, setContactTelephone] = useState(user?.phone ?? '');
    const [modeReglementCode, setModeReglementCode] = useState('');
    const [commande, setCommande] = useState<CommandeClient | null>(null);
    const [redirection, setRedirection] = useState(false);

    const offre = offreQuery.data;
    const prixUnitaire = offre ? getMontantEffectif(offre) : 0;
    const nbAdultes = passagers.filter((p) => p.typePassager === 'ADULTE').length;
    const nbEnfants = passagers.length - nbAdultes;
    const maxPassagers = Math.min(MAX_PLACES, offre?.nombrePlacesDisponibles ?? MAX_PLACES);
    const bagagesAcceptes = offre?.bagagesAutorises !== false;

    const devisQuery = useQuery({
        queryKey: ['devis', offreUuid, nbAdultes, nbEnfants, bagages, modeReglementCode],
        queryFn: async () =>
            (
                await api.commandes.devis({
                    offreUuid: offreUuid!,
                    nombreAdultes: nbAdultes,
                    nombreEnfants: nbEnfants,
                    nombreBagages: bagages,
                    modeReglementCode: modeReglementCode || undefined
                })
            ).data.devis,
        enabled: !!offreUuid && nbAdultes >= 1,
        placeholderData: keepPreviousData
    });
    const devis = devisQuery.data;
    const ageAdulte = devis?.ageAdulteMinimum ?? 15;
    const jourVoyage = jourIso(offre?.dateDepart);
    const siegesChoisis = sieges.length === passagers.length && sieges.length > 0;

    function erreurNaissance(p: PassagerForm): string | null {
        if (p.typePassager !== 'ENFANT' || !p.naissance) return null;
        if (!jourVoyage) return null;
        if (estEnfant(p.naissance, jourVoyage, ageAdulte) === false) {
            return `Âge maximum : ${ageAdulte - 1} ans le jour du voyage. Inscrivez ce passager comme adulte.`;
        }
        return null;
    }

    const reserver = useMutation({
        mutationFn: async () =>
            (
                await api.commandes.create({
                    offreUuid: offreUuid!,
                    passagers: passagers.map((p, i) => ({
                        nom: p.nom.trim(),
                        prenom: p.prenom.trim(),
                        telephone: p.telephone.trim() || undefined,
                        pieceIdentite: p.pieceIdentite.trim() || undefined,
                        typePassager: p.typePassager,
                        dateNaissance: p.typePassager === 'ENFANT' ? p.naissance : undefined,
                        numeroSiege: siegesChoisis ? sieges[i] : undefined
                    })),
                    modeReglementCode,
                    montantTotal: devis!.montantAPayer,
                    nombreBagages: bagages,
                    contactEmail: contactEmail.trim() || undefined,
                    contactTelephone: contactTelephone.trim()
                })
            ).data.commande,
        onSuccess: (cmd) => {
            // Paiement en ligne : la commande attend les fonds, les billets ne
            // sont pas encore utilisables, et c'est le prestataire qui prend la
            // main. Hors ligne, rien ne change : la commande est déjà confirmée.
            if (cmd.urlPaiement) {
                try {
                    // Filet pour le retour : certains prestataires ne renvoient
                    // pas la référence dans l'adresse.
                    sessionStorage.setItem(CLE_REFERENCE_PAIEMENT, cmd.referencePaiement ?? '');
                } catch {
                    /* navigation privée : la référence viendra de l'adresse de retour */
                }
                setRedirection(true);
                window.location.assign(cmd.urlPaiement);
                return;
            }
            setCommande(cmd);
        }
    });

    if (offreQuery.isLoading) return <p className="muted center">Chargement du voyage…</p>;
    if (offreQuery.isError || !offre) {
        return (
            <section className="card card-large">
                <div className="etat-vide">
                    <i className="pi pi-compass grand-icone erreur-icone" aria-hidden="true" />
                    <p className="error">Ce voyage est introuvable ou n'est plus disponible.</p>
                    <Link className="bouton-lien" to="/">
                        <i className="pi pi-arrow-left" aria-hidden="true" /> Retour à la recherche
                    </Link>
                </div>
            </section>
        );
    }

    if (redirection) {
        return (
            <section className="card card-large">
                <div className="etat-vide">
                    <i className="pi pi-spin pi-spinner grand-icone" aria-hidden="true" />
                    <h1>Redirection vers le paiement…</h1>
                    <p className="muted">Vous allez régler votre réservation chez votre opérateur. Ne fermez pas cette fenêtre.</p>
                </div>
            </section>
        );
    }

    if (commande) return <ConfirmationCommande commande={commande} />;

    function setPassager(index: number, champ: keyof PassagerForm, valeur: string) {
        setPassagers((prev) => prev.map((p, i) => (i === index ? { ...p, [champ]: valeur } : p)));
    }
    function ajouter(type: TypePassager) {
        setPassagers((prev) => [...prev, passagerVide(type)]);
        setSieges([]);
    }
    function retirer(index: number) {
        setPassagers((prev) => prev.filter((_, i) => i !== index));
        setSieges([]);
    }

    const modeChoisi = (modesQuery.data ?? []).find((m) => m.code === modeReglementCode);
    const paiementEnLigne = modeChoisi?.enLigne === true;
    const passagersValides = passagers.every(
        (p) => p.nom.trim() && p.prenom.trim() && (p.typePassager === 'ADULTE' || (!!p.naissance && erreurNaissance(p) === null))
    );
    const formulaireValide = modeReglementCode !== '' && nbAdultes >= 1 && passagersValides && contactTelephone.trim() !== '' && !!devis && !devisQuery.isError;
    const messageErreur =
        reserver.error instanceof ApiError && reserver.error.message
            ? reserver.error.message
            : paiementEnLigne
              ? "Le paiement n'a pas pu être ouvert. Aucune place n'a été retenue, réessayez dans un instant."
              : 'La réservation a échoué. Vérifiez les places disponibles et réessayez.';

    return (
        <section className="card card-large">
            <div className="admin-entete">
                <div>
                    <h1>Finaliser la réservation</h1>
                    <p className="muted">Renseignez les passagers et le mode de règlement pour recevoir vos billets QR.</p>
                </div>
                <Link className="lien-discret" to="/">
                    <i className="pi pi-arrow-left" aria-hidden="true" /> Retour à la recherche
                </Link>
            </div>

            <div className="recap-voyage">
                <div>
                    <strong>
                        {offre.villeDepartLibelle} → {offre.villeArriveeLibelle}
                    </strong>
                    <span className="muted">
                        {offre.siteDepart} → {offre.siteArrivee}
                    </span>
                </div>
                <div>
                    {formatDateFr(offre.dateDepart)} à {formatHeure(offre.heureDepart)}
                </div>
                <div>
                    {hasPromotion(offre) && <span className="prix-barre">{formatMontant(offre.montant, offre.devise)}</span>}{' '}
                    <strong>{formatMontant(prixUnitaire, offre.devise)}</strong> / place
                </div>
            </div>

            <h2 className="etape">
                <span className="etape-numero">1</span> Passagers ({passagers.length})
            </h2>
            {passagers.map((p, i) => {
                const enfant = p.typePassager === 'ENFANT';
                const seulAdulte = !enfant && nbAdultes === 1;
                const erreurDate = erreurNaissance(p);
                return (
                    <fieldset key={i} className="passager">
                        <legend>
                            {i + 1}. {enfant ? 'Enfant' : 'Adulte'}
                        </legend>
                        <div className="passager-grid">
                            <label>
                                Nom *
                                <input value={p.nom} onChange={(e) => setPassager(i, 'nom', e.target.value)} required />
                            </label>
                            <label>
                                Prénom *
                                <input value={p.prenom} onChange={(e) => setPassager(i, 'prenom', e.target.value)} required />
                            </label>
                            {enfant ? (
                                <label>
                                    Date de naissance *
                                    <input type="date" max={jourVoyage ?? undefined} value={p.naissance} onChange={(e) => setPassager(i, 'naissance', e.target.value)} required />
                                    {erreurDate ? <span className="champ-erreur">{erreurDate}</span> : <span className="aide-champ">Moins de {ageAdulte} ans le jour du voyage</span>}
                                </label>
                            ) : (
                                <>
                                    <label>
                                        Téléphone
                                        <input type="tel" placeholder="+224 6XX XX XX XX" value={p.telephone} onChange={(e) => setPassager(i, 'telephone', e.target.value)} />
                                    </label>
                                    <label>
                                        Pièce d'identité
                                        <input value={p.pieceIdentite} onChange={(e) => setPassager(i, 'pieceIdentite', e.target.value)} />
                                    </label>
                                </>
                            )}
                        </div>
                        {passagers.length > 1 && !seulAdulte && (
                            <button type="button" className="link-btn danger" onClick={() => retirer(i)}>
                                Retirer ce passager
                            </button>
                        )}
                    </fieldset>
                );
            })}
            {passagers.length < maxPassagers && (
                <div className="passager-ajouts">
                    <button type="button" className="secondary bouton-ajout-passager" onClick={() => ajouter('ADULTE')}>
                        + Ajouter un passager
                    </button>
                    <button type="button" className="secondary" onClick={() => ajouter('ENFANT')}>
                        + Ajouter un enfant (moins de {ageAdulte} ans)
                    </button>
                </div>
            )}

            <h2 className="etape">
                <span className="etape-numero">2</span> Sièges
            </h2>
            <button type="button" className="ligne-choix" onClick={() => setPlanOuvert((o) => !o)} aria-expanded={planOuvert}>
                <div>
                    <strong>{siegesChoisis ? `Sièges ${[...sieges].sort((a, b) => Number(a) - Number(b)).join(', ')}` : 'Choisir les sièges'}</strong>
                    <span className="muted">
                        {siegesChoisis ? 'Cliquez pour modifier' : 'Sinon, nous vous attribuons les premiers sièges libres, côte à côte si possible, sans frais.'}
                    </span>
                </div>
                <i className={planOuvert ? 'pi pi-chevron-up' : 'pi pi-chevron-down'} aria-hidden="true" />
            </button>
            {planOuvert && <ChoixSieges offreUuid={offreUuid!} nombre={passagers.length} sieges={sieges} onChanger={setSieges} onFermer={() => setPlanOuvert(false)} />}

            <h2 className="etape">
                <span className="etape-numero">3</span> Bagages
            </h2>
            <div className="recap-voyage">
                <div>
                    <strong>Inclus</strong>
                    <span className="muted">
                        {devis?.bagagesInclus ?? passagers.length} bagage{(devis?.bagagesInclus ?? 1) > 1 ? 's' : ''} en soute pour {passagers.length} passager
                        {passagers.length > 1 ? 's' : ''}, et le sac que chacun garde avec lui.
                    </span>
                </div>
                {bagagesAcceptes ? (
                    <Compteur
                        libelle="Bagages supplémentaires"
                        aide={`${formatMontant(offre.montantBagageEffectif ?? 0, offre.devise)} par bagage`}
                        valeur={bagages}
                        min={0}
                        max={BAGAGES_MAX}
                        onChange={setBagages}
                    />
                ) : (
                    <span className="muted">Pas de bagage supplémentaire sur ce voyage.</span>
                )}
            </div>

            <h2 className="etape">
                <span className="etape-numero">4</span> Contact
            </h2>
            <div className="bloc-contact">
                <label>
                    E-mail
                    <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                    <span className="aide-champ">Pour recevoir vos billets et les changements de départ.</span>
                </label>
                <label>
                    Numéro de téléphone *
                    <input type="tel" placeholder="+224 6XX XX XX XX" value={contactTelephone} onChange={(e) => setContactTelephone(e.target.value)} required />
                    <span className="aide-champ">Utilisé pour vous joindre en cas de retard.</span>
                </label>
            </div>

            <h2 className="etape">
                <span className="etape-numero">5</span> Mode de règlement
            </h2>
            {modesQuery.isError && <p className="error">Impossible de charger les modes de règlement.</p>}
            <div className="modes">
                {(modesQuery.data ?? [])
                    .filter((m) => m.actif !== false)
                    .map((m) => (
                        <label key={m.code} className={`mode ${modeReglementCode === m.code ? 'mode-actif' : ''}`}>
                            <input
                                type="radio"
                                name="modeReglement"
                                value={m.code}
                                checked={modeReglementCode === m.code}
                                onChange={() => setModeReglementCode(m.code ?? '')}
                            />
                            {m.libelle}
                        </label>
                    ))}
            </div>

            {paiementEnLigne && (
                <p className="bandeau-info">
                    Vous serez redirigé vers <strong>{modeChoisi?.libelle}</strong> pour régler. Vos billets sont émis dès que le paiement est confirmé.
                </p>
            )}
            {modeChoisi && !paiementEnLigne && <p className="bandeau-info">Règlement sur place, au départ. Vos billets sont émis immédiatement.</p>}

            <h2 className="section-titre">Votre commande</h2>
            <div className="total-bar" aria-live="polite">
                {devis ? (
                    <>
                        <ul className="devis-lignes">
                            {devis.lignes.map((l) => (
                                <li key={l.code}>
                                    <span>
                                        {l.quantite > 1 ? `${l.quantite} × ` : ''}
                                        {l.libelle}
                                        {l.quantite > 1 ? ` (${formatMontant(l.montantUnitaire, devis.devise)})` : ''}
                                    </span>
                                    <span>{formatMontant(l.montant, devis.devise)}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="devis-total">
                            <span>Total à payer</span>
                            <strong>{formatMontant(devis.montantAPayer, devis.devise)}</strong>
                        </div>
                    </>
                ) : devisQuery.isError ? (
                    <p className="error">Le prix n'a pas pu être calculé. Réessayez dans un instant.</p>
                ) : (
                    <span className="muted">Calcul du prix…</span>
                )}
            </div>

            {reserver.isError && <p className="error">{messageErreur}</p>}
            <button className="bouton-confirmer" disabled={!formulaireValide || reserver.isPending} onClick={() => reserver.mutate()}>
                {reserver.isPending
                    ? paiementEnLigne
                        ? 'Ouverture du paiement…'
                        : 'Réservation en cours…'
                    : paiementEnLigne
                      ? 'Payer maintenant'
                      : 'Confirmer la réservation'}
            </button>
        </section>
    );
}

/**
 * Le plan du véhicule, chargé à l'ouverture : un siège libre il y a une minute
 * ne l'est peut-être plus. « Ignorer la sélection » laisse le serveur attribuer.
 */
function ChoixSieges({
    offreUuid,
    nombre,
    sieges,
    onChanger,
    onFermer
}: {
    offreUuid: string;
    nombre: number;
    sieges: string[];
    onChanger: (sieges: string[]) => void;
    onFermer: () => void;
}) {
    const siegesQuery = useQuery({
        queryKey: ['sieges', offreUuid],
        queryFn: async () => (await api.offres.sieges(offreUuid)).data.sieges,
        staleTime: 0
    });

    if (siegesQuery.isLoading) return <p className="muted center">Chargement du plan…</p>;
    if (siegesQuery.isError || !siegesQuery.data) {
        return <p className="muted">Le plan du véhicule n'a pas pu être chargé. Vos sièges seront attribués automatiquement.</p>;
    }

    const plan = siegesQuery.data;
    const libres = nombreSiegesLibres(plan);

    function basculer(numero: string) {
        if (sieges.includes(numero)) {
            onChanger(sieges.filter((n) => n !== numero));
            return;
        }
        // Au complet : le plus ancien choix cède sa place au nouveau.
        onChanger([...(sieges.length >= nombre ? sieges.slice(1) : sieges), numero]);
    }

    return (
        <div>
            <LegendeSieges />
            {libres < nombre && (
                <p className="bandeau-info">
                    Il ne reste que {libres} siège{libres > 1 ? 's' : ''} libre{libres > 1 ? 's' : ''} sur ce véhicule.
                </p>
            )}
            <div className="plan-defilement">
                <PlanSiegesVue plan={plan.plan} occupes={plan.occupes} choisis={sieges} onBasculer={basculer} />
            </div>
            <div className="sieges-pied">
                <span className="muted">
                    {sieges.length === 0
                        ? `Aucun siège sélectionné — ${nombre} à choisir`
                        : `${sieges.length} siège${sieges.length > 1 ? 's' : ''} sur ${nombre} : ${[...sieges].sort((a, b) => Number(a) - Number(b)).join(', ')}`}
                </span>
                <span className="commande-actions">
                    <button type="button" disabled={sieges.length !== nombre} onClick={onFermer}>
                        Confirmer
                    </button>
                    <button
                        type="button"
                        className="link-btn"
                        onClick={() => {
                            onChanger([]);
                            onFermer();
                        }}
                    >
                        Ignorer la sélection
                    </button>
                </span>
            </div>
        </div>
    );
}
