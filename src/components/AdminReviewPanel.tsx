import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { getCurrentSession } from "../lib/auth";

export default function AdminReviewPanel() {
  const location = useLocation();
  const session = getCurrentSession();
  const adminViewUid = session?.isAdmin ? localStorage.getItem("adminViewUid") : null;
  const axisKey = location.pathname.replace(/\//g, "_").replace(/^_/, "");

  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!adminViewUid || !axisKey || !location.pathname.includes('/classification')) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", adminViewUid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const axisReviews = data.adminAxisReviews || {};
          const review = axisReviews[axisKey] || { status: "pending", notes: "" };
          setNotes(review.notes || "");
          setStatus(review.status || "pending");
        }
      } catch (e) {
        console.error("Failed to load admin review", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [adminViewUid, axisKey, location.pathname]);

  const handleSave = async () => {
    if (!adminViewUid || !axisKey) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, "users", adminViewUid);
      const userDoc = await getDoc(userRef);
      const axisReviews = userDoc.exists() ? (userDoc.data().adminAxisReviews || {}) : {};
      
      axisReviews[axisKey] = {
        status,
        notes,
        updatedAt: Date.now()
      };

      await updateDoc(userRef, { adminAxisReviews: axisReviews });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (e) {
      console.error("Failed to save admin review", e);
      alert("حدث خطأ أثناء الحفظ");
    } finally {
      setIsSaving(false);
    }
  };

  if (!adminViewUid || !location.pathname.includes('/classification')) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border-t-4 border-blue-600 z-[70] transition-transform duration-300" dir="rtl">
      {/* Toast Notification */}
      <div className={`absolute -top-12 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg font-bold flex items-center gap-2 transition-all duration-300 ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'}`}>
        <span className="material-symbols-outlined text-[18px]">check_circle</span>
        تم حفظ التقييم بنجاح
      </div>

      <div className="max-w-[1240px] mx-auto px-4 py-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="w-full md:w-auto shrink-0 font-bold flex items-center gap-2 text-blue-800">
           <span className="material-symbols-outlined">shield_person</span>
           تقييم الإدارة للمحور:
        </div>

        <div className="flex-1 w-full">
           <input 
             type="text" 
             value={notes}
             onChange={(e) => setNotes(e.target.value)}
             placeholder="أضف ملاحظاتك أو أسباب الرفض (مرئية للإدارة فقط)..." 
             className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-sm"
           />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
           <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-green-50 transition-colors bg-white">
             <input type="radio" name="admin_axis_status" value="approved" checked={status === 'approved'} onChange={() => setStatus('approved')} className="w-4 h-4 accent-green-600" />
             <span className="text-sm font-bold text-green-700">مقبول</span>
           </label>
           <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg hover:bg-red-50 transition-colors bg-white">
             <input type="radio" name="admin_axis_status" value="rejected" checked={status === 'rejected'} onChange={() => setStatus('rejected')} className="w-4 h-4 accent-red-600" />
             <span className="text-sm font-bold text-red-700">مرفوض</span>
           </label>
           <button 
             onClick={handleSave}
             disabled={isSaving}
             className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm shadow flex items-center gap-2 disabled:opacity-50 transition-all ml-4"
           >
             {isSaving ? <span className="material-symbols-outlined animate-spin text-[18px]">sync</span> : <span className="material-symbols-outlined text-[18px]">save</span>}
             حفظ التقييم
           </button>
        </div>
      </div>
    </div>
  );
}
