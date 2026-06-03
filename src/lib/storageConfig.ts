/**
 * Set STORAGE_ENABLED to true once you upgrade the Firebase project to the
 * Blaze (pay-as-you-go) plan and activate Firebase Storage in the console.
 *
 * While false:
 *  - All upload attempts are blocked before reaching Firebase Storage.
 *  - UploadTrigger components become visually disabled.
 *  - A clear Arabic message is shown to the user.
 */
export const STORAGE_ENABLED = false;

export const STORAGE_DISABLED_MSG =
  'رفع الملفات غير متاح حالياً إلى حين تفعيل التخزين';
