import { useQuery } from '@tanstack/react-query';
import { formatDateFr, formatHeure, formatMontant, type BilletClient } from '@sira/core';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { api } from '../../api';
import { Bandeau, Bouton, Carte, Chargement, EtatVide, styles as base } from '../../ui/base';
import { couleurs, espaces } from '../../ui/theme';

/** Billets d'une commande, chacun avec son code QR à présenter à l'embarquement. */
export default function Commande() {
    const { uuid } = useLocalSearchParams<{ uuid: string }>();
    const commandeQuery = useQuery({ queryKey: ['commande', uuid], queryFn: async () => (await api.commandes.byUuid(uuid)).data.commande, enabled: !!uuid });

    if (commandeQuery.isPending) return <Chargement />;
    if (commandeQuery.isError || !commandeQuery.data) {
        return <EtatVide titre="Commande introuvable" action={<Bouton libelle="Mes voyages" variante="secondaire" onPress={() => router.replace('/(tabs)/voyages')} />} />;
    }

    const c = commandeQuery.data;
    const billets = c.billets ?? [];
    const attend = c.statut === 'EN_ATTENTE';

    return (
        <ScrollView style={base.ecran} contentContainerStyle={base.contenu}>
            <View>
                <Text style={base.titre}>{attend ? 'Paiement en attente' : 'Réservation confirmée'}</Text>
                <Text style={base.sousTitre}>
                    Commande {c.numeroCommande} · {formatMontant(c.montantTotal, c.devise)} · {c.nombrePlaces} {(c.nombrePlaces ?? 1) > 1 ? 'places' : 'place'}
                </Text>
            </View>

            <Carte style={{ gap: espaces.xs }}>
                <Text style={base.gras}>
                    {c.villeDepartLibelle} → {c.villeArriveeLibelle}
                </Text>
                <Text style={base.attenue}>
                    {formatDateFr(c.dateDepart)} à {formatHeure(c.heureDepart)}
                </Text>
                {c.siteDepart && (
                    <Text style={base.attenue}>
                        {c.siteDepart} → {c.siteArrivee}
                    </Text>
                )}
            </Carte>

            {attend ? (
                <Bandeau type="alerte">Les billets seront émis une fois le paiement confirmé. Ils ne sont pas valables tant que la commande est en attente.</Bandeau>
            ) : (
                <>
                    <Text style={base.sectionTitre}>Vos billets</Text>
                    <Text style={base.attenue}>Présentez le code QR à l'embarquement. Mettez la luminosité au maximum.</Text>
                    {billets.map((b) => (
                        <Billet key={b.billetUuid ?? b.codeBillet} billet={b} />
                    ))}
                </>
            )}

            {(c.statut === 'CONFIRMEE' || c.statut === 'PAYEE') && (
                <Bouton libelle="Changer de date" variante="secondaire" onPress={() => router.push({ pathname: '/modifier-date/[uuid]', params: { uuid } })} />
            )}
            <Bouton libelle="Mes voyages" variante="discret" onPress={() => router.replace('/(tabs)/voyages')} />
        </ScrollView>
    );
}

function Billet({ billet }: { billet: BilletClient }) {
    const valide = billet.statut === 'VALIDE';
    return (
        <Carte style={styles.billet}>
            <View style={styles.qr}>
                <QRCode value={billet.qrCodeData ?? billet.codeBillet ?? '-'} size={160} />
            </View>
            <Text style={base.gras}>{billet.nomPassager}</Text>
            <Text style={base.attenue}>Billet {billet.codeBillet}</Text>
            {billet.numeroSiege && <Text style={base.attenue}>Siège {billet.numeroSiege}</Text>}
            <Text style={[styles.statut, { color: valide ? couleurs.vertFonce : couleurs.alerte }]}>{valide ? 'Valide' : billet.statut}</Text>
        </Carte>
    );
}

const styles = StyleSheet.create({
    billet: { alignItems: 'center', gap: espaces.xs },
    qr: { padding: espaces.md, backgroundColor: couleurs.blanc, marginBottom: espaces.sm },
    statut: { fontWeight: '700', marginTop: espaces.xs }
});
