import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import AppHeader from "./components/AppHeader";

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [openIds, setOpenIds] = useState<string[]>([]);

  const categories = [
    { id: "all", label: "الكل" },
    { id: "affiliation", label: "الانتساب" },
    { id: "classification", label: "التصنيف" },
    { id: "competitions", label: "المشاركة في البطولات" },
    { id: "monitoring", label: "المتابعة والتطوير" },
  ];

  const faqData: FAQItem[] = [
    // الانتساب
    { id: "af1", category: "affiliation", question: "ما هو انتساب الأكاديمية؟", answer: "الانتساب هو اعتماد الأكاديمية رسميًا من قبل الاتحاد، بما يجعلها كيانًا قانونيًا معترفًا به، ويضعها تحت مظلة الاتحاد التنظيمية والإدارية والفنية، مع الالتزام بجميع الأنظمة والتعليمات المعتمدة." },
    { id: "af2", category: "affiliation", question: "هل يخول الانتساب الأكاديمية المشاركة في البطولات؟", answer: "لا. الانتساب وحده لا يخول الأكاديمية المشاركة في المسابقات والبطولات الخاصة بالأكاديميات التي ينظمها الاتحاد." },
    { id: "af3", category: "affiliation", question: "ما الغاية من الانتساب إذاً؟", answer: "يهدف الانتساب إلى تنظيم عمل الأكاديمية، توثيق نشاطها، ضبط الوضع القانوني والإداري، وإخضاعها للأنظمة والقوانين المعتمدة." },
    { id: "af4", category: "affiliation", question: "ما الفرق بين الانتساب والتصنيف؟", answer: "الانتساب يمنح الأكاديمية الصفة الرسمية والقانونية. أما التصنيف فيحدد جاهزية الأكاديمية ويمنحها حق المشاركة في المسابقات بحسب المستوى المعتمد." },
    { id: "af5", category: "affiliation", question: "هل يمكن للأكاديمية المنتسبة التقدم لاحقًا للتصنيف؟", answer: "نعم، يمكن لأي أكاديمية منتسبة التقدم بطلب تصنيف لاحقًا وفق الآلية المعتمدة، والعمل على استيفاء المعايير المطلوبة للانتقال من الانتساب إلى المشاركة الرسمية." },
    { id: "af6", category: "affiliation", question: "لماذا يشترط الاتحاد التصنيف للمشاركة؟", answer: "لضمان جودة التدريب، حماية الطفل، العدالة بين الأكاديميات، وتنظيم المنافسات بما يخدم التطوير الحقيقي لفئة الواعدين." },
    
    // التصنيف
    { id: "cl1", category: "classification", question: "ما هو التصنيف؟", answer: "التصنيف هو تقييم رسمي للأكاديمية وفق معايير محددة، ويحدد مستواها A أو B من حيث الجاهزية الإدارية والفنية والتنظيمية." },
    { id: "cl2", category: "classification", question: "لماذا يُعتبر التصنيف مرحلة أساسية؟", answer: "لأنه يحدد أهلية الأكاديمية للمشاركة في البطولات، يضمن حدًا أدنى من الجودة والتنظيم، يحمي اللاعبين من بيئات تدريب غير مناسبة، ويحقق العدالة وتكافؤ الفرص بين الأكاديميات." },
    { id: "cl3", category: "classification", question: "ما هي مستويات التصنيف؟", answer: "يعتمد الاتحاد مستويين للتصنيف: تصنيف B وهو مستوى أساسي يؤهل الأكاديمية للمشاركة ضمن شروط تنظيمية وفنية محددة، وتصنيف A وهو مستوى متقدم يعكس جاهزية أعلى من حيث التخطيط، الإشراف، والهيكل التنظيمي." },
    { id: "cl4", category: "classification", question: "هل التصنيف مرتبط بنتائج المباريات؟", answer: "كلا. التصنيف لا يعتمد على النتائج أو الترتيب، بل على الهيكل الإداري، الكادر الفني، البرامج التدريبية، سياسة حماية الطفل، المرافق، والتجهيزات." },
    { id: "cl5", category: "classification", question: "كيف يتم تقييم الأكاديمية؟", answer: "يتم التقييم من خلال تدقيق مكتبي للمستندات، زيارة ميدانية عند الحاجة، ومراجعة الالتزام بالمعايير المعتمدة لكل مستوى." },
    { id: "cl6", category: "classification", question: "هل التصنيف دائم؟", answer: "كلا. التصنيف يكون لفترة محددة ويخضع للمراجعة الدورية للتأكد من استمرار الالتزام بالمعايير." },
    { id: "cl7", category: "classification", question: "هل يمكن ترقية التصنيف من B إلى A؟", answer: "نعم، يمكن للأكاديمية التقدم بطلب ترقية تصنيفها في حال استيفاء المعايير المطلوبة، تطوير هيكلها الإداري والفني، والالتزام الكامل بالأنظمة المعتمدة." },
    { id: "cl8", category: "classification", question: "هل الأكاديمية المصنفة A ملزمة بالمشاركة في فئتي دون 12 ودون 13؟", answer: "نعم، تُعد الأكاديمية المصنفة A ملزمة بالمشاركة في فئتي دون 12 ودون 13 كشرط أساسي للمشاركة في البطولات." },

    // المشاركة في البطولات
    { id: "co1", category: "competitions", question: "هل يحق لأي أكاديمية المشاركة في بطولات الاتحاد مباشرة؟", answer: "يحق فقط للأكاديميات المنتسبة رسميًا إلى الاتحاد اللبناني لكرة القدم والحاصلة على تصنيف معتمد A أو B المشاركة في البطولات الرسمية التي ينظمها الاتحاد." },
    { id: "co2", category: "competitions", question: "ما العلاقة بين التصنيف A و B ونوع البطولات المسموح المشاركة فيها؟", answer: "يتم تحديد نوع البطولات التي تشارك فيها الأكاديمية بناءً على تصنيفها. تشارك الأكاديميات المصنفة A في البطولات الوطنية الرسمية، بينما تشارك الأكاديميات المصنفة B في البطولات المحلية أو الإقليمية المعتمدة." },
    { id: "co3", category: "competitions", question: "هل يمكن لأكاديميتين من تصنيفين مختلفين A و B لعب مباراة ودية؟", answer: "لا يُسمح بإقامة مباريات ودية أو رسمية بين أكاديميات من تصنيفين مختلفين إلا بعد تقديم طلب رسمي والحصول على موافقة مسبقة من الاتحاد والالتزام بالشروط التنظيمية والفنية." },
    { id: "co4", category: "competitions", question: "هل التصنيف يمنح الأكاديمية حق تنظيم بطولات خاصة؟", answer: "التصنيف وحده لا يكفي. يجب على الأكاديمية الراغبة بتنظيم بطولة خاصة التقدم بطلب رسمي والحصول على إذن خطي مسبق من الاتحاد والالتزام بجميع الشروط التنظيمية والتحكيمية والانضباطية." },
    { id: "co5", category: "competitions", question: "ماذا يحدث في حال مشاركة أكاديمية في بطولة أو دورة دون إذن الاتحاد؟", answer: "تُعد المشاركة مخالفة للأنظمة المعتمدة وتعرّض الأكاديمية لغرامات مالية وعقوبات إدارية قد تصل إلى الإيقاف عن المشاركة في البطولات في حال تكرار المخالفة." },
    { id: "co6", category: "competitions", question: "ما الهدف من ربط المشاركة في البطولات بنظام التصنيف؟", answer: "يهدف هذا النظام إلى ضمان عدالة المنافسة، رفع جودة البطولات، حماية اللاعبين صغار السن، وتنظيم الهرم التنافسي بما يخدم تطوير اللعبة والمنتخبات الوطنية." },
    { id: "co7", category: "competitions", question: "هل يحق لأكاديمية مصنفة B المشاركة في فئة واحدة فقط؟", answer: "نعم، يحق للأكاديمية المصنفة B المشاركة في فئة عمرية واحدة من أصل فئتين أو المشاركة في الفئتين معًا، بحسب جاهزيتها الفنية والإدارية." },

    // المتابعة والتطوير
    { id: "mo1", category: "monitoring", question: "ما المقصود بالمتابعة والتطوير؟", answer: "المتابعة والتطوير تعني قيام الاتحاد بمراقبة الأداء الفني والإداري والتنظيمي للأكاديميات بشكل دوري، بهدف تحسين جودة التدريب، ضمان الالتزام بالمعايير المعتمدة، ودعم التطوير المستدام لفئات الواعدين." },
    { id: "mo2", category: "monitoring", question: "هل تخضع جميع الأكاديميات المصنفة لنظام المتابعة؟", answer: "نعم، تخضع جميع الأكاديميات المصنفة في المستويين A و B لنظام المتابعة والتقييم الدوري طوال الموسم الرياضي." },
    { id: "mo3", category: "monitoring", question: "ما الجوانب التي تشملها عملية المتابعة؟", answer: "تشمل المتابعة الجوانب الفنية، الإدارية، التنظيمية، الانضباطية، وحماية الطفل، إضافة إلى الالتزام بالبرامج التدريبية والقوانين." },
    { id: "mo4", category: "monitoring", question: "كيف تتم عملية المتابعة ميدانيًا؟", answer: "تتم المتابعة من خلال زيارات ميدانية، تقارير فنية وإدارية، متابعة المباريات والأنشطة، إضافة إلى مراجعة البيانات المدخلة على المنصة الرقمية المعتمدة من الاتحاد." },
    { id: "mo5", category: "monitoring", question: "هل تهدف المتابعة إلى العقوبة أم إلى التطوير؟", answer: "تهدف المتابعة بالدرجة الأولى إلى التطوير والتوجيه وتحسين الأداء. لا يتم اللجوء إلى العقوبات إلا في حال وجود مخالفات جسيمة أو تكرار عدم الالتزام بعد التنبيه." },
    { id: "mo6", category: "monitoring", question: "هل يتم إبلاغ الأكاديمية بنتائج المتابعة؟", answer: "نعم، يتم إبلاغ الأكاديمية بنتائج المتابعة والتقييم، مع تحديد نقاط القوة، مجالات التحسين، والتوصيات المطلوبة ضمن مهلة زمنية واضحة للتصحيح." },
    { id: "mo7", category: "monitoring", question: "هل يوفر الاتحاد دعمًا أو توجيهًا للأكاديميات؟", answer: "نعم، يعمل الاتحاد على توفير التوجيه الفني والإداري، ورش العمل، البرامج التعليمية، والتوصيات العملية لمساعدة الأكاديميات على تحسين مستواها." },
    { id: "mo8", category: "monitoring", question: "ماذا يحدث في حال عدم التزام الأكاديمية بخطة التطوير؟", answer: "في حال عدم الالتزام، يتم توجيه إنذار رسمي، وقد تُفرض إجراءات تصحيحية إضافية. وفي حال استمرار المخالفة، قد تُتخذ تدابير إدارية تؤثر على المشاركة أو التصنيف." },
    { id: "mo9", category: "monitoring", question: "ما الهدف النهائي من نظام المتابعة والتطوير؟", answer: "يهدف النظام إلى رفع جودة عمل الأكاديميات، حماية اللاعبين، توحيد المعايير، تطوير المواهب، وبناء قاعدة سليمة تخدم المنتخبات الوطنية." },
  ];

  const filteredData = useMemo(() => {
    return faqData.filter(item => {
      return activeCategory === "all" || item.category === activeCategory;
    });
  }, [activeCategory]);

  const toggleOpen = (id: string) => {
    setOpenIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-[#F6F1E7] font-body-md pb-20" dir="rtl">
      <AppHeader />

      {/* Breadcrumb Sub-Header */}
      <div className="bg-[#022C22]/90 text-white border-t border-white/10">
        <div className="max-w-[1000px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Link to="/dashboard" className="hover:text-white transition-colors">لوحة الأكاديمية</Link>
            <span className="material-symbols-outlined text-[16px] text-[#C9A227]">chevron_left</span>
            <span className="text-white font-bold">الأسئلة الشائعة</span>
          </div>
          <Link to="/dashboard" className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-[#C9A227] text-[#022C22] rounded-lg font-bold text-xs hover:bg-[#D4B145] transition-colors">
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            العودة للوحة
          </Link>
        </div>
      </div>

      <main className="max-w-[1000px] mx-auto px-6 py-12 space-y-12">
        
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <h1 className="font-display-md text-4xl md:text-5xl font-bold text-[#064E3B]">
             الأسئلة الشائعة
          </h1>
          <p className="text-[#64748B] text-lg leading-relaxed">
            تعرّف على أبرز الأسئلة المتعلقة بمشروع انتساب وتصنيف أكاديميات كرة القدم، وآلية المشاركة في البطولات، ونظام المتابعة والتطوير.
          </p>
          <div className="inline-flex items-center gap-3 bg-[#022C22] text-[#C9A227] px-6 py-3 rounded-full font-bold text-sm shadow-lg">
             <span className="material-symbols-outlined text-lg">info</span>
             <span>الانتساب يضفي الصفة الرسمية، والتصنيف يفتح باب المشاركة.</span>
          </div>
        </div>


        {/* Categories Tab Bar */}
        <div className="flex flex-wrap justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all border-2 ${activeCategory === cat.id ? 'bg-[#064E3B] text-white border-[#064E3B] shadow-md' : 'bg-white text-[#64748B] border-[#E5DED0] hover:border-[#064E3B] hover:text-[#064E3B]'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {filteredData.length > 0 ? (
            filteredData.map((item) => (
              <div 
                key={item.id} 
                className={`bg-[#FFFDF7] border ${openIds.includes(item.id) ? 'border-[#064E3B] ring-2 ring-[#064E3B]/5 shadow-md' : 'border-[#E5DED0] shadow-sm hover:border-[#C9A227]'} rounded-2xl transition-all overflow-hidden`}
              >
                <button 
                  onClick={() => toggleOpen(item.id)}
                  className="w-full flex items-center justify-between p-5 md:p-6 text-right"
                >
                  <span className={`font-bold text-lg leading-tight ${openIds.includes(item.id) ? 'text-[#064E3B]' : 'text-[#022C22]'}`}>
                    {item.question}
                  </span>
                  <span className={`material-symbols-outlined transition-transform duration-300 ${openIds.includes(item.id) ? 'rotate-180 text-[#064E3B]' : 'text-[#64748B]'}`}>
                    expand_more
                  </span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openIds.includes(item.id) ? 'max-h-[500px]' : 'max-h-0'}`}>
                  <div className="p-5 md:p-6 pt-0 border-t border-[#E5DED0]/50 text-[#64748B] leading-relaxed text-lg bg-gray-50/30">
                    {item.answer}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-[#E5DED0]">
               <span className="material-symbols-outlined text-6xl text-gray-200 mb-4 font-light">search_off</span>
               <p className="text-gray-400 font-bold">عذراً، لا يوجد أسئلة في هذا القسم حالياً.</p>
               <button onClick={() => setActiveCategory("all")} className="mt-4 text-[#064E3B] font-bold hover:underline">عرض جميع الأسئلة</button>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="bg-[#022C22] text-white rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden text-center space-y-8">
           <div className="absolute top-0 left-0 w-64 h-64 bg-[#C9A227]/5 rounded-full -ml-32 -mt-32 blur-3xl"></div>
           <div className="relative z-10 space-y-4">
              <h2 className="text-3xl font-bold">هل لا تزال لديك أسئلة؟</h2>
              <p className="text-white/70 text-lg max-w-2xl mx-auto">
                 يمكنك العودة إلى لوحة الأكاديمية أو التواصل معنا للحصول على مزيد من التوضيح.
              </p>
           </div>
           
           <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/dashboard"
                className="w-full sm:w-auto px-10 py-4 bg-[#C9A227] text-[#022C22] rounded-2xl font-bold text-lg hover:bg-[#D4B145] transition-all shadow-xl hover:scale-105 active:scale-95"
              >
                العودة إلى لوحة الأكاديمية
              </Link>
              <Link 
                to="/contact"
                className="w-full sm:w-auto px-10 py-4 bg-white/10 text-white border border-white/20 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all"
              >
                اتصل بنا
              </Link>
           </div>
        </div>

      </main>
    </div>
  );
}
