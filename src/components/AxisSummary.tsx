import React from 'react';
import { Link } from 'react-router-dom';

interface SummaryItemProps {
  label: string;
  isActive: boolean | null;
}

export function SummaryItem({ label, isActive }: SummaryItemProps) {
  return (
    <div className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all pt-5 ${isActive ? 'bg-green-50/50 border-green-100 shadow-sm' : 'bg-gray-50/30 border-gray-100 opacity-60'}`}>
       <span className={`text-[11px] font-black truncate max-w-[150px] ${isActive ? 'text-green-900 border-b border-green-200 pb-1' : 'text-[#64748B]'}`}>{label}</span>
       <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isActive ? 'bg-green-500 text-white shadow-md shadow-green-200' : 'bg-gray-200 text-white'}`}>
         <span className="material-symbols-outlined text-[16px] font-bold">
           {isActive ? 'check' : 'close'}
         </span>
       </div>
    </div>
  );
}

interface AxisSummaryProps {
  title: string;
  icon: string;
  items: { label: string; isActive: boolean | null }[];
  percentage: number;
  status: string;
  subTitle: string;
  saving?: boolean;
  onSave?: () => void;
  backLink: string;
}

export function AxisSummary({ title, icon, items, percentage, status, subTitle, saving, onSave, backLink, children }: AxisSummaryProps & { children?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[40px] border border-[#E5DED0] p-8 md:p-12 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#064E3B]/5 rounded-bl-[100px]"></div>
      
      <div className="flex items-center gap-3 mb-8 relative z-10 w-full">
         <div className="w-12 h-12 bg-[#022C22] text-[#C9A227] rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">{icon}</span>
         </div>
         <h3 className="text-2xl font-bold text-[#022C22]">{title}</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 relative z-10">
         {items.map((item, idx) => (
           <SummaryItem key={idx} label={item.label} isActive={item.isActive} />
         ))}
      </div>

      <div className="mt-12 pt-8 border-t border-[#E5DED0] flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
         <div className="flex items-center gap-8">
            <div className="w-24 h-24 rounded-full border-[6px] border-[#E5DED0] flex items-center justify-center relative shadow-inner shrink-0">
               <svg className="absolute w-full h-full -rotate-90">
                  <circle
                    cx="48" cy="48" r="41"
                    fill="transparent" stroke="#C9A227" strokeWidth="6"
                    strokeDasharray={257.6}
                    strokeDashoffset={257.6 - (257.6 * percentage / 100)}
                    className="transition-all duration-1000"
                  />
               </svg>
               <span className="relative text-xl font-black text-[#022C22]">{percentage}%</span>
            </div>
            <div>
               <div className="text-xs font-black text-[#64748B] uppercase tracking-widest mb-1">حالة هذا المحور</div>
               <div className={`text-2xl font-black ${percentage === 100 ? 'text-[#064E3B]' : 'text-[#C9A227]'}`}>{status}</div>
               <div className="text-[10px] text-[#64748B] mt-1 font-bold">{subTitle}</div>
            </div>
         </div>
         
         <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto mt-6 md:mt-0">
            {children ? children : (
              <>
                {onSave && (
                   <button onClick={onSave} disabled={saving} className="bg-[#C9A227] text-white hover:bg-[#B38D1F] w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold flex flex-row items-center justify-center gap-2">
                     <span className="material-symbols-outlined">{saving ? 'hourglass_empty' : 'save'}</span>
                     {saving ? 'جاري الحفظ...' : 'حفظ التقدم'}
                   </button>
                )}
                <Link to={backLink} className="px-8 py-3.5 bg-white text-[#064E3B] border-2 border-[#064E3B] hover:bg-[#064E3B]/5 rounded-xl font-bold transition-all text-center flex flex-row items-center justify-center gap-2">
                   <span className="material-symbols-outlined relative top-0.5" style={{ fontSize: "18px" }}>arrow_forward</span>
                   العودة للوحة الرئيسية
                </Link>
              </>
            )}
         </div>
      </div>
    </div>
  );
}
