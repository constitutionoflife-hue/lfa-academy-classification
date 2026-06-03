import React from "react";
import { Link } from "react-router-dom";
import AppHeader from "./components/AppHeader";

export default function Contact() {
  const contactName = "ربيع حمدان";
  const contactRole = "مدير تطوير كرة القدم للأكاديميات والهواة";
  const contactEmail = "rabih.hamdan@live.com";
  const contactPhone = "+961 71 716 690";
  const whatsappUrl = "https://wa.me/96171716690";

  const guidancePoints = [
    "في حال وجود مشكلة في تسجيل الدخول أو إنشاء الحساب.",
    "في حال وجود استفسار حول اختيار التصنيف A أو B.",
    "في حال عدم وضوح أحد المتطلبات أو المستندات المطلوبة.",
    "في حال الحاجة إلى توضيح حول سجل الأكاديمية أو المحاور العشر.",
    "في حال وجود ملاحظات على عمل المنصة أو صعوبة في رفع المستندات."
  ];

  return (
    <div className="min-h-screen bg-[#F6F1E7] font-body-md pb-20" dir="rtl">
      <AppHeader />

      {/* Breadcrumb Sub-Header */}
      <div className="bg-[#022C22]/90 text-white border-t border-white/10">
        <div className="max-w-[1000px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Link to="/dashboard" className="hover:text-white transition-colors">لوحة الأكاديمية</Link>
            <span className="material-symbols-outlined text-[16px] text-[#C9A227]">chevron_left</span>
            <span className="text-white font-bold">اتصل بنا</span>
          </div>
          <Link to="/dashboard" className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-[#C9A227] text-[#022C22] rounded-lg font-bold text-xs hover:bg-[#D4B145] transition-colors">
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            العودة للوحة
          </Link>
        </div>
      </div>

      <main className="max-w-[1000px] mx-auto px-6 py-12 space-y-12">
        
        {/* Page Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="font-display-md text-4xl md:text-5xl font-bold text-[#064E3B]">
             اتصل بنا
          </h1>
          <p className="text-[#64748B] text-lg leading-relaxed">
            للاستفسار حول مشروع انتساب وتصنيف أكاديميات كرة القدم، يمكنكم التواصل مع الجهة المعنية.
          </p>
        </div>

        {/* Intro Card */}
        <div className="bg-[#FFFDF7] rounded-[32px] p-8 md:p-10 border border-[#E5DED0] shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#064E3B]/5 rounded-full -m-16"></div>
          <div className="w-16 h-16 bg-[#064E3B]/10 rounded-2xl flex items-center justify-center shrink-0">
             <span className="material-symbols-outlined text-4xl text-[#064E3B]">support_agent</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[#022C22]">نحن هنا لمساعدتك</h2>
            <p className="text-[#64748B] text-lg leading-relaxed">
              في حال وجود أي استفسار حول الانتساب، التصنيف، متطلبات الملف، أو آلية استخدام المنصة، يمكنكم التواصل مع المسؤول المعني بالمشروع.
            </p>
          </div>
        </div>

        {/* Contact Person Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-[40px] border border-[#E5DED0] shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="bg-[#022C22] p-8 text-center relative">
               <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
               <div className="w-32 h-32 bg-white/10 rounded-3xl mx-auto mb-4 flex items-center justify-center border border-white/20 backdrop-blur-md overflow-hidden shadow-2xl">
                  <img 
                    src="/rabih_hamdan.jpg" 
                    alt="Rabih Hamdan" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback if the image doesn't load
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const icon = document.createElement('span');
                        icon.className = 'material-symbols-outlined text-5xl text-[#C9A227]';
                        icon.innerText = 'badge';
                        parent.appendChild(icon);
                      }
                    }}
                  />
               </div>
               <h3 className="text-3xl font-bold text-white mb-2">{contactName}</h3>
               <p className="text-[#C9A227] font-medium">{contactRole}</p>
            </div>
            
            <div className="p-8 md:p-10 space-y-8">
              <div className="grid grid-cols-1 gap-6">
                 <div className="flex items-center gap-4 p-4 bg-[#F6F1E7]/50 rounded-2xl border border-[#E5DED0]/50">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#064E3B] shadow-sm">
                       <span className="material-symbols-outlined">mail</span>
                    </div>
                    <div>
                       <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">البريد الإلكتروني</div>
                       <a href={`mailto:${contactEmail}`} className="text-lg font-bold text-[#022C22] hover:text-[#064E3B] transition-colors">{contactEmail}</a>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-4 p-4 bg-[#F6F1E7]/50 rounded-2xl border border-[#E5DED0]/50">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#064E3B] shadow-sm">
                       <span className="material-symbols-outlined">phone</span>
                    </div>
                    <div>
                       <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">رقم الهاتف</div>
                       <a href={`tel:${contactPhone.replace(/\s+/g, '')}`} className="text-lg font-bold text-[#022C22] hover:text-[#064E3B] transition-colors" dir="ltr">{contactPhone}</a>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                 <a 
                   href={`mailto:${contactEmail}`}
                   className="flex h-12 items-center justify-center gap-2 bg-[#022C22] text-white rounded-xl font-bold text-sm hover:bg-[#064E3B] transition-all"
                 >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    إرسال بريد
                 </a>
                 <a 
                   href={`tel:${contactPhone.replace(/\s+/g, '')}`}
                   className="flex h-12 items-center justify-center gap-2 bg-white border border-[#022C22] text-[#022C22] rounded-xl font-bold text-sm hover:bg-[#F6F1E7] transition-all"
                 >
                    <span className="material-symbols-outlined text-[18px]">call</span>
                    اتصال
                 </a>
                 <a 
                   href={whatsappUrl}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="flex h-12 items-center justify-center gap-2 bg-[#25D366] text-white rounded-xl font-bold text-sm hover:brightness-110 transition-all shadow-md"
                 >
                    <span className="material-symbols-outlined text-[20px]">chat</span>
                    واتساب
                 </a>
              </div>
            </div>
          </div>
        </div>

        {/* Guidance Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-[#022C22] text-center">متى يجب التواصل؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {guidancePoints.map((point, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-[#E5DED0] flex gap-4 hover:shadow-sm transition-shadow">
                <div className="w-8 h-8 rounded-full bg-[#064E3B] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {i + 1}
                </div>
                <p className="text-sm text-[#64748B] leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Important Note Card */}
        <div className="bg-white rounded-3xl p-8 border border-[#E5DED0] shadow-sm border-r-4 border-r-[#C9A227] max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
             <div className="w-10 h-10 bg-[#C9A227]/10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-[#022C22]">info</span>
             </div>
             <h3 className="font-bold text-[#022C22] text-xl">ملاحظة مهمة</h3>
          </div>
          <p className="text-[#64748B] text-lg leading-relaxed pr-2">
            يرجى عند التواصل ذكر اسم الأكاديمية ونوع الطلب، سواء كان انتساب فقط أو تصنيف A أو تصنيف B، لتسهيل متابعة الاستفسار.
          </p>
        </div>

        {/* CTA Section */}
        <div className="bg-[#022C22] text-white rounded-[48px] p-10 md:p-16 shadow-2xl relative overflow-hidden text-center space-y-10">
           <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A227]/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
           <div className="relative z-10 space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold">هل تريد العودة إلى ملف الأكاديمية؟</h2>
              <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto">
                 يمكنك العودة إلى لوحة الأكاديمية لمتابعة تعبئة الملف أو مراجعة النواقص.
              </p>
           </div>
           
           <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link 
                to="/dashboard"
                className="w-full sm:w-auto px-10 py-5 bg-[#C9A227] text-[#022C22] rounded-2xl font-bold text-lg hover:bg-[#D4B145] transition-all shadow-xl hover:scale-105 active:scale-95"
              >
                العودة إلى لوحة الأكاديمية
              </Link>
              <Link 
                to="/academy-registry"
                className="w-full sm:w-auto px-10 py-5 bg-white/10 text-white border border-white/20 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all backdrop-blur-md"
              >
                إدارة سجل الأكاديمية
              </Link>
           </div>
        </div>

      </main>
    </div>
  );
}
