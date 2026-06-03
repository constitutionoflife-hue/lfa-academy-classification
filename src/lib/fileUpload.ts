import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
import { compressImage } from "./imageUtils";

export const uploadFileAndReturnMetadata = async (
  file: File,
  academyId: string,
  contextPath: string
) => {
  if (!file) throw new Error("No file provided");

  const MAX_SIZE_MB = 10;
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`حجم الملف كبير جداً. الحد الأقصى هو ${MAX_SIZE_MB}MB.`);
  }

  try {
    return new Promise<any>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const fileId = Date.now().toString() + '_' + Math.random().toString(36).substring(2);
          
          const chunkSize = 800000;
          const chunks = [];
          for (let i = 0; i < base64.length; i += chunkSize) {
            chunks.push(base64.slice(i, i + chunkSize));
          }

          for (let i = 0; i < chunks.length; i++) {
            const chunkDocRef = doc(db, `users/${academyId}/uploads/${fileId}_chunk_${i}`);
            await setDoc(chunkDocRef, {
              data: chunks[i],
              index: i,
              totalChunks: chunks.length,
              fileId: fileId,
              createdAt: Date.now()
            });
          }

          let previewData = undefined;
          
          if (file.type.startsWith('image/')) {
            try {
               previewData = await compressImage(base64, 400, 400, 0.4);
            } catch (e) {
               console.warn("Failed to generate preview", e);
            }
          }

          resolve({
            type: "file",
            name: file.name,
            originalName: file.name,
            mimeType: file.type || 'application/octet-stream',
            contentType: file.type || 'application/octet-stream',
            size: file.size,
            downloadURL: `firestore://${academyId}/${fileId}`,
            url: `firestore://${academyId}/${fileId}`,
            preview: previewData,
            uploadedAt: new Date().toISOString(),
            uploaded: true,
            uploadStatus: "uploaded"
          });
        } catch (err: any) {
             console.error("Upload save error", err);
             reject(new Error("حدث خطأ أثناء حفظ الملف. يرجى المحاولة مرة أخرى."));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  } catch (error: any) {
    console.error("Upload error: ", error);
    throw new Error(error.message || "حدث خطأ أثناء رفع الملف. يرجى المحاولة مرة أخرى.");
  }
};
