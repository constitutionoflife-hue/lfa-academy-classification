import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import {
  AcademyNotification,
  markNotificationRead,
  subscribeToNotifications,
} from "../lib/notifications";
import DecisionDetailModal from "./DecisionDetailModal";

const STATUS_META: Record<string, { icon: string; color: string }> = {
  approved: { icon: "check_circle", color: "text-emerald-400" },
  approved_with_conditions: { icon: "fact_check", color: "text-amber-400" },
  needs_corrections: { icon: "error", color: "text-amber-400" },
  rejected: { icon: "cancel", color: "text-red-400" },
};

function formatRelative(ts: any): string {
  if (!ts) return "الآن";
  const date = typeof ts?.toDate === "function" ? ts.toDate() : new Date(ts);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleString("ar-LB", { dateStyle: "medium", timeStyle: "short" });
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AcademyNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [detailItem, setDetailItem] = useState<AcademyNotification | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = subscribeToNotifications(
      user.uid,
      (list) => {
        setItems(list);
        setLoading(false);
        setError(false);
      },
      () => {
        setLoading(false);
        setError(true);
      },
    );
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!user) return null;

  const unreadCount = items.filter((n) => !n.isRead).length;
  const badgeText = unreadCount > 9 ? "9+" : unreadCount > 0 ? String(unreadCount) : null;

  const handleOpenNotification = async (n: AcademyNotification) => {
    setOpen(false);
    setDetailItem(n);
    if (!n.isRead) {
      try {
        await markNotificationRead(n.id);
      } catch (e) {
        console.error("Failed to mark notification as read:", e);
      }
    }
  };

  return (
    <>
      <div className="relative" ref={panelRef}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="relative w-10 h-10 md:w-11 md:h-11 bg-white/5 hover:bg-white/10 flex items-center justify-center rounded-xl transition-all border border-white/10"
          aria-label="الإشعارات"
        >
          <span className="material-symbols-outlined text-white text-xl md:text-2xl">
            notifications
          </span>
          {badgeText && (
            <span className="absolute -top-1.5 -left-1.5 min-w-[19px] h-[19px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#022C22] leading-none">
              {badgeText}
            </span>
          )}
        </button>

        {open && (
          <div
            dir="rtl"
            className="fixed sm:absolute left-3 right-3 sm:left-0 sm:right-auto top-[72px] sm:top-auto sm:mt-3 sm:w-[380px] max-h-[75vh] bg-[#022C22] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[70]"
          >
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h4 className="font-black text-white text-sm">الإشعارات</h4>
              {unreadCount > 0 && (
                <span className="text-[#C9A227] text-xs font-bold">
                  {unreadCount} غير مقروء
                </span>
              )}
            </div>

            <div className="overflow-y-auto max-h-[55vh]">
              {loading ? (
                <div className="p-8 flex justify-center">
                  <div className="w-6 h-6 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : error ? (
                <div className="p-6 text-center text-white/50 text-sm font-bold">
                  تعذر تحميل الإشعارات. حاول مرة أخرى.
                </div>
              ) : items.length === 0 ? (
                <div className="p-8 text-center text-white/40 text-sm font-bold">
                  لا توجد إشعارات جديدة حالياً
                </div>
              ) : (
                items.map((n) => {
                  const meta = STATUS_META[n.decision] || STATUS_META.needs_corrections;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleOpenNotification(n)}
                      className={`w-full text-right px-5 py-4 flex gap-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                        !n.isRead ? "bg-[#C9A227]/[0.07]" : ""
                      }`}
                    >
                      <span className={`material-symbols-outlined ${meta.color} text-xl mt-0.5 flex-shrink-0`}>
                        {meta.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold text-[13px] ${!n.isRead ? "text-white" : "text-white/70"}`}
                          >
                            {n.title}
                          </span>
                          {!n.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227] flex-shrink-0"></span>
                          )}
                        </div>
                        <p className="text-white/45 text-[12px] mt-1 leading-relaxed line-clamp-2">
                          {n.previewMessage}
                        </p>
                        <span className="text-white/30 text-[10px] mt-1.5 block">
                          {formatRelative(n.createdAt)}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {items.length > 0 && (
              <div className="px-5 py-3 border-t border-white/10 text-center">
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate("/dashboard");
                  }}
                  className="text-[#C9A227] text-xs font-bold hover:underline"
                >
                  عرض جميع الإشعارات
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {detailItem && (
        <DecisionDetailModal notification={detailItem} onClose={() => setDetailItem(null)} />
      )}
    </>
  );
}
