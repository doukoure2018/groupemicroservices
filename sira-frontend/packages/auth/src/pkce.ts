/**
 * PKCE réel (RFC 7636) — remplace le code_verifier codé en dur de l'ancien
 * frontend Angular (dette S1) : ici le verifier est généré aléatoirement à
 * chaque tentative de login et le challenge est un vrai SHA-256.
 *
 * Utilise WebCrypto (`globalThis.crypto`), disponible dans les navigateurs,
 * Node ≥ 20 et React Native via polyfill (expo-crypto / react-native-get-random-values).
 */

function base64UrlEncode(bytes: Uint8Array): string {
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    // btoa est disponible navigateur + Node ≥ 16
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Génère un code_verifier aléatoire de 64 octets (86 caractères base64url). */
export function generateCodeVerifier(): string {
    const bytes = new Uint8Array(64);
    globalThis.crypto.getRandomValues(bytes);
    return base64UrlEncode(bytes);
}

/** Calcule le code_challenge S256 correspondant au verifier. */
export async function computeCodeChallenge(verifier: string): Promise<string> {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    return base64UrlEncode(new Uint8Array(digest));
}

/** State anti-CSRF pour le flux authorization code. */
export function generateState(): string {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    return base64UrlEncode(bytes);
}
