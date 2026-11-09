import { ApiError } from '@sira/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ajouterJours,
    aujourdhuiIso,
    formatDateCourte,
    MOTIFS_SIGNALEMENT,
    TYPES_DEMANDE_CONTACT,
    type MotifSignalement,
    type TypeDemandeContact
} from '@sira/core';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../api';
import { Bandeau, Bouton, ChampChoix, styles as base } from '../ui/base';
import { Calendrier } from '../ui/calendrier';
import { FeuilleBasse } from '../ui/feuille';
import { couleurs, espaces, texte, zoomMax } from '../ui/theme';

/**
 * Entrer en relation depuis la fiche d'un bien : écrire au publieur, demander
 * une visite, signaler l'annonce. Trois feuilles courtes, une session requise
 * (la fiche s'en assure avant de les ouvrir), et le serveur garde la trace :
 * tout se retrouve dans l'onglet Demandes.
 */

/** Jusqu'où l'on peut demander une visite : au-delà, l'annonce aura souvent changé. */
const JOURS_VISITE = 60;
const HEURES_VISITE = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

/** Le message du serveur quand il en a un (règle métier), sinon le nôtre. */
export function messageErreur(e: unknown, defaut: string): string {
    return e instanceof ApiError && e.message ? e.message : defaut;
}

interface PropsFeuille {
    visible: boolean;
    proprieteUuid: string;
    onFermer: () => void;
    /** Appelé après l'envoi réussi, avec la phrase à montrer sur la fiche. */
    onEnvoye: (confirmation: string) => void;
}

export function FeuilleContact({ visible, proprieteUuid, onFermer, onEnvoye }: PropsFeuille) {
    const queryClient = useQueryClient();
    const [type, setType] = useState<TypeDemandeContact>('INFO');
    const [message, setMessage] = useState('');

    const envoi = useMutation({
        mutationFn: async () => (await api.immo.clientSide.contacter(proprieteUuid, { message: message.trim(), typeDemande: type })).data,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['mes-demandes'] });
            setMessage('');
            onEnvoye('Message envoyé. Le publieur a vos coordonnées et vous répondra directement ; retrouvez cet échange dans Demandes.');
        }
    });

    return (
        <FeuilleBasse
            visible={visible}
            titre="Contacter"
            onFermer={onFermer}
            pied={<Bouton libelle="Envoyer" onPress={() => envoi.mutate()} desactive={message.trim().length < 10} enCours={envoi.isPending} />}
        >
            <Text style={base.sectionTitre}>Vous souhaitez</Text>
            <View style={styles.puces}>
                {TYPES_DEMANDE_CONTACT.map((t) => (
                    <Puce key={t.valeur} libelle={t.libelle} actif={type === t.valeur} onPress={() => setType(t.valeur)} />
                ))}
            </View>
            <Text style={base.sectionTitre}>Votre message</Text>
            <View style={[base.choix, styles.zoneTexte]}>
                <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Bonjour, ce bien est-il toujours disponible ? Je peux passer le voir cette semaine."
                    placeholderTextColor={couleurs.gris}
                    multiline
                    maxLength={2000}
                    accessibilityLabel="Votre message"
                    style={styles.saisieLongue}
                />
            </View>
            <Text style={base.attenue}>Votre nom et votre téléphone sont transmis avec le message ; vous n'avez rien à ajouter. Dix caractères au moins.</Text>
            {envoi.isError && <Bandeau type="erreur">{messageErreur(envoi.error, "L'envoi a échoué. Vérifiez votre réseau puis réessayez.")}</Bandeau>}
        </FeuilleBasse>
    );
}

export function FeuilleVisite({ visible, proprieteUuid, onFermer, onEnvoye }: PropsFeuille) {
    const queryClient = useQueryClient();
    const aujourdhui = aujourdhuiIso();
    const [date, setDate] = useState(ajouterJours(aujourdhui, 1));
    const [heure, setHeure] = useState<string | null>('10:00');
    const [notes, setNotes] = useState('');
    const [choixDate, setChoixDate] = useState(false);

    const envoi = useMutation({
        mutationFn: async () =>
            (await api.immo.clientSide.demanderVisite(proprieteUuid, { dateVisite: date, ...(heure ? { heureVisite: heure } : {}), ...(notes.trim() ? { notesVisiteur: notes.trim() } : {}) }))
                .data,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['mes-demandes'] });
            setNotes('');
            onEnvoye(`Visite demandée pour le ${formatDateCourte(date)}${heure ? ` à ${heure}` : ''}. Le publieur la confirme ; vous serez prévenu dans Demandes.`);
        }
    });

    return (
        <FeuilleBasse
            visible={visible}
            titre="Demander une visite"
            onFermer={onFermer}
            pied={<Bouton libelle="Demander" onPress={() => envoi.mutate()} enCours={envoi.isPending} />}
        >
            {choixDate ? (
                <Calendrier
                    valeur={date}
                    min={aujourdhui}
                    max={ajouterJours(aujourdhui, JOURS_VISITE)}
                    aide="Le publieur confirme la date, ou vous en propose une autre."
                    onChoisir={(d) => {
                        setDate(d);
                        setChoixDate(false);
                    }}
                />
            ) : (
                <>
                    <ChampChoix libelle="Date" valeur={formatDateCourte(date)} onPress={() => setChoixDate(true)} />
                    <Text style={base.sectionTitre}>Heure</Text>
                    <View style={styles.puces}>
                        {HEURES_VISITE.map((h) => (
                            <Puce key={h} libelle={h} actif={heure === h} onPress={() => setHeure(heure === h ? null : h)} />
                        ))}
                    </View>
                    <Text style={base.attenue}>Sans heure, le publieur en proposera une.</Text>
                    <View style={[base.choix, styles.zoneTexte]}>
                        <Text style={base.choixLibelle}>Un mot pour le publieur, si besoin</Text>
                        <TextInput
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Facultatif"
                            placeholderTextColor={couleurs.gris}
                            multiline
                            maxLength={1000}
                            accessibilityLabel="Un mot pour le publieur"
                            style={styles.saisieLongue}
                        />
                    </View>
                    {envoi.isError && <Bandeau type="erreur">{messageErreur(envoi.error, "La demande n'a pas pu partir. Vérifiez votre réseau puis réessayez.")}</Bandeau>}
                </>
            )}
        </FeuilleBasse>
    );
}

export function FeuilleSignalement({ visible, proprieteUuid, onFermer, onEnvoye }: PropsFeuille) {
    const [motif, setMotif] = useState<MotifSignalement | null>(null);
    const [description, setDescription] = useState('');

    const envoi = useMutation({
        mutationFn: async () => (await api.immo.clientSide.signaler(proprieteUuid, { motif: motif!, ...(description.trim() ? { description: description.trim() } : {}) })).data,
        onSuccess: () => {
            setDescription('');
            setMotif(null);
            onEnvoye("Merci. L'annonce est signalée ; une personne de SYNERGIA la relit et décide.");
        }
    });

    return (
        <FeuilleBasse
            visible={visible}
            titre="Signaler cette annonce"
            onFermer={onFermer}
            pied={<Bouton libelle="Signaler" variante="danger" onPress={() => envoi.mutate()} desactive={!motif} enCours={envoi.isPending} />}
        >
            <Text style={base.sectionTitre}>Que se passe-t-il ?</Text>
            <View style={{ gap: espaces.sm }}>
                {MOTIFS_SIGNALEMENT.map((m) => (
                    <Pressable key={m.valeur} accessibilityRole="radio" accessibilityState={{ checked: motif === m.valeur }} onPress={() => setMotif(m.valeur)} style={[styles.option, motif === m.valeur && styles.optionActive]}>
                        <Text style={[styles.optionTexte, motif === m.valeur && { color: couleurs.vertFonce }]}>{m.libelle}</Text>
                    </Pressable>
                ))}
            </View>
            <View style={[base.choix, styles.zoneTexte]}>
                <Text style={base.choixLibelle}>Précisions, si vous en avez</Text>
                <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Facultatif"
                    placeholderTextColor={couleurs.gris}
                    multiline
                    maxLength={2000}
                    accessibilityLabel="Précisions sur le signalement"
                    style={styles.saisieLongue}
                />
            </View>
            {envoi.isError && <Bandeau type="erreur">{messageErreur(envoi.error, "Le signalement n'a pas pu partir. Vérifiez votre réseau puis réessayez.")}</Bandeau>}
        </FeuilleBasse>
    );
}

function Puce({ libelle, actif, onPress }: { libelle: string; actif: boolean; onPress: () => void }) {
    return (
        <Pressable accessibilityRole="button" accessibilityState={{ selected: actif }} onPress={onPress} style={[styles.puce, actif && styles.puceActive]}>
            <Text maxFontSizeMultiplier={zoomMax} style={[styles.puceTexte, actif && styles.puceTexteActif]}>
                {libelle}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    puces: { flexDirection: 'row', flexWrap: 'wrap', gap: espaces.sm },
    puce: { borderWidth: 1, borderColor: couleurs.ligne, borderRadius: 999, paddingVertical: 9, paddingHorizontal: 14, backgroundColor: couleurs.blanc, minHeight: 44, justifyContent: 'center' },
    puceActive: { borderColor: couleurs.vert, backgroundColor: couleurs.vertPale },
    puceTexte: { ...texte.libelle, color: couleurs.encre },
    puceTexteActif: { color: couleurs.vertFonce },
    zoneTexte: { minHeight: 120, justifyContent: 'flex-start' },
    saisieLongue: { ...texte.corps, color: couleurs.encre, padding: 0, marginTop: 2, minHeight: 88, textAlignVertical: 'top' },
    option: { borderWidth: 1, borderColor: couleurs.ligne, borderRadius: 12, padding: espaces.md, backgroundColor: couleurs.blanc, minHeight: 48, justifyContent: 'center' },
    optionActive: { borderColor: couleurs.vert, backgroundColor: couleurs.vertPale },
    optionTexte: { ...texte.appuye, color: couleurs.encre }
});
