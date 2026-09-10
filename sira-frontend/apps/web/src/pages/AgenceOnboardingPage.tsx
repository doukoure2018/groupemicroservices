import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDateFr, type AgenceOnboarding, type AgenceOnboardingRequest } from '@sira/core';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api';
import { useNotif } from './admin/shared';

interface OnboardingForm {
    nom: string;
    raisonSociale: string;
    numeroRegistre: string;
    adresse: string;
    regionId: number | null;
    communeId: number | null;
    email: string;
    telephone: string;
    telephoneWhatsapp: string;
    description: string;
}

const FORM_VIDE: OnboardingForm = {
    nom: '',
    raisonSociale: '',
    numeroRegistre: '',
    adresse: '',
    regionId: null,
    communeId: null,
    email: '',
    telephone: '',
    telephoneWhatsapp: '',
    description: ''
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Le service accepte 10 Mo, quoi qu'annonce l'ancien libellé « max 20 MB ». */
const TAILLE_MAX_OCTETS = 10 * 1024 * 1024;

export function AgenceOnboardingPage() {
    const { toast, succes, erreur } = useNotif();
    const queryClient = useQueryClient();
    const CLE = ['agence-onboarding-me'];
    const champFichier = useRef<HTMLInputElement>(null);

    const meQuery = useQuery({ queryKey: CLE, queryFn: async () => (await api.immo.agences.onboardingMe()).data });
    const regionsQuery = useQuery({ queryKey: ['regions'], queryFn: async () => (await api.geo.regions()).data.regions ?? [] });
    const communesQuery = useQuery({ queryKey: ['communes'], queryFn: async () => (await api.geo.communes()).data.communes ?? [] });

    const agence: AgenceOnboarding | undefined = meQuery.data?.agence;
    const statut = agence?.statutVerification ?? 'PROFIL_INCOMPLET';

    const [form, setForm] = useState<OnboardingForm>(FORM_VIDE);

    useEffect(() => {
        if (!agence) return;
        setForm({
            nom: agence.nom ?? '',
            raisonSociale: agence.raisonSociale ?? '',
            numeroRegistre: agence.numeroRegistre ?? '',
            adresse: agence.adresse ?? '',
            regionId: agence.regionId ?? null,
            communeId: agence.communeId ?? null,
            email: agence.email ?? '',
            telephone: agence.telephone ?? '',
            telephoneWhatsapp: agence.telephoneWhatsapp ?? '',
            description: agence.description ?? ''
        });
    }, [agence]);

    const rafraichir = () => void queryClient.invalidateQueries({ queryKey: CLE });

    const regionsOptions = useMemo(() => (regionsQuery.data ?? []).map((r) => ({ label: r.libelle, value: r.regionId })), [regionsQuery.data]);

    // Le référentiel des communes est indexé par identifiant de région textuel :
    // on passe par la région choisie pour filtrer, ce que l'ancien écran ne faisait pas.
    const communesOptions = useMemo(() => {
        const region = (regionsQuery.data ?? []).find((r) => r.regionId === form.regionId);
        const communes = communesQuery.data ?? [];
        const filtrees = region ? communes.filter((c) => c.regionUuid === region.regionUuid) : communes;
        return filtrees.map((c) => ({ label: c.libelle, value: c.communeId }));
    }, [communesQuery.data, regionsQuery.data, form.regionId]);

    const enregistrer = useMutation({
        mutationFn: async () => {
            const body: AgenceOnboardingRequest = {
                nom: form.nom.trim(),
                raisonSociale: form.raisonSociale.trim() || undefined,
                numeroRegistre: form.numeroRegistre.trim(),
                adresse: form.adresse.trim(),
                regionId: form.regionId!,
                communeId: form.communeId!,
                email: form.email.trim(),
                telephone: form.telephone.trim(),
                telephoneWhatsapp: form.telephoneWhatsapp.trim() || undefined,
                description: form.description.trim() || undefined
            };
            return api.immo.agences.onboardingUpdate(body);
        },
        onSuccess: (res) => {
            succes('Enregistré', res.message);
            rafraichir();
        },
        onError: (err) => erreur(err, "L'enregistrement du profil a échoué.")
    });

    const televerser = useMutation({
        mutationFn: async (fichier: File) => {
            const data = new FormData();
            data.append('file', fichier, fichier.name);
            return api.immo.agences.onboardingUploadRccm(data);
        },
        onSuccess: (res) => {
            succes('Document uploadé', res.message);
            rafraichir();
        },
        onError: (err) => erreur(err, "L'envoi du document a échoué.")
    });

    const soumettre = useMutation({
        mutationFn: async () => api.immo.agences.onboardingSoumettre(),
        onSuccess: (res) => {
            succes('Dossier soumis', res.message);
            rafraichir();
        },
        onError: (err) => erreur(err, 'La soumission a échoué.')
    });

    function choisirFichier(e: React.ChangeEvent<HTMLInputElement>) {
        const fichier = e.target.files?.[0];
        e.target.value = '';
        if (!fichier) return;
        if (fichier.size > TAILLE_MAX_OCTETS) {
            erreur(undefined, 'Le document dépasse 10 Mo. Compressez-le puis réessayez.');
            return;
        }
        televerser.mutate(fichier);
    }

    const emailValide = !form.email || EMAIL_RE.test(form.email);
    const formValide =
        !!form.nom.trim() && !!form.numeroRegistre.trim() && !!form.adresse.trim() && form.regionId != null && form.communeId != null && !!form.telephone.trim() && emailValide && !!form.email.trim();

    /** La soumission dépend de l'état enregistré côté serveur, pas de la saisie en cours. */
    const manquants = useMemo(() => {
        if (!agence) return ["enregistrez d'abord les informations de votre agence"];
        const out: string[] = [];
        if (!agence.numeroRegistre) out.push('RCCM/NIF');
        if (!agence.adresse) out.push('adresse');
        if (!agence.communeId) out.push('commune');
        if (!agence.regionId) out.push('région');
        if (!agence.email) out.push('email professionnel');
        if (!agence.telephone) out.push('téléphone');
        if (!agence.documentsKycUrl) out.push('document RCCM à uploader');
        return out;
    }, [agence]);

    const peutSoumettre = manquants.length === 0;

    if (meQuery.isPending) return <p className="muted center">Chargement de votre dossier…</p>;

    if (statut === 'EN_VALIDATION' || statut === 'EN_ATTENTE') {
        return (
            <section className="card card-narrow center">
                <Toast ref={toast} />
                <i className="pi pi-hourglass grand-icone alerte-icone" />
                <h1>En cours de validation par la conformité</h1>
                <p className="muted">
                    Votre dossier a bien été soumis. Notre équipe conformité vérifie vos informations et votre document RCCM/NIF, <strong>réponse sous 24 heures</strong>. Vous recevrez un email dès
                    la décision.
                </p>
                {agence?.dateSoumissionConformite && <Tag value={`Soumis le ${formatDateFr(agence.dateSoumissionConformite)}`} severity="warning" />}
            </section>
        );
    }

    if (statut === 'VERIFIE') {
        return (
            <section className="card card-narrow center">
                <Toast ref={toast} />
                <i className="pi pi-verified grand-icone succes-icone" />
                <h1>Agence vérifiée</h1>
                <p className="muted">
                    Votre agence <strong>{agence?.nom}</strong> est validée par la conformité. Votre espace de travail sera bientôt enrichi.
                </p>
            </section>
        );
    }

    return (
        <section className="card card-large">
            <Toast ref={toast} />
            <div className="admin-entete">
                <h1>Profil de l'agence</h1>
            </div>

            {statut === 'REJETE' ? (
                <p className="bandeau-alerte">
                    Dossier rejeté par la conformité{agence?.motifRejet ? ` : ${agence.motifRejet}` : ''}. Corrigez vos informations puis soumettez à nouveau.
                </p>
            ) : (
                <p className="bandeau-info">Complétez le profil de votre agence puis soumettez-le : la conformité le validera sous 24 h.</p>
            )}

            <div className="form-grid">
                <label>
                    Nom de l'agence *
                    <input maxLength={150} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
                </label>
                <label>
                    RCCM ou code NIF *
                    <input maxLength={50} value={form.numeroRegistre} onChange={(e) => setForm({ ...form, numeroRegistre: e.target.value })} />
                </label>
                <label className="span-2">
                    Adresse *
                    <input maxLength={255} value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
                </label>
                <label>
                    Région *
                    <Dropdown
                        value={form.regionId}
                        options={regionsOptions}
                        onChange={(e) => setForm({ ...form, regionId: e.value ?? null, communeId: null })}
                        placeholder="Choisir la région"
                        filter
                        loading={regionsQuery.isLoading}
                    />
                </label>
                <label>
                    Commune *
                    <Dropdown
                        value={form.communeId}
                        options={communesOptions}
                        onChange={(e) => setForm({ ...form, communeId: e.value ?? null })}
                        placeholder={form.regionId ? 'Choisir la commune' : "Choisissez d'abord la région"}
                        filter
                        disabled={!form.regionId}
                        loading={communesQuery.isLoading}
                    />
                </label>
                <label>
                    Email professionnel *
                    <input type="email" maxLength={150} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    {!emailValide && <span className="texte-danger">Adresse email invalide.</span>}
                </label>
                <label>
                    Contact pour joindre *
                    <input type="tel" maxLength={20} placeholder="+224 6XX XX XX XX" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
                </label>
                <label>
                    Contact WhatsApp
                    <input type="tel" maxLength={20} placeholder="+224 6XX XX XX XX" value={form.telephoneWhatsapp} onChange={(e) => setForm({ ...form, telephoneWhatsapp: e.target.value })} />
                </label>
                <label>
                    Raison sociale
                    <input maxLength={200} value={form.raisonSociale} onChange={(e) => setForm({ ...form, raisonSociale: e.target.value })} />
                </label>
                <label className="span-2">
                    Description
                    <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </label>

                <div className="span-2">
                    <label className="champ-plein">
                        Document RCCM (PDF ou image, max 10 Mo) *
                        <input ref={champFichier} type="file" accept=".pdf,image/*" disabled={!agence || televerser.isPending} onChange={choisirFichier} />
                    </label>
                    {televerser.isPending && <p className="muted">Envoi du document en cours…</p>}
                    {!televerser.isPending && agence?.documentsKycUrl && <p className="succes">Document envoyé.</p>}
                    {!agence && <p className="muted">Enregistrez d'abord les informations ci-dessus pour pouvoir envoyer le document.</p>}
                </div>
            </div>

            {!peutSoumettre && <p className="bandeau-alerte">Pour soumettre à la conformité, il manque : {manquants.join(', ')}.</p>}

            <div className="dialog-actions">
                <Button label="Enregistrer" icon="pi pi-save" disabled={!formValide || enregistrer.isPending} loading={enregistrer.isPending} onClick={() => enregistrer.mutate()} />
                <Button
                    label="Soumettre à la conformité"
                    icon="pi pi-send"
                    severity="warning"
                    disabled={!peutSoumettre || soumettre.isPending}
                    loading={soumettre.isPending}
                    onClick={() => soumettre.mutate()}
                />
            </div>
        </section>
    );
}
