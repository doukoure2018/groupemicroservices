import { useMutation } from '@tanstack/react-query';
import { ApiError } from '@sira/api-client';
import { formatDateFr, type BilletValide } from '@sira/core';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, Vibration, View } from 'react-native';
import { api } from '../../api';
import { Bandeau, Bouton, Carte, EtatVide, styles as base } from '../../ui/base';
import { couleurs, espaces, rayons } from '../../ui/theme';

/**
 * Contrôle à l'embarquement. Le QR d'un billet porte son code ; le serveur
 * le passe à UTILISE si, et seulement si, il était VALIDE, et refuse avec un
 * message clair un billet déjà passé, annulé ou inconnu. Un seul scan est
 * traité à la fois : la caméra lit plusieurs fois par seconde, et le second
 * passage du même code renverrait « déjà utilisé » pour un billet pourtant
 * bon. La saisie manuelle couvre les QR illisibles.
 */
export default function Scanner() {
    const [permission, demanderPermission] = useCameraPermissions();
    const [resultat, setResultat] = useState<{ billet?: BilletValide; erreur?: string; code: string } | null>(null);
    const [saisie, setSaisie] = useState('');
    const enTraitement = useRef(false);

    const valider = useMutation({
        mutationFn: async (code: string) => (await api.billets.validate(code)).data.billet,
        onSuccess: (billet, code) => {
            Vibration.vibrate(80);
            setResultat({ billet, code });
        },
        onError: (e, code) => {
            Vibration.vibrate([0, 60, 60, 60]);
            setResultat({ erreur: e instanceof ApiError ? e.message : 'Validation impossible. Vérifiez le réseau puis réessayez.', code });
        },
        onSettled: () => {
            enTraitement.current = false;
        }
    });

    const traiterCode = useCallback(
        (brut: string) => {
            const code = brut.trim();
            if (!code || enTraitement.current) return;
            enTraitement.current = true;
            valider.mutate(code);
        },
        [valider]
    );

    const auScan = useCallback((lecture: BarcodeScanningResult) => traiterCode(lecture.data), [traiterCode]);

    function suivant() {
        setResultat(null);
        setSaisie('');
    }

    if (!permission) return null;
    if (!permission.granted) {
        return (
            <EtatVide
                titre="Accès à l'appareil photo"
                texte="Le contrôle des billets lit le code QR avec l'appareil photo. Vous pouvez aussi saisir le code à la main ci-dessous."
                action={
                    <View style={{ gap: espaces.sm, width: '100%' }}>
                        <Bouton libelle={permission.canAskAgain ? "Autoriser l'appareil photo" : 'Ouvrir les réglages'} onPress={() => void demanderPermission()} />
                        <SaisieManuelle valeur={saisie} onChange={setSaisie} onValider={() => traiterCode(saisie)} enCours={valider.isPending} />
                        {resultat && <Resultat resultat={resultat} onSuivant={suivant} />}
                    </View>
                }
            />
        );
    }

    return (
        <View style={base.ecran}>
            <View style={styles.viseur}>
                <CameraView
                    style={StyleSheet.absoluteFill}
                    facing="back"
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    // Rappel retiré pendant le traitement et l'affichage du résultat :
                    // c'est le seul moyen d'arrêter la lecture.
                    onBarcodeScanned={resultat || valider.isPending ? undefined : auScan}
                />
                <View style={styles.cadre} pointerEvents="none" />
                <Text style={styles.consigne}>{valider.isPending ? 'Vérification…' : resultat ? 'Touchez « Billet suivant » pour continuer' : 'Visez le code QR du billet'}</Text>
            </View>

            <View style={styles.bas}>
                {resultat ? (
                    <Resultat resultat={resultat} onSuivant={suivant} />
                ) : (
                    <SaisieManuelle valeur={saisie} onChange={setSaisie} onValider={() => traiterCode(saisie)} enCours={valider.isPending} />
                )}
            </View>
        </View>
    );
}

function SaisieManuelle({ valeur, onChange, onValider, enCours }: { valeur: string; onChange: (v: string) => void; onValider: () => void; enCours: boolean }) {
    return (
        <Carte style={{ gap: espaces.sm }}>
            <Text style={base.champLibelle}>Code illisible ? Saisissez-le</Text>
            <View style={{ flexDirection: 'row', gap: espaces.sm }}>
                <TextInput
                    value={valeur}
                    onChangeText={(v) => onChange(v.toUpperCase())}
                    placeholder="TKT-XXXXXXXX"
                    placeholderTextColor={couleurs.gris}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    style={[base.champSaisie, { flex: 1 }]}
                    accessibilityLabel="Code du billet"
                    onSubmitEditing={onValider}
                />
                <Bouton libelle="Valider" onPress={onValider} desactive={valeur.trim().length < 4} enCours={enCours} />
            </View>
        </Carte>
    );
}

function Resultat({ resultat, onSuivant }: { resultat: { billet?: BilletValide; erreur?: string; code: string }; onSuivant: () => void }) {
    const ok = !!resultat.billet;
    const b = resultat.billet;
    return (
        <Carte style={[styles.resultat, ok ? styles.resultatOk : styles.resultatKo]}>
            <Text style={[styles.verdict, { color: ok ? couleurs.vertFonce : couleurs.danger }]}>{ok ? 'Billet valide, embarquement autorisé' : 'Billet refusé'}</Text>
            {ok ? (
                <View style={{ gap: 2 }}>
                    <Text style={styles.passager}>{b?.nomPassager}</Text>
                    <Text style={base.attenue}>Billet {b?.codeBillet}{b?.numeroSiege ? ` · siège ${b.numeroSiege}` : ''}</Text>
                    {b?.telephonePassager && <Text style={base.attenue}>{b.telephonePassager}</Text>}
                    {b?.dateValidation && <Text style={base.attenue}>Validé le {formatDateFr(b.dateValidation)}</Text>}
                </View>
            ) : (
                <>
                    <Text style={base.attenue}>Code lu : {resultat.code}</Text>
                    <Bandeau type="erreur">{resultat.erreur}</Bandeau>
                </>
            )}
            <Bouton libelle="Billet suivant" onPress={onSuivant} variante={ok ? 'plein' : 'secondaire'} />
        </Carte>
    );
}

const styles = StyleSheet.create({
    viseur: { flex: 1, backgroundColor: '#000', justifyContent: 'flex-end', alignItems: 'center' },
    cadre: { position: 'absolute', width: 240, height: 240, borderWidth: 3, borderColor: couleurs.or, borderRadius: rayons.lg, top: '50%', marginTop: -140 },
    consigne: { color: couleurs.blanc, fontWeight: '700', marginBottom: espaces.lg, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: espaces.md, paddingVertical: espaces.sm, borderRadius: 999 },
    bas: { padding: espaces.lg, gap: espaces.md },
    resultat: { gap: espaces.md, borderWidth: 2 },
    resultatOk: { borderColor: couleurs.vert, backgroundColor: couleurs.succesPale },
    resultatKo: { borderColor: couleurs.danger, backgroundColor: couleurs.dangerPale },
    verdict: { fontSize: 18, fontWeight: '800' },
    passager: { fontSize: 20, fontWeight: '800', color: couleurs.encre }
});
