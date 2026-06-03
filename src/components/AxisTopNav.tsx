import { Link } from "react-router-dom";

interface AxisTopNavProps {
  prevPath?: string;
  nextPath?: string;
  isNextDisabled?: boolean;
  nextTitle?: string;
}

export default function AxisTopNav({ prevPath, nextPath, isNextDisabled = false, nextTitle }: AxisTopNavProps) {
  return (
    <div className="flex items-center gap-3 mb-8 bg-[#022C22]/5 p-2 rounded-2xl border border-[#E5DED0] w-fit" dir="rtl">
      {/* Previous Axis */}
      {prevPath ? (
        <Link 
          to={prevPath} 
          title="المحور السابق"
          aria-label="المحور السابق"
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-[#E5DED0] text-[#064E3B] hover:bg-[#064E3B] hover:text-white transition-all shadow-sm group"
        >
          <span className="material-symbols-outlined group-active:scale-90 transition-transform">arrow_forward</span>
        </Link>
      ) : (
        <button 
          disabled 
          title="لا يوجد محور سابق"
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/50 border border-gray-200 text-gray-300 cursor-not-allowed shadow-inner"
        >
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      )}

      {/* Dashboard / Home */}
      <Link 
        to="/dashboard" 
        title="العودة إلى لوحة المتابعة"
        aria-label="العودة إلى لوحة المتابعة"
        className="w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-[#E5DED0] text-[#064E3B] hover:bg-[#064E3B] hover:text-white transition-all shadow-sm group"
      >
        <span className="material-symbols-outlined group-active:scale-90 transition-transform">grid_view</span>
      </Link>

      {/* Next Axis */}
      {nextPath && !isNextDisabled ? (
        <Link 
          to={nextPath} 
          title="المحور التالي"
          aria-label="المحور التالي"
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-[#E5DED0] text-[#064E3B] hover:bg-[#064E3B] hover:text-white transition-all shadow-sm group"
        >
          <span className="material-symbols-outlined group-active:scale-90 transition-transform">arrow_back</span>
        </Link>
      ) : (
        <button 
          disabled 
          title={nextTitle || "المحور التالي غير متوفر حالياً"}
          className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/50 border border-gray-200 text-gray-300 cursor-not-allowed shadow-inner"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      )}
    </div>
  );
}
