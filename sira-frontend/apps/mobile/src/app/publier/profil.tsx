import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TYPES_PROFIL_IMMO, type TypeProfilImmo } from '@sira/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { api } from '../../api';
import { useAuth } from '../../auth/contexte';
import { ExigerSession } from '../../auth/exiger-session';
import { messageErreur } from '../../immo/feuilles-relation';
import { Bandeau, Bouton, Carte, styles as base } from '../../ui/base';
import { ChampSaisie } from '../../ui/formulaire';
import { couleurs, espaces, rayons, texte } from '../../ui/theme';

/**
 * Avant la première annonce : dire à quel titre on publie. Une seule fois ;
 * la vérification du profil se fait ensuite par SYNERGIA, et les premières
 * annonces passent par une relecture en attendant.
 */
function ProfilEcran() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [type, setType] = useState<TypeProfilImmo>('PROPRIETAIRE_SIMPLE');
    const [telephone, setTelephone] = useState(user?.phone ?? '');
    const [bio, setBio] = useState('');

    const creation = useMutation({
        mutationFn: async () => (await api.immo.clientSide.creerProfil({ typeProfil: type, ...(telephone.trim() ? { telephoneContact: telephone.trim() } : {}), ...(bio.trim() ? { bio: bio.trim() } : {}) })).data.profil,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['profil-immo'] });
            router.replace({ pathname: '/publier/[brouillon]', params: { brouillon: 'nouveau' } });
        }
    });

    return (
        <ScrollView style={base.ecran} contentContainerStyle={base.contenu} keyboardShouldPersistTaps="handled">
            <Text style={base.sousTitre}>Une fois pour toutes : à quel titre publiez-vous ? Les visiteurs le verront sur vos annonces.</Text>
            <Carte style={{ gap: espaces.sm }}>
                {TYPES_PROFIL_IMMO.map((t) => (
                    <Pressable key={t.valeur} accessibilityRole="radio" accessibilityState={{ checked: type === t.valeur }} onPress={() => setType(t.valeur)} style={[styles.carteChoix, type === t.valeur && styles.carteChoixActive]}>
                        <Text style={styles.choixTitre}>{t.libelle}</Text>
                        <Text style={base.attenue}>{t.aide}</Text>
                    </Pressable>
                ))}
            </Carte>
            <Carte style={{ gap: espaces.sm }}>
                <ChampSaisie libelle="Téléphone de contact" valeur={telephone} onChange={setTelephone} attendu="+224 6XX XX XX XX" clavier="telephone" />
                <ChampSaisie libelle="Quelques mots sur vous" valeur={bio} onChange={setBio} attendu="Facultatif. Depuis quand vous louez, vos quartiers…" multiligne longueurMax={2000} />
            </Carte>
            {creation.isError && <Bandeau type="erreur">{messageErreur(creation.error, "Le profil n'a pas pu être créé. Vérifiez votre réseau puis réessayez.")}</Bandeau>}
            <Bouton libelle="Continuer" onPress={() => creation.mutate()} desactive={telephone.trim().length < 8} enCours={creation.isPending} />
        </ScrollView>
    );
}

export default function Ecran() {
    return (
        <ExigerSession>
            <ProfilEcran />
        </ExigerSession>
    );
}

const styles = StyleSheet.create({
    carteChoix: { borderWidth: 2, borderColor: couleurs.ligne, borderRadius: rayons.md, padding: espaces.md, gap: 2 },
    carteChoixActive: { borderColor: couleurs.vert, backgroundColor: couleurs.vertPale },
    choixTitre: { ...texte.appuye, color: couleurs.encre }
});
