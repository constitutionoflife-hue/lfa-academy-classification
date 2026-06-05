import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import AppHeader from "./components/AppHeader";

export default function Standards() {
  const axes = [
    { id: 1, name: "القيادة", text: "وضوح المالك، المدير الإداري، والمشرف الفني." },
    { id: 2, name: "التخطيط", text: "وجود رؤية، مهمة، فلسفة لعب، وخطط تدريبية مكتوبة." },
    { id: 3, name: "التنظيم", text: "اعتماد هيكلية إدارية وفنية واضحة، مع تحديد الأدوار والمسؤوليات." },
    { id: 4, name: "الجانب الفني", text: "توفر الفرق، المدربين، البرامج التدريبية، وجاهزية المشاركة." },
    { id: 5, name: "الميزانية", text: "وجود موازنة سنوية واضحة تغطي متطلبات الموسم." },
    { id: 6, name: "الملعب والمرافق", text: "توفر ملعب ومرافق مناسبة وآمنة للتدريب والمباريات." },
    { id: 7, name: "الصحة", text: "توفر جاهزية طبية، إسعافات أولية، وتأمين صحي عند الحاجة." },
    { id: 8, name: "الرعاية والتعليم", text: "وجود سياسة حماية الطفل، ميثاق سلوك، وورش توعية." },
    { id: 9, name: "المعدات والتجهيزات", text: "توفر الأطقم، الكرات، المرمى، وتجهيزات التدريب الأساسية." },
    { id: 10, name: "التواصل الاجتماعي", text: "وجود حضور إعلامي منظم وهوية بصرية واضحة." }
  ];

  const comparison = [
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
  ];

  return (
    <div className="min-h-screen bg-[#F6F1E7] font-body-md pb-20" dir="rtl">
      <AppHeader />

      {/* Breadcrumb Sub-Header */}
      <div className="bg-[#022C22]/90 text-white border-t border-white/10">
        <div className="max-w-[1100px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Link to="/dashboard" className="hover:text-white transition-colors">لوحة الأكاديمية</Link>
            <span className="material-symbols-outlined text-[16px] text-[#C9A227]">chevron_left</span>
            <span className="text-white font-bold">المعايير</span>
          </div>
          <Link to="/dashboard" className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-[#C9A227] text-[#022C22] rounded-lg font-bold text-xs hover:bg-[#D4B145] transition-colors">
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            العودة للوحة
          </Link>
        </div>
      </div>

      <main className="max-w-[1100px] mx-auto px-6 py-12 space-y-16">
        
        {/* Page Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="font-display-md text-4xl md:text-5xl font-bold text-[#064E3B]">
            معايير تصنيف الأكاديميات
          </h1>
          <p className="text-[#64748B] text-lg md:text-xl leading-relaxed">
            تعتمد عملية التصنيف على مجموعة من المحاور التي تقيس الجاهزية الإدارية، الفنية، التنظيمية، والصحية للأكاديمية.
          </p>
        </div>

        {/* Intro Card */}
        <div className="bg-[#FFFDF7] rounded-[32px] p-8 md:p-12 border border-[#E5DED0] shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-[#064E3B]/5 rounded-full -m-16"></div>
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
            <div className="w-20 h-20 bg-[#064E3B] rounded-2xl flex items-center justify-center shrink-0">
               <span className="material-symbols-outlined text-4xl text-[#C9A227]">verified</span>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-[#022C22]">ما المقصود بالتصنيف؟</h2>
              <p className="text-[#64748B] text-lg leading-relaxed">
                التصنيف هو تقييم رسمي للأكاديمية وفق معايير محددة، يحدد مدى جاهزيتها الإدارية والفنية والتنظيمية. لا يعتمد التصنيف على نتائج المباريات، بل على جودة التنظيم، وضوح الهيكلية، البرامج التدريبية، حماية الطفل، المرافق، والتجهيزات.
              </p>
            </div>
          </div>
        </div>

        {/* Classification Levels */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-[#022C22] text-center">مستويات التصنيف</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Level A */}
            <motion.div 
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-[#022C22] rounded-[40px] p-8 md:p-10 border-2 border-[#C9A227]/30 shadow-2xl relative overflow-hidden flex flex-col h-full ring-4 ring-[#064E3B]/5 cursor-default"
            >
               <div className="absolute top-6 left-6">
                  <span className="bg-[#C9A227] text-[#022C22] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">متقدم</span>
               </div>
               <div className="flex-1">
                 <div className="text-8xl font-black text-white/5 absolute -bottom-6 -left-6 select-none">A</div>
                 <div className="w-16 h-16 bg-[#C9A227] rounded-2xl mb-6 flex items-center justify-center text-3xl font-black text-[#022C22] shadow-[0_8px_16px_rgba(201,162,39,0.2)]">A</div>
                 <h3 className="text-3xl font-black text-[#C9A227] mb-4">تصنيف A</h3>
                 <p className="text-white/80 text-lg leading-relaxed font-medium">
                   مستوى متقدم يعكس جاهزية أعلى من حيث التخطيط، الإشراف، الهيكل التنظيمي، جودة التدريب، والمرافق.
                 </p>
               </div>
            </motion.div>

            {/* Level B */}
            <motion.div 
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="bg-white rounded-[40px] p-8 md:p-10 border-2 border-[#E5DED0] shadow-xl flex flex-col h-full hover:border-[#C9A227]/50 transition-colors group cursor-default"
            >
               <div className="absolute top-6 left-6">
                  <span className="bg-[#F6F1E7] text-[#064E3B] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-[#E5DED0]">أساسي</span>
               </div>
               <div className="flex-1 text-right">
                 <div className="text-8xl font-black text-gray-50 absolute -bottom-6 -left-6 select-none">B</div>
                 <div className="w-16 h-16 bg-[#F6F1E7] rounded-2xl mb-6 flex items-center justify-center text-3xl font-black text-[#064E3B] border border-[#E5DED0] group-hover:bg-[#064E3B] group-hover:text-white group-hover:border-[#064E3B] transition-all shadow-sm">B</div>
                 <h3 className="text-3xl font-black text-[#022C22] mb-4">تصنيف B</h3>
                 <p className="text-[#64748B] text-lg leading-relaxed font-medium">
                   مستوى أساسي يثبت الحد الأدنى من التنظيم والتدريب، ويسمح للأكاديمية بالتطور التدريجي وفق المعايير المعتمدة.
                 </p>
               </div>
            </motion.div>
          </div>
        </div>

        {/* Ten Axes */}
        <div className="space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-[#022C22]">المحاور العشر للتصنيف</h2>
            <p className="text-[#64748B] text-lg">يعتمد تصنيف الأكاديميات على 10 محاور أساسية تغطي الجوانب الإدارية، الفنية، التنظيمية، والإنسانية للعمل الأكاديمي.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {axes.map((axis) => (
              <div key={axis.id} className="bg-[#FFFDF7] p-6 rounded-3xl border border-[#E5DED0] hover:shadow-md transition-shadow group">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 bg-[#064E3B] text-white rounded-xl flex items-center justify-center font-bold text-sm">
                    {axis.id}
                  </div>
                  <h3 className="font-bold text-lg text-[#022C22] group-hover:text-[#064E3B] transition-colors">{axis.name}</h3>
                </div>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  {axis.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="space-y-8 pt-8">
          <h2 className="text-3xl font-bold text-[#022C22] text-center">الفروقات العامة بين تصنيف A و B</h2>
          
          <div className="bg-[#FFFDF7] rounded-3xl border border-[#E5DED0] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[#022C22] text-[#C9A227]">
                    <th className="py-6 px-8 font-bold border-l border-[#064E3B]">المحور</th>
                    <th className="py-6 px-8 font-bold border-l border-[#064E3B]">مستوى A</th>
                    <th className="py-6 px-8 font-bold">مستوى B</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {comparison.map((row, idx) => (
                    <tr key={idx} className="border-b border-[#E5DED0] hover:bg-[#F6F1E7]/50 transition-colors">
                      <td className="py-5 px-8 font-bold text-[#064E3B] border-l border-[#E5DED0]">{row.axis}</td>
                      <td className="py-5 px-8 text-[#111827] border-l border-[#E5DED0]">{row.a}</td>
                      <td className="py-5 px-8 text-[#111827]">{row.b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Tips & Warnings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
           <div className="bg-white rounded-3xl p-8 border border-[#E5DED0] shadow-sm border-r-4 border-r-[#C9A227]">
              <div className="w-12 h-12 bg-[#C9A227]/10 rounded-xl flex items-center justify-center mb-6">
                 <span className="material-symbols-outlined text-[#022C22]">lightbulb</span>
              </div>
              <h3 className="font-bold text-[#022C22] text-xl mb-4">نصيحة مهمة</h3>
              <p className="text-[#64748B] leading-relaxed">
                يُفضَّل أن تختار الأكاديمية التصنيف الذي يتناسب مع قدراتها وإمكاناتها الفعلية، بدل اختيار تصنيف أعلى لا يعكس واقعها الحالي.
              </p>
           </div>
           
           <div className="bg-white rounded-3xl p-8 border border-[#E5DED0] shadow-sm border-r-4 border-r-red-500">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-6">
                 <span className="material-symbols-outlined text-red-600">warning</span>
              </div>
              <h3 className="font-bold text-[#022C22] text-xl mb-4">تنبيه</h3>
              <p className="text-[#64748B] leading-relaxed">
                إن اختيار تصنيف غير مناسب قد يؤدي إلى ضعف ملف الأكاديمية وعدم استيفاء المتطلبات المطلوبة للتصنيف بشكل واضح، مما يؤثر سلبًا على عملية التقييم والمتابعة والتطوير لاحقًا.
              </p>
           </div>
        </div>

        {/* Annual Development Contribution Section */}
        <section className="space-y-12 pt-12 border-t border-[#E5DED0]">
          <div className="text-center space-y-4 max-w-4xl mx-auto">
            <h2 className="font-display-md text-3xl md:text-4xl font-bold text-[#064E3B]">
              المساهمة السنوية لدعم برنامج تطوير الأكاديميات
            </h2>
            <div className="text-[#64748B] text-lg leading-relaxed space-y-4">
              <p>
                يهدف مشروع انتساب وتصنيف الأكاديميات إلى تطوير بيئة كرة القدم للواعدين في لبنان، ورفع مستوى العمل الإداري والفني والتنظيمي داخل الأكاديميات، من خلال مسار واضح للانتساب، التصنيف، المتابعة، والتطوير.
              </p>
              <p>
                ولضمان استمرارية المشروع وتنفيذه بشكل فعّال، تعتمد الأكاديميات المصنفة مساهمة سنوية تُستخدم لدعم تشغيل البرنامج، تنظيم المتابعة، تنفيذ الزيارات، إعداد الورش، وإدارة المسابقات الخاصة بفئات الواعدين.
              </p>
              <p>
                هذه المساهمة ليست ذات طابع تجاري، بل هي جزء من منظومة تطويرية تهدف إلى مساعدة الأكاديميات على تحسين عملها، وزيادة جودة التدريب، ورفع عدد اللاعبين المسجلين ضمن بيئة منظمة وآمنة.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Card 1: Classification A */}
            <motion.div 
              whileHover={{ y: -8 }}
              className="bg-[#022C22] rounded-[40px] p-8 md:p-10 border-2 border-[#C9A227] shadow-xl relative overflow-hidden flex flex-col"
            >
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-black text-[#C9A227]">تصنيف A</h3>
                  <span className="bg-[#C9A227] text-[#022C22] px-3 py-1 rounded-lg text-xs font-black">التميز</span>
                </div>
                <div className="space-y-2 text-right">
                  <p className="text-white/60 text-sm">المساهمة السنوية</p>
                  <p className="text-4xl font-bold text-white">2,400 دولار أمريكي <span className="text-lg text-white/50 font-normal">سنويًا</span></p>
                </div>
                <p className="text-white/80 font-medium leading-relaxed border-b border-white/10 pb-6 text-right">
                  مناسب للأكاديميات التي تمتلك جاهزية إدارية وفنية وتنظيمية أعلى، وتسعى للمشاركة ضمن المسار الوطني للأكاديميات.
                </p>
                <ul className="space-y-3">
                  {[
                    "المشاركة في الدوري الوطني للأكاديميات",
                    "ورش عمل للمدربين، الإداريين، الجهاز الفني، والأهالي",
                    "زيارات متابعة وتقييم ميداني",
                    "توجيه إداري وفني لتحسين جودة العمل",
                    "متابعة مستمرة للنواقص وفرص التطوير",
                    "مشاركة مجانية في الكأس المعتمدة للأكاديميات",
                    "إدراج الأكاديمية ضمن المسار الرسمي لتطوير كرة القدم للواعدين"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/70 text-sm leading-relaxed text-right">
                      <span className="material-symbols-outlined text-[#C9A227] text-lg shrink-0">check_circle</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Card 2: Classification B */}
            <motion.div 
              whileHover={{ y: -8 }}
              className="bg-white rounded-[40px] p-8 md:p-10 border border-[#E5DED0] shadow-lg relative overflow-hidden flex flex-col"
            >
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-black text-[#022C22]">تصنيف B</h3>
                  <span className="bg-[#F6F1E7] text-[#064E3B] px-3 py-1 rounded-lg text-xs font-black border border-[#E5DED0]">التطوير</span>
                </div>
                <div className="space-y-2 text-right">
                  <p className="text-[#64748B] text-sm">المساهمة السنوية</p>
                  <p className="text-4xl font-bold text-[#064E3B]">600 دولار أمريكي <span className="text-lg text-[#64748B] font-normal">سنويًا</span></p>
                </div>
                <p className="text-[#64748B] font-medium leading-relaxed border-b border-[#E5DED0] pb-6 text-right">
                  مناسب للأكاديميات التي تستوفي الحد الأدنى من المعايير وتسعى للدخول في مسار تطوير تدريجي ومنظم.
                </p>
                <ul className="space-y-3">
                  {[
                    "المشاركة في الدوري الإقليمي للأكاديميات",
                    "ورش عمل أساسية للمدربين، الإداريين، والأهالي",
                    "متابعة دورية من الاتحاد",
                    "زيارات ميدانية عند الحاجة",
                    "إرشاد لتطوير الهيكل الإداري والفني",
                    "مشاركة مجانية في الكأس المعتمدة للأكاديميات",
                    "مسار واضح للترقي والتطور نحو تصنيف أعلى لاحقًا"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-[#64748B] text-sm leading-relaxed text-right">
                      <span className="material-symbols-outlined text-[#064E3B] text-lg shrink-0">check_circle</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>

          {/* Explanation Block */}
          <div className="max-w-4xl mx-auto bg-[#FFFDF7] rounded-3xl p-8 md:p-10 border border-[#E5DED0] space-y-6 shadow-sm">
            <h3 className="text-2xl font-bold text-[#022C22] flex items-center gap-3">
              <span className="material-symbols-outlined text-[#C9A227]">help</span>
              لماذا توجد مساهمة سنوية؟
            </h3>
            <div className="text-[#64748B] text-lg leading-relaxed font-medium space-y-4">
              <p>
                تُعتمد المساهمة السنوية لضمان قدرة البرنامج على الاستمرار بشكل منظم، بما يشمل المتابعة الفنية والإدارية، تنظيم الورش، تنفيذ الزيارات، إدارة المنافسات، وتطوير الأدوات الرقمية الخاصة بالأكاديميات.
              </p>
              <p>
                الهدف الأساسي من المشروع هو تطوير الأكاديميات وليس تحقيق ربح تجاري. وكلما تحسّن تنظيم الأكاديمية وجودة عملها، انعكس ذلك على زيادة عدد اللاعبين، تحسين ثقة الأهالي، ورفع مداخيل الأكاديمية بطريقة طبيعية ومستدامة.
              </p>
            </div>
          </div>

          {/* Highlight Quote */}
          <div className="max-w-3xl mx-auto text-center py-8">
            <div className="inline-block relative">
              <span className="material-symbols-outlined text-6xl text-[#C9A227]/20 absolute -top-8 -right-8">format_quote</span>
              <p className="text-xl md:text-2xl font-bold text-[#064E3B] italic leading-relaxed relative z-10 px-4">
                "الهدف ليس دفع رسم سنوي فقط، بل الدخول في مسار تطوير رسمي يساعد الأكاديمية على النمو، التنظيم، والمشاركة ضمن منظومة واضحة تخدم كرة القدم اللبنانية."
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <div className="bg-[#022C22] text-white rounded-[48px] p-10 md:p-16 shadow-2xl relative overflow-hidden text-center space-y-8">
           <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A227]/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
           <div className="relative z-10 space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold">هل أنت جاهز لاختيار التصنيف؟</h2>
              <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto">
                بعد الاطلاع على المعايير، يمكنك العودة إلى لوحة الأكاديمية واختيار نوع الطلب المناسب.
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
