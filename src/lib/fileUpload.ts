import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { storage, db, auth } from './firebase';
import { compressImage } from './imageUtils';

const ALLOWED_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Upload a file to Firebase Storage and save its metadata to Firestore.
 *
 * Signature is backward-compatible with the previous Firestore-chunk version:
 *   uploadFileAndReturnMetadata(file, academyId, contextPath)
 *
 * Returns the same metadata shape so all existing callers continue to work.
 * The key improvement: downloadURL is now a real Firebase Storage https:// URL.
 */
export const uploadFileAndReturnMetadata = (
  file: File,
  academyId: string,
  contextPath: string,
): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('لم يتم اختيار ملف.'));

    const user = auth.currentUser;
    if (!user) return reject(new Error('يجب تسجيل الدخول لرفع الملفات.'));

    if (file.size > MAX_BYTES) {
      return reject(new Error('حجم الملف يتجاوز الحد المسموح (10MB).'));
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return reject(
        new Error('نوع الملف غير مسموح. يُسمح بـ: JPG، PNG، WEBP، PDF، DOC، DOCX.'),
      );
    }

    const timestamp = Date.now();
    const safe = safeName(file.name);
    // Organized Storage path: academies/{uid}/{context}/{timestamp}-{filename}
    const storagePath = `academies/${academyId}/${contextPath}/${timestamp}-${safe}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      () => {}, // progress — callers don't use it yet
      (error) => {
        console.error('Storage upload error:', error);
        reject(new Error('فشل رفع الملف. يرجى المحاولة مرة أخرى.'));
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Compressed preview for images (kept for inline display without re-downloading)
          let preview: string | undefined;
          if (file.type.startsWith('image/')) {
            try {
              // Read as base64 for preview generation
              const base64 = await readAsDataURL(file);
              preview = await compressImage(base64, 400, 400, 0.4);
            } catch {
              // Preview failure is non-fatal
            }
          }

          const metadata = {
            type: 'file' as const,
            name: file.name,
            originalName: file.name,
            mimeType: file.type,
            contentType: file.type,
            size: file.size,
            downloadURL,
            url: downloadURL,      // alias — many callers read .url
            storagePath,
            preview,
            uploadedAt: new Date().toISOString(),
            uploadedBy: user.uid,
            academyId,
            uploaded: true as const,
            uploadStatus: 'uploaded' as const,
          };

          // Persist metadata to Firestore so admin can list/access uploads
          try {
            await addDoc(collection(db, 'academies', academyId, 'uploads'), {
              ...metadata,
              createdAt: timestamp,
            });
          } catch (e) {
            // Non-fatal: metadata save failure doesn't block the upload result
            console.warn('Could not save upload metadata to Firestore:', e);
          }

          resolve(metadata);
        } catch (e) {
          reject(new Error('فشل الحصول على رابط التحميل من Firebase Storage.'));
        }
      },
    );
  });
};

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
