/**
 * QR codes dynamiques — NON IMPLÉMENTÉ, architecture préparée.
 *
 * Un QR code dynamique encode une URL courte du type https://<site>/r/<code> ; le serveur redirige vers
 * la destination enregistrée, qui peut alors être modifiée après impression, et comptabilise les scans.
 * Cela exige un backend : table `qr_links` (code, destination, owner, created_at), table `qr_scans`,
 * route `/r/[code]` et authentification (Supabase, cf. README).
 *
 * Tant que ce backend n'existe pas, l'interface ne propose que des QR codes statiques et
 * DYNAMIC_QR_ENABLED doit rester à false : aucune fonctionnalité n'est simulée.
 */
export const DYNAMIC_QR_ENABLED = false;

export interface DynamicQrLink { code: string; destination: string; createdAt: string; scans: number }

export interface DynamicQrProvider {
  create(destination: string): Promise<DynamicQrLink>;
  update(code: string, destination: string): Promise<DynamicQrLink>;
  remove(code: string): Promise<void>;
  stats(code: string): Promise<{ total: number; byDay: { date: string; scans: number }[] }>;
}
