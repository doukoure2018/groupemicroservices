import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PERIODES_PRIX, type Commodite, type DonneesBrouillon, type DureeLocation, type PeriodePrix, type TypeBien } from '@sira/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { api } from '../../api';
import { useAuth } from '../../auth/contexte';
import { ExigerSession } from '../../auth/exiger-session';
import { messageErreur } from '../../immo/feuilles-relation';
import { ETAPES, manquesEtape, nombreDepuis } from '../../immo/publication';
import { Bandeau, Bouton, Carte, ChampChoix, Chargement, EtatVide, styles as base } from '../../ui/base';
import { FeuilleBasse } from '../../ui/feuille';
import { ChampSaisie, Option, Puce, Puces } from '../../ui/formulaire';
import { couleurs, espaces, rayons, texte, zoomMax } from '../../ui/theme';

/**
 * Publier un bien en quatre étapes : le bien, où, prix et détails, l'annonce.
 * Chaque « Suivant » enregistre le brouillon sur le serveur, donc on peut
 * s'arrêter et reprendre d'un autre téléphone. La dernière étape crée
 * l'annonce ; les photos et la publication suivent sur l'écran suivant.
 */
function AssistantEcran() {
    const { brouillon: param } = useLocalSearchParams<{ brouillon: string }>();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [uuid, setUuid] = useState<string | null>(param && param !== 'nouveau' ? param : null);
    const [etape, setEtape] = useState(1);
    const [d, setD] = useState<DonneesBrouillon>({});
    const [pret, setPret] = useState(param === 'nouveau');
    const [manques, setManques] = useState<string[]>([]);
    const [feuille, setFeuille] = useState<'type' | null>(null);

    const existant = useQuery({ queryKey: ['brouillon', uuid], queryFn: async () => (await api.immo.clientSide.brouillon(uuid!)).data.brouillon, enabled: !!uuid && !pret });
    useEffect(() => {
        if (existant.data && !pret) {
            setD(existant.data.donneesJson ?? {});
            setEtape(Math.min(4, Math.max(1, existant.data.etapeActuelle || 1)));
            setPret(true);
        }
    }, [existant.data, pret]);

    const typesBien = useQuery({ queryKey: ['types-bien'], queryFn: async () => (await api.immo.proprietes.typesBien()).data.types ?? [] });
    const commodites = useQuery({ queryKey: ['commodites'], queryFn: async () => (await api.immo.proprietes.commodites()).data.commodites ?? [] });

    const sauvegarde = useMutation({
        mutationFn: async (etapeActuelle: number) => {
            const corps = { etapeActuelle, donneesJson: d };
            if (uuid) return (await api.immo.clientSide.majBrouillon(uuid, corps)).data.brouillon;
            const cree = (await api.immo.clientSide.creerBrouillon(corps)).data.brouillon;
            setUuid(cree.brouillonUuid);
            router.setParams({ brouillon: cree.brouillonUuid });
            return cree;
        },
        onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['mes-brouillons'] })
    });
    const creation = useMutation({
        mutationFn: async () => {
            const b = await sauvegarde.mutateAsync(4);
            return (await api.immo.clientSide.materialiserBrouillon(b.brouillonUuid)).data.propriete;
        },
        onSuccess: (p) => {
            void queryClient.invalidateQueries({ queryKey: ['mes-annonces'] });
            void queryClient.invalidateQueries({ queryKey: ['mes-brouillons'] });
            router.replace({ pathname: '/publier/photos/[uuid]', params: { uuid: p.proprieteUuid } });
        }
    });

    // Un seul point de mise à jour par étape, pour garder la forme que le serveur attend.
    const maj = <K extends keyof DonneesBrouillon>(cle: K, valeurs: Partial<NonNullable<DonneesBrouillon[K]>>) => setD((prev) => ({ ...prev, [cle]: { ...(prev[cle] ?? {}), ...valeurs } }));

    function suivant() {
        const m = manquesEtape(etape, d);
        setManques(m);
        if (m.length) return;
        if (etape < 4) {
            void sauvegarde.mutateAsync(etape + 1).then(() => setEtape(etape + 1)).catch(() => undefined);
        } else {
            creation.mutate();
        }
    }
    function quitter() {
        void sauvegarde.mutateAsync(etape).finally(() => router.back());
    }

    if (!pret) {
        if (existant.isError) return <EtatVide titre="Brouillon introuvable" texte="Il a peut-être été supprimé ou déjà publié." action={<Bouton libelle="Mes annonces" onPress={() => router.replace('/mes-annonces')} />} />;
        return <Chargement texte="Ouverture du brouillon…" />;
    }

    const e1 = d.etape1 ?? {};
    const e2 = d.etape2 ?? {};
    const e3 = d.etape3 ?? {};
    const e4 = d.etape4 ?? {};
    const location = e1.typeAnnonce === 'LOCATION';
    const courante = ETAPES[etape - 1]!;
    const erreur = sauvegarde.isError ? sauvegarde.error : creation.isError ? creation.error : null;

    return (
        <>
            <ScrollView style={base.ecran} contentContainerStyle={base.contenu} keyboardShouldPersistTaps="handled">
                <View style={{ gap: espaces.xs }}>
                    <Text style={base.attenue}>
                        Étape {etape} sur 4 · {courante.titre}
                    </Text>
                    <View style={styles.barre}>
                        {ETAPES.map((s) => (
                            <View key={s.numero} style={[styles.segment, s.numero <= etape && styles.segmentFait]} />
                        ))}
                    </View>
                    <Text maxFontSizeMultiplier={zoomMax} style={base.titre}>
                        {courante.question}
                    </Text>
                </View>

                {etape === 1 && (
                    <Carte style={{ gap: espaces.md }}>
                        <Puces>
                            <Puce role="radio" libelle="Louer" actif={e1.typeAnnonce === 'LOCATION'} onPress={() => { maj('etape1', { typeAnnonce: 'LOCATION' }); maj('etape3', { periode: e3.periode ?? 'PAR_MOIS' }); }} />
                            <Puce role="radio" libelle="Vendre" actif={e1.typeAnnonce === 'VENTE'} onPress={() => { maj('etape1', { typeAnnonce: 'VENTE', dureeLocation: undefined }); maj('etape3', { periode: 'UNIQUE' }); }} />
                        </Puces>
                        {location && (
                            <>
                                <Text style={base.sectionTitre}>Pour combien de temps</Text>
                                <Puces>
                                    <Puce role="radio" libelle="Longue durée" actif={e1.dureeLocation === 'LONG_SEJOUR'} onPress={() => maj('etape1', { dureeLocation: 'LONG_SEJOUR' as DureeLocation })} />
                                    <Puce role="radio" libelle="Court séjour" actif={e1.dureeLocation === 'COURT_SEJOUR'} onPress={() => maj('etape1', { dureeLocation: 'COURT_SEJOUR' as DureeLocation })} />
                                </Puces>
                            </>
                        )}
                        <ChampChoix libelle="Type de bien" valeur={(typesBien.data ?? []).find((t) => t.code === e1.typeBienCode)?.libelle} vide="Choisir" onPress={() => setFeuille('type')} />
                    </Carte>
                )}

                {etape === 2 && (
                    <Carte style={{ gap: espaces.md }}>
                        <ChampSaisie libelle="Adresse" valeur={e2.adresseComplete ?? ''} onChange={(v) => maj('etape2', { adresseComplete: v })} attendu="Quartier, commune, ville. Par exemple : Kipé, Ratoma, Conakry" multiligne longueurMax={500} />
                        <View style={styles.ligneSwitch}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.switchTitre}>Afficher l'adresse exacte</Text>
                                <Text style={base.attenue}>Sinon, seuls le quartier et la commune apparaissent aux visiteurs.</Text>
                            </View>
                            <Switch value={!!e2.afficherAdresseExacte} onValueChange={(v) => maj('etape2', { afficherAdresseExacte: v })} trackColor={{ true: couleurs.vert, false: couleurs.ligne }} thumbColor={couleurs.blanc} accessibilityLabel="Afficher l'adresse exacte" />
                        </View>
                    </Carte>
                )}

                {etape === 3 && (
                    <>
                        <Carte style={{ gap: espaces.md }}>
                            <Text style={base.sectionTitre}>Le prix</Text>
                            <ChampSaisie libelle={location ? 'Loyer' : 'Prix'} valeur={e3.prix ? String(e3.prix) : ''} onChange={(v) => maj('etape3', { prix: nombreDepuis(v), devise: 'GNF' })} attendu="En GNF" clavier="numerique" />
                            {location && (
                                <Puces>
                                    {PERIODES_PRIX.filter((p) => p.valeur !== 'UNIQUE').map((p) => (
                                        <Puce key={p.valeur} role="radio" libelle={p.libelle} actif={(e3.periode ?? 'PAR_MOIS') === p.valeur} onPress={() => maj('etape3', { periode: p.valeur as PeriodePrix })} />
                                    ))}
                                </Puces>
                            )}
                            <View style={styles.ligneSwitch}>
                                <Text style={[styles.switchTitre, { flex: 1 }]}>Prix sur demande</Text>
                                <Switch value={!!e3.prixSurDemande} onValueChange={(v) => maj('etape3', { prixSurDemande: v })} trackColor={{ true: couleurs.vert, false: couleurs.ligne }} thumbColor={couleurs.blanc} accessibilityLabel="Prix sur demande" />
                            </View>
                            <View style={styles.ligneSwitch}>
                                <Text style={[styles.switchTitre, { flex: 1 }]}>Prix négociable</Text>
                                <Switch value={!!e3.prixNegociable} onValueChange={(v) => maj('etape3', { prixNegociable: v })} trackColor={{ true: couleurs.vert, false: couleurs.ligne }} thumbColor={couleurs.blanc} accessibilityLabel="Prix négociable" />
                            </View>
                            {location && (
                                <>
                                    <Text style={base.sectionTitre}>À l'entrée, en mois de loyer</Text>
                                    <Text style={base.attenue}>Caution</Text>
                                    <Puces>
                                        {[0, 1, 2, 3].map((n) => (
                                            <Puce key={n} role="radio" libelle={String(n)} actif={(e3.moisCaution ?? 0) === n} onPress={() => maj('etape3', { moisCaution: n })} />
                                        ))}
                                    </Puces>
                                    <Text style={base.attenue}>Avance</Text>
                                    <Puces>
                                        {[0, 1, 3, 6, 12].map((n) => (
                                            <Puce key={n} role="radio" libelle={String(n)} actif={(e3.moisAvance ?? 0) === n} onPress={() => maj('etape3', { moisAvance: n })} />
                                        ))}
                                    </Puces>
                                </>
                            )}
                        </Carte>
                        <Carte style={{ gap: espaces.md }}>
                            <Text style={base.sectionTitre}>Le bien</Text>
                            <Text style={base.attenue}>Chambres</Text>
                            <Puces>
                                {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                                    <Puce key={n} role="radio" libelle={String(n)} actif={(e3.nombreChambres ?? 0) === n} onPress={() => maj('etape3', { nombreChambres: n })} />
                                ))}
                            </Puces>
                            <Text style={base.attenue}>Salles de bain</Text>
                            <Puces>
                                {[0, 1, 2, 3, 4].map((n) => (
                                    <Puce key={n} role="radio" libelle={String(n)} actif={(e3.nombreSallesBain ?? 1) === n} onPress={() => maj('etape3', { nombreSallesBain: n })} />
                                ))}
                            </Puces>
                            <View style={styles.rangee}>
                                <ChampSaisie libelle="Surface" valeur={e3.surfaceM2 ? String(e3.surfaceM2) : ''} onChange={(v) => maj('etape3', { surfaceM2: nombreDepuis(v) })} attendu="En m²" clavier="decimal" style={{ flex: 1 }} />
                                <ChampSaisie libelle="Étage" valeur={e3.etageSituation != null ? String(e3.etageSituation) : ''} onChange={(v) => maj('etape3', { etageSituation: v.trim() === '' ? undefined : Number.parseInt(v, 10) || 0 })} attendu="Facultatif" clavier="numerique" style={{ flex: 1 }} />
                            </View>
                            <Text style={base.attenue}>Commodités</Text>
                            <Puces>
                                {(commodites.data ?? []).map((c: Commodite) => {
                                    const actives = e3.commoditesCodes ?? [];
                                    const actif = actives.includes(c.code);
                                    return <Puce key={c.code} libelle={c.libelle} actif={actif} onPress={() => maj('etape3', { commoditesCodes: actif ? actives.filter((x) => x !== c.code) : [...actives, c.code] })} />;
                                })}
                            </Puces>
                        </Carte>
                    </>
                )}

                {etape === 4 && (
                    <>
                        <Carte style={{ gap: espaces.md }}>
                            <ChampSaisie libelle="Titre de l'annonce" valeur={e4.titre ?? ''} onChange={(v) => maj('etape4', { titre: v })} attendu="Appartement 3 pièces à Kipé" longueurMax={200} />
                            <ChampSaisie libelle="Description" valeur={e4.description ?? ''} onChange={(v) => maj('etape4', { description: v })} attendu="Ce qui fait la différence : lumière, calme, eau, électricité, accès…" multiligne longueurMax={1500} />
                        </Carte>
                        <Carte style={{ gap: espaces.md }}>
                            <Text style={base.sectionTitre}>Comment vous joindre</Text>
                            <ChampSaisie libelle="Nom affiché sur l'annonce" valeur={e4.nomContactPublic ?? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()} onChange={(v) => maj('etape4', { nomContactPublic: v })} attendu="Votre nom, ou celui de votre agence" longueurMax={150} />
                            <ChampSaisie libelle="Téléphone" valeur={e4.telephoneContact ?? user?.phone ?? ''} onChange={(v) => maj('etape4', { telephoneContact: v })} attendu="+224 6XX XX XX XX" clavier="telephone" longueurMax={20} />
                            <Text style={base.attenue}>Ces deux informations sont visibles de tous sur l'annonce.</Text>
                        </Carte>
                    </>
                )}

                {manques.length > 0 && <Bandeau type="alerte">Il manque {manques.join(', ')}.</Bandeau>}
                {erreur && <Bandeau type="erreur">{messageErreur(erreur, "L'enregistrement a échoué. Vérifiez votre réseau puis réessayez.")}</Bandeau>}

                <Bouton libelle={etape < 4 ? 'Suivant' : "Créer l'annonce"} onPress={suivant} enCours={sauvegarde.isPending || creation.isPending} />
                <View style={styles.rangee}>
                    {etape > 1 && <Bouton libelle="Précédent" variante="discret" onPress={() => setEtape(etape - 1)} style={{ flex: 1 }} />}
                    <Bouton libelle="Enregistrer et quitter" variante="discret" onPress={quitter} style={{ flex: 1 }} />
                </View>
            </ScrollView>

            <FeuilleBasse visible={feuille === 'type'} titre="Type de bien" onFermer={() => setFeuille(null)}>
                {typesBien.isPending && <Text style={base.attenue}>Chargement…</Text>}
                {(typesBien.data ?? []).map((t: TypeBien) => (
                    <Option key={t.code ?? String(t.typeBienId)} libelle={t.libelle ?? ''} actif={e1.typeBienCode === t.code} onPress={() => { maj('etape1', { typeBienCode: t.code }); setFeuille(null); }} />
                ))}
            </FeuilleBasse>
        </>
    );
}

export default function Ecran() {
    return (
        <ExigerSession>
            <AssistantEcran />
        </ExigerSession>
    );
}

const styles = StyleSheet.create({
    barre: { flexDirection: 'row', gap: 4 },
    segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: couleurs.ligne },
    segmentFait: { backgroundColor: couleurs.vert },
    rangee: { flexDirection: 'row', gap: espaces.sm },
    ligneSwitch: { flexDirection: 'row', alignItems: 'center', gap: espaces.md },
    switchTitre: { ...texte.appuye, color: couleurs.encre },
    rayon: { borderRadius: rayons.md }
});
