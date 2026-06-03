import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { storage, db, auth } from './firebase';
import { compressImage } from './imageUtils';
import { STORAGE_ENABLED, STORAGE_DISABLED_MSG } from './storageConfig';

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

/** Extra context passed by callers that know their profileId / axisId etc. */
export interface UploadFileOptions {
  profileId?: string;
  fieldKey?: string;
  axisId?: string;
  classificationType?: string; // "A" | "B"
}

/**
 * Upload a file to Firebase Storage, generate a real downloadURL,
 * save full metadata to Firestore, and return the metadata object.
 *
 * Backward-compatible signature:
 *   uploadFileAndReturnMetadata(file, academyId, contextPath, options?)
 *
 * Storage paths (when extra context is supplied):
 *   profile-photos  → academies/{id}/profile-photos/{profileId}/{ts}-{name}
 *   registry        → academies/{id}/registry/{profileId}/{fieldKey}/{ts}-{name}
 *   classification-axes → academies/{id}/classification/{cls}/{axisId}/{fieldKey}/{ts}-{name}
 *   (default)       → academies/{id}/{contextPath}/{ts}-{name}
 */
export const uploadFileAndReturnMetadata = (
  file: File,
  academyId: string,
  contextPath: string,
  options?: UploadFileOptions,
): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!STORAGE_ENABLED) return reject(new Error(STORAGE_DISABLED_MSG));
    if (!file)      return reject(new Error('لم يتم اختيار ملف.'));
    if (!academyId) return reject(new Error('معرّف الأكاديمية مفقود. يرجى تسجيل الدخول مجدداً.'));

    const user = auth.currentUser;
    if (!user) return reject(new Error('يجب تسجيل الدخول لرفع الملفات.'));

    if (file.size > MAX_BYTES)
      return reject(new Error('حجم الملف يتجاوز الحد المسموح (10MB).'));

    if (!ALLOWED_TYPES.includes(file.type))
      return reject(new Error('نوع الملف غير مسموح. يُسمح بـ: JPG، PNG، WEBP، PDF، DOC، DOCX.'));

    const { profileId, fieldKey, axisId, classificationType } = options || {};
    const timestamp = Date.now();
    const safe = safeName(file.name);

    // Build an organized Storage path based on available context
    let storagePath: string;
    if (contextPath === 'profile-photos' && profileId) {
      storagePath = `academies/${academyId}/profile-photos/${profileId}/${timestamp}-${safe}`;
    } else if (contextPath === 'registry' && profileId) {
      const fkSeg = fieldKey ? `/${fieldKey}` : '';
      storagePath = `academies/${academyId}/registry/${profileId}${fkSeg}/${timestamp}-${safe}`;
    } else if (contextPath === 'classification-axes' && axisId) {
      const cls = classificationType || 'A';
      const fkSeg = fieldKey ? `/${fieldKey}` : '';
      storagePath = `academies/${academyId}/classification/${cls}/${axisId}${fkSeg}/${timestamp}-${safe}`;
    } else {
      storagePath = `academies/${academyId}/${contextPath}/${timestamp}-${safe}`;
    }

    const uploadTask = uploadBytesResumable(ref(storage, storagePath), file);

    uploadTask.on(
      'state_changed',
      () => {}, // progress events — extend later if needed
      (error) => {
        console.error('Storage upload error:', error);
        let msg = 'فشل رفع الملف. يرجى المحاولة مرة أخرى.';
        if (error.code === 'storage/unauthorized')
          msg = 'ليس لديك صلاحية لرفع الملفات. تأكد من تسجيل الدخول.';
        else if (error.code === 'storage/quota-exceeded')
          msg = 'تجاوز حجم التخزين المسموح. يرجى التواصل مع الإدارة.';
        else if (error.code === 'storage/canceled')
          msg = 'تم إلغاء رفع الملف.';
        reject(new Error(msg));
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Compressed preview for inline display (avoids re-downloading for thumbnails)
          let preview: string | undefined;
          if (file.type.startsWith('image/')) {
            try {
              const base64 = await readAsDataURL(file);
              preview = await compressImage(base64, 400, 400, 0.4);
            } catch {
              // Non-fatal
            }
          }

          const metadata = {
            // Core identity
            type:             'file' as const,
            uploaded:         true as const,
            uploadStatus:     'uploaded' as const,
            // Names
            name:             file.name,
            originalName:     file.name,
            fileName:         safe,
            // Type / size
            mimeType:         file.type,
            contentType:      file.type,
            size:             file.size,
            // Firebase Storage
            downloadURL,
            url:              downloadURL,   // alias used by many callers
            storagePath,
            // Preview (base64 thumbnail for images)
            preview,
            // Audit
            uploadedAt:       new Date().toISOString(),
            uploadedBy:       user.uid,
            // Context
            academyId,
            context:          contextPath,
            fieldKey:         fieldKey  || null,
            axisId:           axisId    || null,
            profileId:        profileId || null,
            classificationType: classificationType || null,
          };

          // Persist to Firestore so admin can list / access uploads centrally
          try {
            await addDoc(collection(db, 'academies', academyId, 'uploads'), {
              ...metadata,
              createdAt: timestamp,
            });
          } catch (e) {
            // Non-fatal — upload succeeded; metadata record is best-effort
            console.warn('Could not save upload metadata to Firestore:', e);
          }

          resolve(metadata);
        } catch {
          reject(new Error('فشل الحصول على رابط التحميل من Firebase Storage.'));
        }
      },
    );
  });
};

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
