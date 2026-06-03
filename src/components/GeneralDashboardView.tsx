import React from "react";
import { Link } from "react-router-dom";

interface GeneralDashboardViewProps {
  academyName: string;
  academyLogo: string | null;
  isRegistryFinished: boolean;
  registryCounts: { management: number; technical: number; medical: number };
  selectedClassification: string | null;
  onSelectClassification: (cls: string) => void;
  onNavigateToRegistry: () => void;
}

export default function GeneralDashboardView({
  academyName,
  academyLogo,
  isRegistryFinished,
  registryCounts,
  selectedClassification,
  onSelectClassification,
  onNavigateToRegistry,
}: GeneralDashboardViewProps) {
  return (
    <main className="max-w-[1000px] mx-auto px-4 md:px-6 py-10 pb-24 space-y-10 animate-in fade-in duration-700">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[40px] border border-[#E5DED0] shadow-sm">
        <div className="flex items-center gap-6">
          <div 
            className="w-24 h-24 bg-[#F6F1E7] rounded-[32px] border-2 border-[#064E3B]/10 p-2 flex items-center justify-center shadow-inner shrink-0 cursor-pointer hover:scale-105 transition-transform"
            onClick={onNavigateToRegistry}
          >
            {academyLogo ? (
              <img src={academyLogo} alt="Academy Logo" className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="material-symbols-outlined text-[#064E3B] text-5xl">domain</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="font-display-md text-3xl md:text-3xl font-black text-[#022C22]">
                أكاديمية {academyName || "..."}
              </h1>
              {isRegistryFinished && (
                <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black border border-green-200">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  السجل مكتمل
                </span>
              )}
            </div>
            <p className="text-[#64748B] font-bold text-sm">مرحباً بك في لوحة التحكم العامة لنظام التصنيف</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Registry Card */}
        <div className={`md:col-span-2 rounded-[40px] p-8 md:p-10 border transition-all flex flex-col justify-between ${isRegistryFinished ? 'bg-white border-[#064E3B] shadow-lg shadow-[#064E3B]/5' : 'bg-white border-[#E5DED0] shadow-sm'}`}>
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isRegistryFinished ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                <span className="material-symbols-outlined text-3xl">
                  {isRegistryFinished ? 'verified_user' : 'group_add'}
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#022C22]">
                  {isRegistryFinished ? "سجل الكوادر مكتمـل" : "استكمال سجل الأكاديمية"}
                </h3>
                <p className="text-[#64748B] font-bold text-sm">المرحلة الأولى: توثيق الفريق الإداري والفني</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-8">
              <p className="text-[#64748B] leading-relaxed">
                {isRegistryFinished 
                  ? "لقد قمت بإضافة كافة الأدوار الأساسية المطلوبة. يمكنك الآن مراجعة بيانات فريقك أو اختيار مستوى التصنيف للبدء."
                  : "يتطلب نظام التصنيف إضافة الأدوار الأساسية (المالك، المدير، المدربين، الجهاز الطبي) لفتح ملف المحاور الفنية."
                }
              </p>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-[#F6F1E7] px-4 py-2 rounded-xl text-xs font-bold text-[#022C22] border border-[#E5DED0]">
                  <span className="material-symbols-outlined text-[18px] text-[#064E3B]">badge</span>
                  {registryCounts.management} إداريين
                </div>
                <div className="flex items-center gap-2 bg-[#F6F1E7] px-4 py-2 rounded-xl text-xs font-bold text-[#022C22] border border-[#E5DED0]">
                  <span className="material-symbols-outlined text-[18px] text-[#064E3B]">sports_soccer</span>
                  {registryCounts.technical} مدربين
                </div>
                <div className="flex items-center gap-2 bg-[#F6F1E7] px-4 py-2 rounded-xl text-xs font-bold text-[#022C22] border border-[#E5DED0]">
                  <span className="material-symbols-outlined text-[18px] text-[#064E3B]">medical_services</span>
                  {registryCounts.medical} جهاز طبي
                </div>
              </div>
            </div>
          </div>

          <Link to="/academy-registry" className={`w-full py-5 rounded-2xl font-black text-center transition-all flex items-center justify-center gap-3 ${isRegistryFinished ? 'bg-white border-2 border-[#064E3B] text-[#064E3B] hover:bg-[#064E3B] hover:text-white' : 'bg-[#064E3B] text-white hover:bg-[#022C22] shadow-xl'}`}>
            <span className="material-symbols-outlined">group</span>
            {isRegistryFinished ? 'مراجعة وتعديل السجل' : 'البدء بإضافة الكوادر'}
          </Link>
        </div>

        {/* Locked Pillar Access Card */}
        <div className="rounded-[40px] p-8 md:p-10 border bg-gray-50 border-[#E5DED0] opacity-80 transition-all flex flex-col justify-between">
          <div className="space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-gray-200 text-gray-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">lock</span>
            </div>
            <div>
              <h3 className="text-2xl font-black mb-2 text-gray-400">محاور التصنيف</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                سيتم تفعيل هذا القسم فور اختيار نوع التصنيف واكتمال الحد الأدنى من سجل الكوادر البشرية.
              </p>
            </div>
          </div>
          <div className="mt-8">
            <div className="w-full py-5 bg-gray-200 text-gray-400 rounded-2xl font-black text-center border border-gray-300">
              بانتظار الاختيار...
            </div>
          </div>
        </div>
      </div>

      {/* Classification Guide Section */}
      <div className="space-y-12">
        <div className="bg-[#064E3B] text-white rounded-3xl p-6 md:p-8 shadow-lg relative overflow-hidden transform hover:scale-[1.01] transition-all duration-300">
          <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-white/5 to-transparent pointer-events-none"></div>
          <div className="absolute -top-12 -left-12 opacity-10 pointer-events-none text-white">
            <span className="material-symbols-outlined text-[150px]">menu_book</span>
          </div>
          <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="w-16 h-16 bg-[#C9A227]/20 border border-[#C9A227]/30 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
              <span className="material-symbols-outlined text-4xl text-[#C9A227]">menu_book</span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-[#C9A227] mb-2">دليل اختيار التصنيف</h2>
              <p className="text-white/90 font-medium leading-relaxed text-lg">
                يحدد نوع التصنيف الفوارق الجوهرية في متطلبات الجهاز الإداري والفني والمنهجية المتبعة. يرجى مراجعة الجدول والهيكل التنظيمي المقترح قبل الاختيار.
              </p>
            </div>
          </div>
        </div>

        {/* Hierarchy Examples */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Classification A Structure */}
          <div className="bg-white rounded-[32px] p-6 md:p-10 border border-[#E5DED0] shadow-sm flex flex-col h-full hover:border-[#064E3B] transition-all group">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#064E3B] text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg group-hover:scale-110 transition-transform">A</div>
                <div className="text-right">
                  <h3 className="text-xl font-bold text-[#022C22]">هيكل الأكاديمية - تصنيف A</h3>
                  <p className="text-xs text-[#64748B] font-bold">المستوى الاحترافي المتكامل</p>
                </div>
              </div>
            </div>
            {/* Owner Node */}
            <div className="flex justify-center mb-4">
              <div className="bg-white border-2 border-[#064E3B]/10 p-5 rounded-3xl flex items-center justify-between shadow-md w-full max-w-[420px]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#064E3B] rounded-xl flex items-center justify-center text-white"><span className="material-symbols-outlined">person</span></div>
                  <div className="text-right">
                    <div className="text-sm font-black text-[#022C22]">المالك</div>
                    <div className="text-xs text-[#64748B] font-bold">رأس الهرم</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center"><div className="w-0.5 h-8 bg-gray-200"></div></div>
            {/* Admin Manager Node */}
            <div className="bg-[#F8F9FA] border border-[#E5DED0] p-6 rounded-3xl flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#064E3B] rounded-xl flex items-center justify-center text-[#C9A227]"><span className="material-symbols-outlined">account_balance</span></div>
                <div className="text-right">
                  <div className="text-lg font-black text-[#022C22]">المدير الإداري</div>
                  <div className="text-[10px] font-bold text-[#64748B]">مسؤول القسم الإداري والمالي</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div className="space-y-2">
                  <div className="text-[10px] font-black text-[#064E3B] uppercase">القسم الإداري</div>
                  <div className="text-[11px] font-bold text-[#64748B]">• مسؤول مالي</div>
                  <div className="text-[11px] font-bold text-[#64748B]">• مسؤول إعلامي</div>
                </div>
                <div className="space-y-2">
                  <div className="text-[10px] font-black text-[#C9A227] uppercase">القسم الفني</div>
                  <div className="text-[11px] font-bold text-[#64748B]">• مشرف فني</div>
                  <div className="text-[11px] font-bold text-[#64748B]">• مدربين (4 فئات)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Classification B Structure */}
          <div className="bg-white rounded-[32px] p-6 md:p-10 border border-[#E5DED0] shadow-sm flex flex-col h-full hover:border-[#022C22] transition-all group">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#022C22] text-[#C9A227] rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg group-hover:scale-110 transition-transform">B</div>
                <div className="text-right">
                  <h3 className="text-xl font-bold text-[#022C22]">هيكل الأكاديمية - تصنيف B</h3>
                  <p className="text-xs text-[#64748B] font-bold">مستوى التطوير والأساسيات</p>
                </div>
              </div>
            </div>
            {/* Owner Node */}
            <div className="flex justify-center mb-4">
              <div className="bg-white border-2 border-[#022C22]/10 p-5 rounded-3xl flex items-center justify-between shadow-md w-full max-w-[420px]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#022C22] rounded-xl flex items-center justify-center text-[#C9A227]"><span className="material-symbols-outlined">person</span></div>
                  <div className="text-right">
                    <div className="text-sm font-black text-[#022C22]">المالك</div>
                    <div className="text-xs text-[#64748B] font-bold">رأس الهرم</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center"><div className="w-0.5 h-8 bg-gray-200"></div></div>
            {/* General Supervisor Node */}
            <div className="bg-[#FDFBF7] border border-[#E5DED0] p-6 rounded-3xl flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#C9A227]/10 rounded-xl flex items-center justify-center text-[#C9A227] shadow-inner"><span className="material-symbols-outlined">manage_accounts</span></div>
                <div className="text-right">
                  <div className="text-lg font-black text-[#022C22]">المشرف العام</div>
                  <div className="text-[10px] font-bold text-[#64748B]">يدمج المهام الفنية والإدارية</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div className="space-y-2">
                  <div className="text-[10px] font-black text-[#022C22] uppercase">القسم الإداري</div>
                  <div className="text-[11px] font-bold text-[#64748B]">• منسق إداري</div>
                </div>
                <div className="space-y-2">
                  <div className="text-[10px] font-black text-[#C9A227] uppercase">القسم الفني والمدربين</div>
                  <div className="text-[11px] font-bold text-[#64748B]">• مدربين (فئتان)</div>
                  <div className="text-[11px] font-bold text-[#64748B]">• معالج / مسعف</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Axes Table */}
        <div className="bg-[#FFFDF7] rounded-3xl shadow-sm border border-[#E5DED0] overflow-hidden">
          <div className="p-6 md:p-8 border-b border-[#E5DED0] bg-gray-50/50">
            <h2 className="text-2xl font-bold text-[#022C22] mb-3">المحاور العشر للتصنيف</h2>
            <p className="text-[#64748B] leading-relaxed text-sm max-w-4xl">
              توزع متطلبات التصنيف على عشرة محاور استراتيجية توضح الفرق في الجاهزية بين المستويين.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-[#022C22] text-[#C9A227]">
                  <th className="py-4 px-6 font-bold text-sm">المحور</th>
                  <th className="py-4 px-6 font-bold text-sm border-r border-[#064E3B]">مستوى A</th>
                  <th className="py-4 px-6 font-bold text-sm border-r border-[#064E3B]">مستوى B</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {[
                  { axis: "القيادة", a: "إدارة متكاملة وواضحة", b: "إدارة أساسية" },
                  { axis: "التخطيط", a: "خطة واضحة للتطوير", b: "تخطيط أسبوعي بسيط" },
                  { axis: "التنظيم", a: "تنظيم إداري متقدم", b: "تنظيم أساسي" },
                  { axis: "الجانب الفني", a: "برنامج تدريبي متكامل", b: "تدريب عام" },
                  { axis: "الميزانية", a: "ميزانية واضحة ومفصلة", b: "ميزانية عامة" },
                  { axis: "الملعب والمرافق", a: "ملعب ومرافق معتمدة", b: "ملعب بإمكانات محدودة" },
                  { axis: "الصحة", a: "متابعة صحية منتظمة/تأمين", b: "متابعة صحية منتظمة/تأمين" },
                  { axis: "الرعاية والتعليم", a: "برامج رعاية وسياسة حماية الطفل", b: "تطبيق سياسة حماية الطفل" },
                  { axis: "المعدات والتجهيزات", a: "تجهيزات كاملة وموحدة", b: "تجهيزات أساسية" },
                  { axis: "التواصل الاجتماعي", a: "محتوى نشط ومنظم", b: "محتوى بسيط وعام" },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-[#E5DED0] hover:bg-[#F6F1E7]/50 transition-colors">
                    <td className="py-3 px-6 font-bold text-[#064E3B] text-xs">{row.axis}</td>
                    <td className="py-3 px-6 text-[#111827] border-r border-[#E5DED0] text-xs">{row.a}</td>
                    <td className="py-3 px-6 text-[#111827] border-r border-[#E5DED0] text-xs">{row.b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Path Selection */}
      <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-[#E5DED0]">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#022C22] mb-4">اختيار مسار الأكاديمية</h2>
          <p className="text-[#64748B] text-lg max-w-2xl mx-auto leading-relaxed">
            بناءً على التقييم الذاتي لجاهزيتكم، حدد المسار الذي ستبدأ العمل عليه.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div 
            onClick={() => onSelectClassification('A')}
            className={`group relative p-8 rounded-[32px] border-2 cursor-pointer transition-all duration-500 flex flex-col h-full bg-[#022C22] text-white shadow-lg overflow-hidden ${selectedClassification === 'A' ? 'border-[#C9A227] ring-4 ring-[#C9A227]/10' : 'border-[#064E3B] hover:border-[#C9A227]'}`}
          >
            {/* Premium Glow Effect */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#C9A227]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#C9A227]/20 transition-all duration-700"></div>

            <div className="flex-1 relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl transition-all duration-500 ${selectedClassification === 'A' ? 'bg-[#C9A227] text-[#022C22] scale-110 shadow-lg shadow-[#C9A227]/20' : 'bg-[#064E3B] text-[#C9A227]'}`}>A</div>
              </div>

              <h3 className="text-2xl font-black text-white mb-4 tracking-tight">تصنيف A</h3>
              <p className="text-white/70 text-sm leading-relaxed mb-8 font-medium">
                للأكاديميات ذات الهيكلية الاحترافية والمتكاملة التي تطبق أعلى المعايير الفنية والإدارية بمستوى تنافسي.
              </p>

              <ul className="space-y-3 mb-10">
                {['هيكلية ادارية وفنية كاملة', '4 فئات عمرية على الاقل', 'برنامج تدريبي متكامل'].map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-[11px] font-bold text-white/50">
                    <span className="material-symbols-outlined text-[14px] text-[#C9A227]">check_circle</span>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className={`w-full py-4 rounded-2xl font-black text-center transition-all duration-300 transform ${selectedClassification === 'A' ? 'bg-[#C9A227] text-[#022C22] shadow-xl translate-y-0' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'}`}>
              {selectedClassification === 'A' ? 'تم اختيار تصنيف A' : 'اختيار تصنيف A'}
            </div>
          </div>

          <div 
            onClick={() => onSelectClassification('B')}
            className={`group relative p-8 rounded-[32px] border-2 cursor-pointer transition-all duration-500 flex flex-col h-full bg-white ${selectedClassification === 'B' ? 'border-[#064E3B] ring-4 ring-[#064E3B]/10 shadow-xl' : 'border-[#E5DED0] hover:border-[#064E3B]'}`}
          >
            <div className="flex-1 relative z-10">
              <div className={`w-14 h-14 rounded-2xl mb-8 flex items-center justify-center font-black text-2xl transition-all duration-500 ${selectedClassification === 'B' ? 'bg-[#064E3B] text-white shadow-lg shadow-[#064E3B]/20' : 'bg-[#F6F1E7] text-[#064E3B]'}`}>B</div>
              <h3 className="text-2xl font-black text-[#022C22] mb-4 tracking-tight">تصنيف B</h3>
              <p className="text-[#64748B] text-sm leading-relaxed mb-8 font-medium">
                للأكاديميات التي تركز على الأساسيات وتسعى للتطوير التدريجي والمشاركة المنظمة.
              </p>

              <ul className="space-y-3 mb-10">
                {['هيكلية تنظيمية أساسية', 'فئتان عمريتان على الأقل', 'تدريب عام'].map((feat, i) => (
                  <li key={i} className="flex items-center gap-2 text-[11px] font-bold text-[#64748B]">
                    <span className="material-symbols-outlined text-[14px] text-[#064E3B]">check_circle</span>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
            <div className={`w-full py-4 rounded-2xl font-black text-center transition-all duration-300 ${selectedClassification === 'B' ? 'bg-[#064E3B] text-white shadow-lg' : 'bg-gray-100 text-[#022C22] hover:bg-gray-200'}`}>
              {selectedClassification === 'B' ? 'تم اختيار تصنيف B' : 'اختيار تصنيف B'}
            </div>
          </div>

          <div 
            onClick={() => onSelectClassification('AffiliationOnly')}
            className={`group relative p-8 rounded-[32px] border-2 cursor-pointer transition-all duration-500 flex flex-col h-full bg-[#FDFBF7] ${selectedClassification === 'AffiliationOnly' ? 'border-[#C9A227] ring-4 ring-[#C9A227]/10 shadow-xl' : 'border-[#E5DED0] hover:border-[#C9A227]'}`}
          >
            <div className="flex-1 relative z-10">
              <div className={`w-14 h-14 rounded-2xl mb-8 flex items-center justify-center transition-all duration-500 ${selectedClassification === 'AffiliationOnly' ? 'bg-[#C9A227] text-[#022C22] shadow-lg shadow-[#C9A227]/20' : 'bg-[#F6F1E7] text-[#C9A227]'}`}>
                <span className="material-symbols-outlined text-3xl">verified_user</span>
              </div>
              <h3 className="text-2xl font-black text-[#022C22] mb-4 tracking-tight">انتساب فقط</h3>
              <p className="text-[#64748B] text-sm leading-relaxed mb-8 font-medium">
                للحصول على المظلة الرسمية للاتحاد دون الدخول في تفاصيل التصنيف الفني الحالية.
              </p>
            </div>
            <div className={`w-full py-4 rounded-2xl font-black text-center transition-all duration-300 ${selectedClassification === 'AffiliationOnly' ? 'bg-[#022C22] text-white shadow-lg' : 'bg-white border border-[#E5DED0] text-[#022C22] hover:bg-gray-50'}`}>
              {selectedClassification === 'AffiliationOnly' ? 'تم اختيار الانتساب' : 'اختيار انتساب فقط'}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
