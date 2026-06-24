import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  Unsubscribe,
} from "firebase/firestore";
import { auth, db } from "./firebase";

export type DecisionKey =
  | "approved"
  | "approved_with_conditions"
  | "needs_corrections"
  | "rejected";

export interface AcademyNotification {
  id: string;
  academyId: string;
  recipientUserId: string;
  applicationId: string;
  type: string;
  decision: DecisionKey;
  title: string;
  previewMessage: string;
  fullMessage: string;
  adminComment: string | null;
  isRead: boolean;
  createdAt: any;
  readAt: any;
  decisionUpdatedAt: any;
  route: string;
  createdByAdminId: string | null;
}

const DECISION_TEMPLATES: Record<
  DecisionKey | "updated",
  { title: string; previewMessage: string; fullMessage: string }
> = {
  approved: {
    title: "تم اعتماد ملف الأكاديمية",
    previewMessage:
      "قام الاتحاد اللبناني لكرة القدم بمراجعة ملف أكاديميتكم واعتماده بنجاح.",
    fullMessage:
      "تم اعتماد ملف الأكاديمية من قبل الاتحاد اللبناني لكرة القدم.",
  },
  approved_with_conditions: {
    title: "تمت مراجعة ملف الأكاديمية",
    previewMessage:
      "قام الاتحاد اللبناني لكرة القدم بمراجعة ملف أكاديميتكم. يرجى الاطلاع على قرار الاتحاد والملاحظات المطلوبة.",
    fullMessage:
      "تمت مراجعة ملف أكاديميتكم وتمت الموافقة عليه مع وجود ملاحظات. يرجى الاطلاع على التفاصيل أدناه.",
  },
  needs_corrections: {
    title: "مطلوب استكمال ملف الأكاديمية",
    previewMessage:
      "بعد مراجعة ملف أكاديميتكم، توجد ملاحظات أو مستندات مطلوبة. يرجى الدخول إلى حسابكم والاطلاع على التفاصيل واستكمال المطلوب.",
    fullMessage:
      "بعد مراجعة ملف أكاديميتكم، توجد ملاحظات أو مستندات مطلوبة لاستكمال الطلب. يرجى مراجعة الملاحظات أدناه واستكمال المطلوب من لوحة التحكم.",
  },
  rejected: {
    title: "قرار بشأن ملف الأكاديمية",
    previewMessage:
      "قام الاتحاد اللبناني لكرة القدم بمراجعة ملف أكاديميتكم واتخاذ القرار النهائي. يرجى الدخول إلى حسابكم للاطلاع على تفاصيل القرار.",
    fullMessage:
      "قام الاتحاد اللبناني لكرة القدم بمراجعة ملف أكاديميتكم. لم يتم اعتماد الملف في هذه المرحلة. يرجى الاطلاع على الملاحظات أدناه.",
  },
  updated: {
    title: "تم تحديث قرار الاتحاد بشأن ملف الأكاديمية",
    previewMessage:
      "قام الاتحاد اللبناني لكرة القدم بتحديث القرار أو الملاحظات المتعلقة بملف أكاديميتكم. يرجى الاطلاع على التفاصيل.",
    fullMessage:
      "تم تحديث القرار أو الملاحظات الخاصة بملف أكاديميتكم من قبل الاتحاد اللبناني لكرة القدم. يرجى مراجعة التفاصيل أدناه.",
  },
};

/**
 * Maps either the admin's raw dropdown text ("مقبول (نموذج معتمد)") or a
 * previously normalized stored value ("approved"/"declined") to a decision key.
 * Returns null for "قيد المراجعة" / unknown values — no notification is sent for those.
 */
export function mapDecisionTextToKey(
  text: string | undefined | null,
): DecisionKey | null {
  if (!text) return null;
  if (text === "approved" || text.includes("مقبول")) return "approved";
  if (text === "declined" || text.includes("مرفوض")) return "rejected";
  if (text.includes("استكمال")) return "needs_corrections";
  return null;
}

interface MaybeCreateParams {
  academyId: string;
  decisionKey: DecisionKey;
  adminComment: string;
  previousDecisionKey: DecisionKey | null;
  previousComment: string;
  isFirstDecision: boolean;
}

/**
 * Creates a notification only if the decision is new, the status changed, or the
 * admin's comment changed meaningfully — prevents duplicate notifications on
 * re-saves, page refreshes, or opening/closing the decision modal without changes.
 */
export async function maybeCreateDecisionNotification(
  params: MaybeCreateParams,
): Promise<boolean> {
  const {
    academyId,
    decisionKey,
    adminComment,
    previousDecisionKey,
    previousComment,
    isFirstDecision,
  } = params;

  const statusChanged = isFirstDecision || previousDecisionKey !== decisionKey;
  const commentChanged =
    (previousComment || "").trim() !== (adminComment || "").trim();

  if (!statusChanged && !commentChanged) return false;

  const useUpdatedTemplate = !statusChanged && commentChanged;
  const template = useUpdatedTemplate
    ? DECISION_TEMPLATES.updated
    : DECISION_TEMPLATES[decisionKey];

  await addDoc(collection(db, "notifications"), {
    academyId,
    recipientUserId: academyId,
    applicationId: academyId,
    type: "final_decision",
    decision: decisionKey,
    title: template.title,
    previewMessage: template.previewMessage,
    fullMessage: template.fullMessage,
    adminComment: adminComment || null,
    isRead: false,
    createdAt: serverTimestamp(),
    readAt: null,
    decisionUpdatedAt: serverTimestamp(),
    route: "/dashboard",
    createdByAdminId: auth.currentUser?.uid || null,
  });

  return true;
}

export function subscribeToNotifications(
  uid: string,
  onChange: (items: AcademyNotification[]) => void,
  onError?: (error: any) => void,
): Unsubscribe {
  const q = query(
    collection(db, "notifications"),
    where("recipientUserId", "==", uid),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as AcademyNotification,
      );
      onChange(items);
    },
    (err) => {
      console.error("Notifications subscription error:", err);
      onError?.(err);
    },
  );
}

export async function markNotificationRead(notificationId: string) {
  await updateDoc(doc(db, "notifications", notificationId), {
    isRead: true,
    readAt: serverTimestamp(),
  });
}
