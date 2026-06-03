import React from "react";
import { Link } from "react-router-dom";

interface CustomizedDashboardViewProps {
  academyName: string;
  academyLogo: string | null;
  selectedClassification: string;
  totalProgress: number;
  registryCounts: { management: number; technical: number; medical: number };
  activeAxes: any[];
  getAxisStatus: (storageKey: string | null) => any;
  nextStepAxis: any | null;
  isRegistryFinished: boolean;
  onNavigateToRegistry: () => void;
  onContinueLastAxis: () => void;
  onScrollToMissing: () => void;
  onChangeClassification: () => void; // This takes them back to general dashboard
  onStartApplication: () => void;
  onFinalSubmit: () => void;
}

export default function CustomizedDashboardView({
  academyName,
  academyLogo,
  selectedClassification,
  totalProgress,
  registryCounts,
  activeAxes,
  getAxisStatus,
  nextStepAxis,
  isRegistryFinished,
  onNavigateToRegistry,
  onContinueLastAxis,
  onScrollToMissing,
  onChangeClassification,
  onStartApplication,
  onFinalSubmit,
}: CustomizedDashboardViewProps) {
  if (selectedClassification === 'AffiliationOnly') {
    return (
      <main className="max-w-[1000px] mx-auto px-4 md:px-6 py-10 pb-24 space-y-10 animate-in fade-in duration-700">
        <div>
          <h1 className="font-display-md text-3xl md:text-4xl font-bold text-[#064E3B] mb-4">
            نظام الانتساب فقط
          </h1>
          <p className="text-[#64748B] text-lg leading-relaxed max-w-3xl">
            أهلاً بكم في نظام الانتساب الرسمي بالاتحاد اللبناني لكرة القدم.
          </p>
        </div>

        <div className="bg-[#022C22] text-white rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
           <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-[#C9A227] text-[#022C22] px-4 py-1.5 rounded-full font-bold text-sm">
                تنبيه هام
              </div>
              <h2 className="text-3xl font-bold">الانتساب ليس تصنيفاً</h2>
              <p className="text-white/70 text-lg leading-relaxed">
                الانتساب فقط يمنح الأكاديمية صفة رسمية تحت مظلة الاتحاد، ولا يفتح ملف التصنيف أو المشاركة في المسابقات الرسمية للأكاديميات. يمكنكم التقدم للتصنيف A أو B لاحقاً عند الجاهزية.
              </p>
              <div className="flex flex-wrap gap-4 pt-4 border-t border-white/10">
                 <Link to="/academy-registry" className="px-8 py-4 bg-[#C9A227] text-[#022C22] rounded-xl font-bold hover:bg-[#D4B145] transition-all">إدارة سجل الأكاديمية</Link>
                 <button onClick={onChangeClassification} className="px-8 py-4 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 border border-white/20 transition-all">تغيير نوع الطلب</button>
              </div>
           </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[1000px] mx-auto px-4 md:px-6 py-10 pb-24 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Academy Selected Header */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[32px] border border-[#E5DED0] shadow-sm">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-[#F6F1E7] rounded-2xl border-2 border-[#064E3B]/10 p-1 flex items-center justify-center shadow-inner shrink-0 cursor-pointer" onClick={onNavigateToRegistry}>
              {academyLogo ? (
                <img src={academyLogo} alt="Academy Logo" className="max-w-full max-h-full object-contain" />
              ) : (
                <span className="material-symbols-outlined text-[#064E3B] text-4xl">domain</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="font-display-md text-2xl md:text-3xl font-black text-[#022C22]">
                  {academyName ? `أكاديمية ${academyName}` : "لوحة متابعة ملف الأكاديمية"}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${selectedClassification === 'A' ? 'bg-[#064E3B] text-white border-[#064E3B]' : 'bg-[#C9A227] text-[#022C22] border-[#C9A227]'}`}>
                  ملف تصنيف {selectedClassification}
                </span>
                <span className="text-[#64748B] text-xs font-bold">
                  {selectedClassification === 'A' ? 'المستوى الاحترافي المتكامل' : 'مستوى التطوير والاساسيات'}
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={onChangeClassification}
            className="text-xs font-bold text-[#64748B] hover:text-[#064E3B] flex items-center gap-1 border-b border-dashed border-[#64748B] hover:border-[#064E3B] transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">swap_horiz</span>
            تغيير نوع التصنيف
          </button>
        </div>

        <div className="bg-[#FFFDF7] p-3 rounded-2xl border border-[#E5DED0] shadow-sm flex flex-wrap gap-2">
            <Link to="/academy-registry" className="flex items-center gap-2 px-5 py-2.5 bg-[#064E3B] text-white rounded-xl font-bold text-sm hover:bg-[#022C22] transition-all shadow-sm">
              <span className="material-symbols-outlined text-[20px]">group</span>
              إدارة سجل التصنيف
            </Link>
            <button onClick={onContinueLastAxis} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E5DED0] text-[#022C22] rounded-xl font-bold text-sm hover:bg-gray-50 transition-all shadow-sm">
              <span className="material-symbols-outlined text-[20px]">history</span>
              متابعة العمل
            </button>
            <button onClick={onScrollToMissing} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E5DED0] text-[#022C22] rounded-xl font-bold text-sm hover:bg-gray-50 transition-all shadow-sm">
              <span className="material-symbols-outlined text-[20px]">list_alt</span>
              عرض النواقص
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Progress Card */}
        <div className="md:col-span-2 bg-[#FFFDF7] rounded-3xl p-6 md:p-8 shadow-sm border border-[#E5DED0] flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between md:items-start gap-4 mb-6">
            <div>
              <div className="text-sm font-bold text-[#064E3B] mb-2">حالة الطلب الحالي</div>
              <div className="inline-flex items-center gap-2 bg-[#F6F1E7] border border-[#E5DED0] px-4 py-2 rounded-xl text-[#022C22] font-bold">
                <span className="material-symbols-outlined text-[20px] text-[#C9A227]">edit_document</span>
                مسودة - قيد الإعداد
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-[#064E3B] mb-2">إجمالي اكتمال التصنيف</div>
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold text-[#022C22]">
                  {totalProgress}%
                </div>
                <div className="w-32 h-3 bg-[#E5DED0] rounded-full overflow-hidden hidden sm:block">
                  <div className="h-full bg-[#C9A227] transition-all duration-1000" style={{ width: `${totalProgress}%` }}></div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-[#64748B] text-xs leading-relaxed border-t border-[#E5DED0] pt-4 mt-auto">
            توضح هذه الصفحة تقدمك في استكمال محاور تصنيف {selectedClassification}. يرجى استكمال كافة المرفقات المطلوبة ليتم تفعيل زر الإرسال النهائي.
          </p>
        </div>

        {/* Registry Summary */}
        <div className="bg-[#022C22] text-white rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#C9A227] text-[#022C22] rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined">group</span>
            </div>
            <h3 className="font-bold text-lg">سجل الأكاديمية</h3>
          </div>
          <div className="space-y-4 flex-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/70">الإدارة</span>
              <span className="font-bold">{registryCounts.management}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/70">الجهاز الفني</span>
              <span className="font-bold">{registryCounts.technical}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/70">الجهاز الطبي</span>
              <span className="font-bold">{registryCounts.medical}</span>
            </div>
          </div>
          <Link to="/academy-registry" className="mt-6 w-full py-3 bg-[#C9A227] text-[#022C22] rounded-xl font-bold text-sm text-center hover:bg-[#D4B145] transition-colors">
            إدارة الكوادر
          </Link>
          <div className={`mt-3 text-center text-[10px] font-bold ${isRegistryFinished ? 'text-green-400' : 'text-amber-400'}`}>
            {isRegistryFinished ? 'سجل الكوادر مكتمل' : 'السجل يحتاج استكمال'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Axes List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-[#022C22] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#064E3B]">list_alt</span>
              محاور تصنيف {selectedClassification}
            </h2>
            <span className="text-xs font-bold text-[#64748B] bg-white border border-[#E5DED0] px-3 py-1 rounded-full">{activeAxes.length} محاور</span>
          </div>
          
          <div className="space-y-3">
            {activeAxes.map((axis, i) => {
              const status = getAxisStatus(axis.storageKey);
              const isLocked = !isRegistryFinished && axis.isBuilt;
              
              return (
                <div 
                  key={i} 
                  className={`relative overflow-hidden p-4 bg-white border ${axis.isBuilt ? 'border-[#E5DED0] hover:border-[#064E3B]' : 'border-dashed border-[#E5DED0] opacity-60'} rounded-2xl transition-all group shadow-sm`}
                >
                  {axis.isBuilt && status.percent > 0 && !isLocked && (
                    <div 
                      className={`absolute top-0 right-0 bottom-0 ${status.percent === 100 ? 'bg-green-500/5' : 'bg-[#064E3B]/5'} transition-all`} 
                      style={{ width: `${status.percent}%` }}
                    ></div>
                  )}

                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${axis.isBuilt ? 'bg-[#064E3B] text-white shadow-sm' : 'bg-gray-100 text-gray-400'}`}>
                        {i + 1}
                      </div>
                      <div>
                        <div className="font-bold text-[#022C22]">{axis.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs font-bold ${isLocked ? 'text-amber-600' : status.color}`}>
                            {isLocked ? 'بانتظار السجل' : status.label}
                          </span>
                          {!isLocked && axis.isBuilt && (
                            <span className="text-[10px] font-bold text-[#64748B]">
                              {status.percent}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {axis.isBuilt && !isLocked && (
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden md:block">
                          <div className={`h-full ${status.fill}`} style={{ width: `${status.percent}%` }}></div>
                        </div>
                      )}

                      {axis.isBuilt ? (
                        isLocked ? (
                          <button onClick={onNavigateToRegistry} className="px-5 py-2 bg-amber-50 text-amber-600 rounded-xl font-bold text-xs border border-amber-200 hover:bg-amber-100 transition-all">
                             استكمل السجل
                          </button>
                        ) : (
                          <Link 
                            to={axis.route} 
                            onClick={() => localStorage.setItem("lastOpenedAxis", axis.route)}
                            className="px-5 py-2 bg-white border border-[#E5DED0] text-[#064E3B] rounded-xl font-bold text-xs hover:bg-[#064E3B] hover:text-white transition-all shadow-sm flex items-center gap-2"
                          >
                            متابعة
                            <span className="material-symbols-outlined text-[16px] rotate-180">arrow_right_alt</span>
                          </Link>
                        )
                      ) : (
                        <span className="px-5 py-2 bg-gray-50 text-gray-400 rounded-xl font-bold text-xs">قريباً</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Next Step */}
          {nextStepAxis && isRegistryFinished && (
            <div className="bg-[#022C22] text-white rounded-3xl p-6 shadow-lg border-r-4 border-[#C9A227] relative overflow-hidden">
              <h3 className="font-bold text-[#C9A227] text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">auto_awesome</span>
                الخطوة التالية
              </h3>
              <p className="text-white/80 leading-relaxed mb-6 text-sm italic">
                بناءً على تقدمك الحالي، ننصح بالعمل على محور {nextStepAxis.name} لاستكمال متطلبات التصنيف.
              </p>
              <Link 
                to={nextStepAxis.route}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#C9A227] text-[#022C22] rounded-xl font-bold text-sm w-full justify-center hover:bg-[#D4B145] transition-colors shadow-md"
              >
                فتح محور {nextStepAxis.name}
              </Link>
            </div>
          )}

          {/* Registry Missing Alert */}
          {!isRegistryFinished && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 text-amber-900">
               <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-amber-600">report_problem</span>
                  <h3 className="font-bold text-lg">سجل الأكاديمية ناقص</h3>
               </div>
               <p className="text-sm leading-relaxed mb-6">
                  لا يمكنك البدء بتعبئة محاور التصنيف قبل استكمال الحد الأدنى من الكوادر (المالك، المدير، المدربين، الجهاز الطبي). يتم سحب هذه البيانات تلقائياً للمحاور.
               </p>
               <Link to="/academy-registry" className="block w-full py-3 bg-amber-600 text-white rounded-xl font-bold text-center text-sm shadow-md hover:bg-amber-700 transition-colors">
                  استكمال السجل الآن
               </Link>
            </div>
          )}

          {/* Tips */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E5DED0]">
            <h3 className="font-bold text-[#022C22] text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#C9A227]">tips_and_updates</span>
              توجيهات العمل
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-3 items-start">
                <span className="material-symbols-outlined text-[#064E3B] text-[18px] mt-0.5">check_circle</span>
                <span className="text-sm text-[#64748B] leading-relaxed">المستندات المرفوعة في السجل تظهر تلقائياً في المحاور لتقليل الجهد.</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="material-symbols-outlined text-[#064E3B] text-[18px] mt-0.5">check_circle</span>
                <span className="text-sm text-[#64748B] leading-relaxed">تأكد من وضوح صور المرفقات لضمان قبولها من لجنة التقييم.</span>
              </li>
            </ul>
          </div>
          
          <div id="missing-requirements" className="bg-[#F6F1E7] rounded-3xl p-6 border border-[#E5DED0]">
            <div className="flex items-center justify-between mb-4">
               <h3 className="font-bold text-[#022C22] text-lg">النواقص الحالية</h3>
               <span className="text-[10px] font-black bg-[#E5DED0] px-2 py-0.5 rounded uppercase">حسب التصنيف {selectedClassification}</span>
            </div>
            <div className="space-y-3">
               {!isRegistryFinished && <div className="text-xs text-amber-700 font-bold flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> سجل الكوادر البشرية غير مكتمل</div>}
               {activeAxes.map((axis, i) => {
                  const status = getAxisStatus(axis.storageKey);
                  if (status.percent < 100 && axis.isBuilt) {
                    return (
                      <div key={i} className="text-xs text-[#64748B] font-bold flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#E5DED0]"></div>
                        محور {axis.name} ({100 - status.percent}% متبقي)
                      </div>
                    )
                  }
                  return null;
               })}
            </div>
          </div>
        </div>
      </div>

      {/* Submission Footer */}
      <div className="bg-white rounded-[32px] border border-[#E5DED0] overflow-hidden shadow-md mt-6">
        <div className={`p-8 ${totalProgress === 100 ? 'bg-green-50' : 'bg-gray-50'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex-1">
              <h3 className="text-2xl font-black text-[#022C22] mb-2 flex items-center gap-3">
                <span className={`material-symbols-outlined text-3xl ${totalProgress === 100 ? 'text-green-600' : 'text-[#64748B]'}`}>
                  {totalProgress === 100 ? 'verified' : 'pending_actions'}
                </span>
                جاهزية الملف للإرسال
              </h3>
              <p className="text-[#64748B] text-lg leading-relaxed max-w-2xl">
                {totalProgress === 100 
                  ? `بإمكانك الآن تقديم طلب تصنيف ${selectedClassification} رسمياً للاتحاد.`
                  : `يجب استكمال كافة المحاور (100%) لتمكين خيار الإرسال النهائي.`
                }
              </p>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-black text-[#022C22]">{totalProgress}%</div>
                  <div className="text-[10px] font-black text-[#64748B]">الإنجاز الإجمالي</div>
                </div>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white border-t border-[#E5DED0] flex flex-col sm:flex-row gap-4">
           <button 
             disabled={totalProgress < 100}
             onClick={onFinalSubmit}
             className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${totalProgress === 100 ? 'bg-[#064E3B] text-white hover:bg-[#022C22]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
           >
             <span className="material-symbols-outlined">send</span>
             تقديم الملف للاتحاد
           </button>
        </div>
      </div>
    </main>
  );
}
