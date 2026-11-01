import { useMutation } from '@tanstack/react-query';
import { ApiError } from '@sira/api-client';
import { formatDateFr, formatHeure, formatMontant, getStatutCommandeLabel, libelleVoyageurs, type BilletClient, type CommandeClient } from '@sira/core';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { api } from '../api';
import { Bandeau, Bouton, Carte, Champ, styles as base } from '../ui/base';
import { couleurs, espaces } from '../ui/theme';

/**
 * Retrouver ses billets sans compte : le numéro de la confirmation et le
 * contact laissé à la réservation suffisent. Le serveur ne dit jamais si
 * c'est le numéro ou le contact qui ne va pas — sans quoi on pourrait
 * apprendre qu'une réservation existe chez quelqu'un d'autre.
 */
export default function ReservationConsultation() {
    const [numero, setNumero] = useState('');
    const [contact, setContact] = useState('');

    const recherche = useMutation({
        mutationFn: async () => (await api.commandes.consultation(numero.trim(), contact.trim())).data.commande
    });

    const valide = numero.trim().length >= 6 && contact.trim().length >= 6;
    const commande = recherche.data;

    if (commande) return <Reservation commande={commande} onRecommencer={() => recherche.reset()} />;

    return (
        <KeyboardAvoidingView style={base.ecran} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={base.contenu} keyboardShouldPersistTaps="handled">
                <Text style={base.sousTitre}>
                    Le numéro figure sur la confirmation que nous vous avons envoyée. Le contact est celui que vous avez laissé en réservant.
                </Text>
                <Carte>
                    <Champ
                        libelle="Numéro de réservation *"
                        value={numero}
                        onChangeText={(v) => setNumero(v.toUpperCase())}
                        autoCapitalize="characters"
                        autoCorrect={false}
                        placeholder="CMD-20261101-000012"
                    />
                    <Champ
                        libelle="E-mail ou numéro de téléphone *"
                        value={contact}
                        onChangeText={setContact}
                        autoCapitalize="none"
                        autoCorrect={false}
                        spellCheck={false}
                        placeholder="nom@email.com ou +224 6XX XX XX XX"
                    />
                    {recherche.isError && (
                        <Bandeau type="erreur">
                            {recherche.error instanceof ApiError && recherche.error.message
                                ? recherche.error.message
                                : 'La recherche a échoué. Vérifiez votre réseau puis réessayez.'}
                        </Bandeau>
                    )}
                    <Bouton
                        libelle="Rechercher une réservation"
                        onPress={() => recherche.mutate()}
                        desactive={!valide}
                        enCours={recherche.isPending}
                        style={{ marginTop: espaces.md }}
                    />
                </Carte>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function Reservation({ commande, onRecommencer }: { commande: CommandeClient; onRecommencer: () => void }) {
    const billets = commande.billets ?? [];
    const utilisables = commande.statut !== 'EN_ATTENTE' && commande.statut !== 'ANNULEE';

    return (
        <ScrollView style={base.ecran} contentContainerStyle={base.contenu}>
            <View>
                <Text style={base.titre}>
                    {commande.villeDepartLibelle} → {commande.villeArriveeLibelle}
                </Text>
                <Text style={base.sousTitre}>
                    {formatDateFr(commande.dateDepart)} à {formatHeure(commande.heureDepart)}
                </Text>
            </View>

            <Carte style={{ gap: espaces.xs }}>
                <Text style={base.gras}>Commande {commande.numeroCommande}</Text>
                <Text style={base.attenue}>
                    {getStatutCommandeLabel(commande.statut)} ·{' '}
                    {libelleVoyageurs({
                        adultes: commande.nombreAdultes ?? commande.nombrePlaces ?? 1,
                        enfants: commande.nombreEnfants ?? 0,
                        bagages: commande.nombreBagages ?? 0
                    })}{' '}
                    · {formatMontant(commande.montantPaye ?? commande.montantTotal, commande.devise)}
                </Text>
                {commande.siteDepart && (
                    <Text style={base.attenue}>
                        {commande.siteDepart} → {commande.siteArrivee}
                    </Text>
                )}
            </Carte>

            {!utilisables ? (
                <Bandeau type="alerte">
                    {commande.statut === 'ANNULEE'
                        ? 'Cette réservation a été annulée, ses billets ne sont plus valables.'
                        : "Le paiement n'est pas encore confirmé : les billets seront émis dès son encaissement."}
                </Bandeau>
            ) : (
                <>
                    <Text style={base.sectionTitre}>Vos billets</Text>
                    <Text style={base.attenue}>Présentez le code QR à l'embarquement. Mettez la luminosité au maximum.</Text>
                    {billets.map((b) => (
                        <Billet key={b.billetUuid ?? b.codeBillet} billet={b} />
                    ))}
                </>
            )}

            <Bouton libelle="Chercher une autre réservation" variante="secondaire" onPress={onRecommencer} />
        </ScrollView>
    );
}

function Billet({ billet }: { billet: BilletClient }) {
    return (
        <Carte style={styles.billet}>
            <View style={styles.qr}>
                <QRCode value={billet.qrCodeData ?? billet.codeBillet ?? '-'} size={160} />
            </View>
            <Text style={base.gras}>{billet.nomPassager}</Text>
            <Text style={base.attenue}>
                {billet.typePassager === 'ENFANT' ? 'Enfant · ' : ''}Billet {billet.codeBillet}
                {billet.numeroSiege ? ` · siège ${billet.numeroSiege}` : ''}
            </Text>
        </Carte>
    );
}

const styles = StyleSheet.create({
    billet: { alignItems: 'center', gap: espaces.xs },
    qr: { padding: espaces.md, backgroundColor: couleurs.blanc, borderRadius: 12 }
});
