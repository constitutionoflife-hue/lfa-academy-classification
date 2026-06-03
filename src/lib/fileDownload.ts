import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

/**
 * Downloads a file from Firestore chunks.
 * Reassembles the base64 string and returns it.
 */
export const getFirestoreFileBase64 = async (academyId: string, fileId: string): Promise<string> => {
  let fullBase64 = "";
  let index = 0;
  while(true) {
    const chunkDocRef = doc(db, `users/${academyId}/uploads/${fileId}_chunk_${index}`);
    const snap = await getDoc(chunkDocRef);
    if (!snap.exists()) break;
    const data = snap.data();
    fullBase64 += data.data;
    if (index >= (data.totalChunks - 1)) break;
    index++;
  }
  return fullBase64;
}
