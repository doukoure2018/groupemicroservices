import { useMutation, useQuery, keepPreviousData } from '@tanstack/react-query';
import { ApiError } from '@sira/api-client';
import { AGE_ADULTE_DEFAUT, estEnfant, formatDateCourte, formatHeure, formatMontant, jourIso, voyageursDepuisParams, type CommandeClient, type TypePassager } from '@sira/core';
import { router, useLocalSearchParams, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../../api';
import { useAuth } from '../../auth/contexte';
import { ecrireBrouillon, effacerBrouillon, lireBrouillon, type PassagerForm } from '../../reservation/brouillon';
import { SelecteurSieges } from '../../sieges/selecteur-sieges';
import { Bandeau, Bouton, Carte, Champ, Chargement, EtatVide, styles as base } from '../../ui/base';
import { Compteur } from '../../ui/compteur';
import { couleurs, espaces, rayons, texte } from '../../ui/theme';

const MAX_PLACES = 8;
const BAGAGES_MAX = 10;

const passagerVide = (typePassager: TypePassager): PassagerForm => ({ typePassager, nom: '', prenom: '', telephone: '', pieceIdentite: '', naissance: '' });

/** Les barres s'insèrent toutes seules : on ne tape que des chiffres. */
function formaterSaisieDate(texte: string): string {
    const chiffres = texte.replace(/\D/g, '').slice(0, 8);
    return [chiffres.slice(0, 2), chiffres.slice(2, 4), chiffres.slice(4, 8)].filter(Boolean).join('/');
}

/** AAAA-MM-JJ si la saisie est une date réelle, sinon null. */
function isoDepuisSaisie(saisie: string): string | null {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(saisie);
    if (!m) return null;
    const j = Number(m[1]);
    const mois = Number(m[2]);
    const a = Number(m[3]);
    const d = new Date(a, mois - 1, j);
    if (d.getFullYear() !== a || d.getMonth() !== mois - 1 || d.getDate() !== j) return null;
    return `${m[3]}-${m[2]}-${m[1]}`;
}

/**
 * Le tunnel de réservation : passagers, sièges, bagages, contact, règlement,
 * puis le récapitulatif tel que le serveur le chiffre. Tout se parcourt sans
 * compte — y compris le choix des sièges — et la connexion n'est demandée
 * qu'au dernier bouton, celui qui engage. Ce qui a été saisi est conservé le
 * temps d'aller se connecter. Le total renvoyé à la création est celui du
 * devis affiché ; si le prix a bougé, le serveur refuse et le dit.
 */
export default function Reserver() {
    const params = useLocalSearchParams<{ uuid: string; adultes?: string; enfants?: string; bagages?: string }>();
    const { uuid } = params;
    const { user } = useAuth();
    const chemin = usePathname();
    const initial = voyageursDepuisParams(params);
    const brouillon = lireBrouillon(uuid);

    const offreQuery = useQuery({ queryKey: ['offre', uuid], queryFn: async () => (await api.offres.byUuid(uuid)).data.offre, enabled: !!uuid });
    const modesQuery = useQuery({ queryKey: ['modes-reglement'], queryFn: async () => (await api.commercial.modesReglementActifs()).data.modesReglement ?? [] });

    // Repris du brouillon au retour de la connexion, sinon de l'accueil.
    const [passagers, setPassagers] = useState<PassagerForm[]>(
        () =>
            brouillon?.passagers ?? [
                ...Array.from({ length: initial.adultes }, () => passagerVide('ADULTE')),
                ...Array.from({ length: initial.enfants }, () => passagerVide('ENFANT'))
            ]
    );
    const [bagages, setBagages] = useState(brouillon?.bagages ?? initial.bagages);
    const [contactEmail, setContactEmail] = useState(brouillon?.contactEmail ?? user?.email ?? '');
    const [contactTelephone, setContactTelephone] = useState(brouillon?.contactTelephone ?? user?.phone ?? '');
    const [modeCode, setModeCode] = useState(brouillon?.modeCode ?? '');
    // Un siège par passager, dans l'ordre de la liste ; vide = laissé au serveur.
    const [sieges, setSieges] = useState<string[]>(brouillon?.sieges ?? []);
    const [choixSieges, setChoixSieges] = useState(false);

    // La session arrive après coup (retour de connexion) : on complète le
    // contact resté vide, sans jamais écraser ce que le voyageur a tapé.
    useEffect(() => {
        if (!user) return;
        setContactEmail((v) => v || user.email || '');
        setContactTelephone((v) => v || user.phone || '');
    }, [user]);

    const offre = offreQuery.data;
    const nbAdultes = passagers.filter((p) => p.typePassager === 'ADULTE').length;
    const nbEnfants = passagers.length - nbAdultes;
    const maxPassagers = Math.min(MAX_PLACES, offre?.nombrePlacesDisponibles ?? MAX_PLACES);
    const modes = (modesQuery.data ?? []).filter((m) => m.actif !== false);
    const modeChoisi = modes.find((m) => m.code === modeCode);
    const enLigne = modeChoisi?.enLigne === true;
    const bagagesAcceptes = offre?.bagagesAutorises !== false;

    const devisQuery = useQuery({
        queryKey: ['devis', uuid, nbAdultes, nbEnfants, bagages, modeCode],
        queryFn: async () =>
            (
                await api.commandes.devis({
                    offreUuid: uuid,
                    nombreAdultes: nbAdultes,
                    nombreEnfants: nbEnfants,
                    nombreBagages: bagages,
                    modeReglementCode: modeCode || undefined
                })
            ).data.devis,
        enabled: !!uuid && nbAdultes >= 1,
        placeholderData: keepPreviousData
    });
    const devis = devisQuery.data;
    const ageAdulte = devis?.ageAdulteMinimum ?? AGE_ADULTE_DEFAUT;
    const jourVoyage = jourIso(offre?.dateDepart);

    function erreurNaissance(p: PassagerForm): string | null {
        if (p.typePassager !== 'ENFANT' || p.naissance.length < 10) return null;
        const iso = isoDepuisSaisie(p.naissance);
        if (!iso) return 'Date invalide : JJ/MM/AAAA';
        if (!jourVoyage) return null;
        if (estEnfant(iso, jourVoyage, ageAdulte) === false) {
            return `Âge maximum : ${ageAdulte - 1} ans le jour du voyage. Inscrivez ce passager comme adulte.`;
        }
        return null;
    }

    const passagersValides = passagers.every(
        (p) => p.nom.trim() && p.prenom.trim() && (p.typePassager === 'ADULTE' || (isoDepuisSaisie(p.naissance) !== null && erreurNaissance(p) === null))
    );
    const formulaireValide = modeCode !== '' && nbAdultes >= 1 && passagersValides && contactTelephone.trim() !== '' && !!devis && !devisQuery.isError;

    /** Réserver engage : c'est ici, et seulement ici, qu'un compte devient nécessaire. */
    function confirmer() {
        if (!user) {
            ecrireBrouillon(uuid, { passagers, bagages, sieges, contactEmail, contactTelephone, modeCode });
            router.push({ pathname: '/connexion', params: { suite: chemin } });
            return;
        }
        reserver.mutate();
    }

    const reserver = useMutation({
        mutationFn: async () =>
            (
                await api.commandes.create({
                    offreUuid: uuid,
                    passagers: passagers.map((p, i) => ({
                        nom: p.nom.trim(),
                        prenom: p.prenom.trim(),
                        telephone: p.telephone.trim() || undefined,
                        pieceIdentite: p.pieceIdentite.trim() || undefined,
                        typePassager: p.typePassager,
                        dateNaissance: p.typePassager === 'ENFANT' ? (isoDepuisSaisie(p.naissance) ?? undefined) : undefined,
                        numeroSiege: siegesChoisis ? sieges[i] : undefined
                    })),
                    modeReglementCode: modeCode,
                    montantTotal: devis!.montantAPayer,
                    nombreBagages: bagages,
                    contactEmail: contactEmail.trim() || undefined,
                    contactTelephone: contactTelephone.trim()
                })
            ).data.commande,
        onSuccess: (commande: CommandeClient) => {
            effacerBrouillon(uuid);
            if (commande.urlPaiement && commande.referencePaiement) {
                router.replace({
                    pathname: '/paiement/[reference]',
                    params: { reference: commande.referencePaiement, url: commande.urlPaiement, mode: modeChoisi?.libelle ?? '' }
                });
                return;
            }
            router.replace({ pathname: '/commande/[uuid]', params: { uuid: commande.commandeUuid! } });
        }
    });

    if (offreQuery.isPending) return <Chargement />;
    if (offreQuery.isError || !offre) {
        return <EtatVide titre="Voyage introuvable" action={<Bouton libelle="Retour" variante="secondaire" onPress={() => router.back()} />} />;
    }

    function setPassager(i: number, champ: keyof PassagerForm, valeur: string) {
        setPassagers((prev) => prev.map((p, j) => (j === i ? { ...p, [champ]: valeur } : p)));
    }
    function ajouter(type: TypePassager) {
        setPassagers((prev) => [...prev, passagerVide(type)]);
        setSieges([]);
    }
    function retirer(i: number) {
        setPassagers((prev) => prev.filter((_, j) => j !== i));
        setSieges([]);
    }
    const siegesChoisis = sieges.length === passagers.length && sieges.length > 0;

    const messageErreur =
        reserver.error instanceof ApiError && reserver.error.message
            ? reserver.error.message
            : enLigne
              ? "Le paiement n'a pas pu être ouvert. Aucune place n'a été retenue, réessayez dans un instant."
              : 'La réservation a échoué. Vérifiez les places disponibles et réessayez.';
    const erreurDevis = devisQuery.error instanceof ApiError && devisQuery.error.message ? devisQuery.error.message : "Le prix n'a pas pu être calculé. Vérifiez votre réseau.";

    return (
        <KeyboardAvoidingView style={base.ecran} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={base.contenu} keyboardShouldPersistTaps="handled">
                <Carte style={{ gap: espaces.xs }}>
                    <Text style={base.gras}>
                        {offre.villeDepartLibelle} → {offre.villeArriveeLibelle}
                    </Text>
                    <Text style={base.attenue}>
                        {formatDateCourte(offre.dateDepart)} à {formatHeure(offre.heureDepart)} · {offre.siteDepart} → {offre.siteArrivee}
                    </Text>
                </Carte>

                <Etape numero={1} titre="Passagers" />
                {passagers.map((p, i) => {
                    const enfant = p.typePassager === 'ENFANT';
                    const seulAdulte = !enfant && nbAdultes === 1;
                    const erreurDate = erreurNaissance(p);
                    return (
                        <Carte key={i}>
                            <View style={[base.ligne, { marginBottom: espaces.md }]}>
                                <Text style={base.gras}>
                                    {i + 1}. {enfant ? 'Enfant' : 'Adulte'}
                                </Text>
                                {passagers.length > 1 && !seulAdulte && (
                                    <Pressable accessibilityRole="button" onPress={() => retirer(i)}>
                                        <Text style={{ color: couleurs.danger, fontWeight: '600' }}>Retirer</Text>
                                    </Pressable>
                                )}
                            </View>
                            <Champ libelle="Prénom *" value={p.prenom} onChangeText={(v) => setPassager(i, 'prenom', v)} autoCapitalize="words" autoComplete="given-name" />
                            <Champ libelle="Nom *" value={p.nom} onChangeText={(v) => setPassager(i, 'nom', v)} autoCapitalize="words" autoComplete="family-name" />
                            {enfant ? (
                                <Champ
                                    libelle="Date de naissance *"
                                    value={p.naissance}
                                    onChangeText={(v) => setPassager(i, 'naissance', formaterSaisieDate(v))}
                                    keyboardType="number-pad"
                                    placeholder="JJ/MM/AAAA"
                                    maxLength={10}
                                    erreur={erreurDate}
                                />
                            ) : (
                                <>
                                    <Champ
                                        libelle="Téléphone"
                                        value={p.telephone}
                                        onChangeText={(v) => setPassager(i, 'telephone', v)}
                                        keyboardType="phone-pad"
                                        autoComplete="tel"
                                        placeholder="+224 6XX XX XX XX"
                                    />
                                    <Champ libelle="Pièce d'identité" value={p.pieceIdentite} onChangeText={(v) => setPassager(i, 'pieceIdentite', v)} />
                                </>
                            )}
                        </Carte>
                    );
                })}
                {passagers.length < maxPassagers && (
                    <View style={styles.ajouts}>
                        <Bouton libelle="+ Adulte" variante="secondaire" onPress={() => ajouter('ADULTE')} style={{ flex: 1 }} />
                        <Bouton libelle={`+ Enfant (moins de ${ageAdulte} ans)`} variante="secondaire" onPress={() => ajouter('ENFANT')} style={{ flex: 1 }} />
                    </View>
                )}

                <Etape numero={2} titre="Sièges" />
                <Pressable accessibilityRole="button" onPress={() => setChoixSieges(true)}>
                    <Carte style={styles.siegesLigne}>
                        <View style={{ flex: 1 }}>
                            <Text style={base.gras}>{siegesChoisis ? `Sièges ${[...sieges].sort((a, b) => Number(a) - Number(b)).join(', ')}` : 'Choisir les sièges'}</Text>
                            <Text style={base.attenue}>{siegesChoisis ? 'Toucher pour modifier' : 'Sinon, nous vous attribuons les premiers sièges libres, sans frais.'}</Text>
                        </View>
                        <Text style={styles.chevron}>›</Text>
                    </Carte>
                </Pressable>

                <Etape numero={3} titre="Bagages" />
                <Carte>
                    <Text style={base.gras}>Inclus</Text>
                    <Text style={base.attenue}>
                        {devis?.bagagesInclus ?? passagers.length * (offre.bagagesInclusParPassager ?? 1)} bagage{(devis?.bagagesInclus ?? 1) > 1 ? 's' : ''} en soute pour{' '}
                        {passagers.length} passager{passagers.length > 1 ? 's' : ''}, et le sac que chacun garde avec lui.
                    </Text>
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
                        <Bandeau type="info">Pas de bagage supplémentaire sur ce voyage.</Bandeau>
                    )}
                </Carte>

                <Etape numero={4} titre="Contact" />
                <Carte>
                    <Text style={[base.attenue, { marginBottom: espaces.md }]}>Pour vous prévenir d'un retard ou d'un changement de départ.</Text>
                    <Champ
                        libelle="Email"
                        value={contactEmail}
                        onChangeText={setContactEmail}
                        autoCapitalize="none"
                        autoComplete="email"
                        keyboardType="email-address"
                        autoCorrect={false}
                        spellCheck={false}
                    />
                    <Champ libelle="Téléphone *" value={contactTelephone} onChangeText={setContactTelephone} keyboardType="phone-pad" autoComplete="tel" placeholder="+224 6XX XX XX XX" />
                </Carte>

                <Etape numero={5} titre="Règlement" />
                {modesQuery.isError && <Bandeau type="erreur">Impossible de charger les modes de règlement.</Bandeau>}
                <View style={styles.modes}>
                    {modes.map((m) => (
                        <Pressable
                            key={m.code}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: modeCode === m.code }}
                            onPress={() => setModeCode(m.code ?? '')}
                            style={[styles.mode, modeCode === m.code && styles.modeActif]}
                        >
                            <Text style={[styles.modeTexte, modeCode === m.code && styles.modeTexteActif]}>{m.libelle}</Text>
                        </Pressable>
                    ))}
                </View>
                {modeChoisi && (
                    <Bandeau type="info">
                        {enLigne
                            ? `Vous serez redirigé vers ${modeChoisi.libelle} pour régler. Vos billets sont émis dès que le paiement est confirmé.`
                            : 'Règlement sur place, au départ. Vos billets sont émis immédiatement.'}
                    </Bandeau>
                )}

                <Text style={base.sectionTitre}>Votre commande</Text>
                <Carte style={{ gap: espaces.sm }}>
                    {devis ? (
                        <>
                            {devis.lignes.map((l) => (
                                <View key={l.code} style={base.ligne}>
                                    <Text style={[base.attenue, { flexShrink: 1 }]}>
                                        {l.quantite > 1 ? `${l.quantite} × ` : ''}
                                        {l.libelle}
                                        {l.quantite > 1 ? ` (${formatMontant(l.montantUnitaire, devis.devise)})` : ''}
                                    </Text>
                                    <Text style={base.gras}>{formatMontant(l.montant, devis.devise)}</Text>
                                </View>
                            ))}
                            <View style={[base.ligne, styles.totalLigne]}>
                                <Text style={base.gras}>Total à payer</Text>
                                <Text style={styles.total}>{formatMontant(devis.montantAPayer, devis.devise)}</Text>
                            </View>
                        </>
                    ) : devisQuery.isError ? (
                        <Bandeau type="erreur">{erreurDevis}</Bandeau>
                    ) : (
                        <Text style={base.attenue}>Calcul du prix…</Text>
                    )}
                </Carte>

                {reserver.isError && <Bandeau type="erreur">{messageErreur}</Bandeau>}
                {!user && formulaireValide && (
                    <Bandeau type="info">Encore une étape : connectez-vous pour recevoir vos billets. Ce que vous avez saisi est conservé.</Bandeau>
                )}
                <Bouton
                    libelle={!user ? 'Continuer' : enLigne ? 'Payer maintenant' : 'Confirmer la réservation'}
                    onPress={confirmer}
                    desactive={!formulaireValide}
                    enCours={reserver.isPending}
                />
            </ScrollView>
            <SelecteurSieges
                offreUuid={uuid}
                nombre={passagers.length}
                choisis={sieges}
                visible={choixSieges}
                onConfirmer={(choix) => {
                    setSieges(choix);
                    setChoixSieges(false);
                }}
                onIgnorer={() => {
                    setSieges([]);
                    setChoixSieges(false);
                }}
                onFermer={() => setChoixSieges(false)}
            />
        </KeyboardAvoidingView>
    );
}

/** Les étapes sont une suite : le numéro dit où l'on en est. */
function Etape({ numero, titre }: { numero: number; titre: string }) {
    return (
        <View style={styles.etape}>
            <View style={styles.etapeNumero}>
                <Text style={styles.etapeNumeroTexte}>{numero}</Text>
            </View>
            <Text style={styles.etapeTitre}>{titre}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    etape: { flexDirection: 'row', alignItems: 'center', gap: espaces.md, marginTop: espaces.sm },
    etapeNumero: { width: 28, height: 28, borderRadius: 14, backgroundColor: couleurs.vert, alignItems: 'center', justifyContent: 'center' },
    etapeNumeroTexte: { color: couleurs.blanc, fontWeight: '700' },
    etapeTitre: { ...texte.section, color: couleurs.encre },
    ajouts: { flexDirection: 'row', gap: espaces.sm },
    siegesLigne: { flexDirection: 'row', alignItems: 'center', gap: espaces.md },
    chevron: { fontSize: 26, color: couleurs.gris, lineHeight: 28 },
    modes: { flexDirection: 'row', flexWrap: 'wrap', gap: espaces.sm },
    mode: { paddingHorizontal: espaces.lg, paddingVertical: espaces.md, borderRadius: rayons.md, borderWidth: 1, borderColor: couleurs.ligne, backgroundColor: couleurs.blanc },
    modeActif: { borderColor: couleurs.vert, backgroundColor: couleurs.vertPale },
    modeTexte: { color: couleurs.encre, fontWeight: '600' },
    modeTexteActif: { color: couleurs.vertFonce },
    totalLigne: { borderTopWidth: 1, borderTopColor: couleurs.ligne, paddingTop: espaces.sm, marginTop: espaces.xs },
    total: { ...texte.chiffre, color: couleurs.vert }
});
