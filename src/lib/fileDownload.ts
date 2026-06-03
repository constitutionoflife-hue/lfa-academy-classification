import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Resolve any file reference to a displayable URL or data URI.
 *
 * Priority:
 *  1. Real https:// URL (Firebase Storage) → return as-is
 *  2. data: URI → return as-is
 *  3. firestore:// custom URI → reassemble from Firestore base64 chunks (legacy)
 *  4. Anything else → return empty string
 */
export const resolveFileUrl = async (
  urlOrRef: string | undefined | null,
  mimeType?: string,
): Promise<string> => {
  if (!urlOrRef) return '';

  if (urlOrRef.startsWith('https://') || urlOrRef.startsWith('blob:') || urlOrRef.startsWith('data:')) {
    return urlOrRef;
  }

  if (urlOrRef.startsWith('firestore://')) {
    const parts = urlOrRef.replace('firestore://', '').split('/');
    if (parts.length >= 2) {
      try {
        const base64 = await getFirestoreFileBase64(parts[0], parts[1]);
        if (!base64) return '';
        if (base64.startsWith('data:')) return base64;
        const mt = mimeType || 'application/octet-stream';
        return `data:${mt};base64,${base64}`;
      } catch (e) {
        console.error('Legacy Firestore chunk fetch failed:', e);
      }
    }
  }

  return '';
};

/**
 * Legacy: reassemble a file stored as base64 chunks in Firestore.
 * Only used for files uploaded before Firebase Storage migration.
 */
export const getFirestoreFileBase64 = async (
  academyId: string,
  fileId: string,
): Promise<string> => {
  let fullBase64 = '';
  let index = 0;
  while (true) {
    const chunkRef = doc(db, `users/${academyId}/uploads/${fileId}_chunk_${index}`);
    const snap = await getDoc(chunkRef);
    if (!snap.exists()) break;
    const data = snap.data();
    fullBase64 += data.data;
    if (index >= (data.totalChunks - 1)) break;
    index++;
  }
  return fullBase64;
};
