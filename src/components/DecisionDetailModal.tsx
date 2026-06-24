import React from "react";
import { useNavigate } from "react-router-dom";
import { AcademyNotification } from "../lib/notifications";

const DECISION_LABELS: Record<string, string> = {
  approved: "مقبول (نموذج معتمد)",
  approved_with_conditions: "مقبول مع ملاحظات",
  needs_corrections: "بحاجة استكمال ملفات/تعليقات",
  rejected: "مرفوض",
};

function formatFull(ts: any): string {
  if (!ts) return "-";
  const date = typeof ts?.toDate === "function" ? ts.toDate() : new Date(ts);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleString("ar-LB", { dateStyle: "long", timeStyle: "short" });
}

export default function DecisionDetailModal({
  notification,
  onClose,
}: {
  notification: AcademyNotification;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const isApproved = notification.decision === "approved";
  const needsAction =
    notification.decision === "needs_corrections" ||
    notification.decision === "approved_with_conditions";

  const goToDashboard = () => {
    onClose();
    navigate("/dashboard");
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="bg-[#FFFDF7] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#022C22] px-6 py-5 flex items-center justify-between flex-shrink-0">
          <h3 className="text-white font-black text-base md:text-lg pr-2">
            {notification.title}
          </h3>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white flex-shrink-0"
            aria-label="إغلاق"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {isApproved && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm rounded-2xl p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl">verified</span>
              تم اعتماد ملف الأكاديمية من قبل الاتحاد اللبناني لكرة القدم
            </div>
          )}

          <div>
            <div className="text-xs font-bold text-gray-400 mb-1">القرار النهائي</div>
            <div className="font-black text-[#022C22]">
              {DECISION_LABELS[notification.decision] || notification.title}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-gray-400 mb-1">تاريخ القرار</div>
            <div className="font-bold text-[#022C22] text-sm">
              {formatFull(notification.decisionUpdatedAt || notification.createdAt)}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-gray-400 mb-1">تفاصيل القرار</div>
            <p className="text-[#022C22]/80 text-sm leading-relaxed">
              {notification.fullMessage}
            </p>
          </div>

          {notification.adminComment && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
              <div className="text-xs font-bold text-gray-400 mb-1.5">ملاحظات الإدارة</div>
              <p className="text-[#022C22] text-sm leading-relaxed whitespace-pre-wrap">
                {notification.adminComment}
              </p>
            </div>
          )}

          {needsAction && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm font-bold rounded-2xl p-4">
              يرجى الدخول إلى لوحة التحكم واستكمال النواقص المذكورة أعلاه لإتمام عملية التصنيف.
            </div>
          )}
        </div>

        <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3 flex-shrink-0">
          {needsAction && (
            <button
              onClick={goToDashboard}
              className="flex-1 px-5 py-3 bg-[#C9A227] text-[#022C22] rounded-xl font-black text-sm hover:brightness-110 transition-all"
            >
              استكمال النواقص
            </button>
          )}
          {isApproved && (
            <button
              onClick={goToDashboard}
              className="flex-1 px-5 py-3 bg-[#064E3B] text-white rounded-xl font-black text-sm hover:bg-[#022C22] transition-all"
            >
              عرض الملف
            </button>
          )}
          <button
            onClick={goToDashboard}
            className="flex-1 px-5 py-3 bg-white border border-gray-200 text-[#022C22] rounded-xl font-bold text-sm hover:bg-gray-100 transition-all"
          >
            العودة إلى لوحة التحكم
          </button>
        </div>
      </div>
    </div>
  );
}
