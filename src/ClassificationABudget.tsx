import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "./components/AppHeader";
import AxisTopNav from "./components/AxisTopNav";
import { appStorage } from "./lib/appStorage";

const BASE_EXPENSES_KEYS = [
  { id: "tech_salaries", label: "رواتب الجهاز الفني" },
  { id: "admin_salaries", label: "رواتب الإداريين" },
  { id: "field_rent", label: "بدل ملعب" },
  { id: "lfa_fees", label: "رسوم الاتحاد" },
  { id: "medical_insurance", label: "تأمين طبي / إسعافات أولية" },
  { id: "equipment", label: "تجهيزات ومعدات" },
  { id: "dev_activities", label: "أنشطة تطوير" },
];

const BASE_INCOME_KEYS = [
  { id: "player_subs", label: "اشتراكات اللاعبين" },
  { id: "sponsorships", label: "رعايات" },
  { id: "owner_contribution", label: "مساهمة المالك / الإدارة" },
  { id: "activities", label: "أنشطة / بطولات" },
  { id: "others", label: "مصادر أخرى" },
];

const DEFAULT_DATA = {
  generalInfo: {
    season: "",
    playersCount: 0,
    ageGroupsCount: 0,
    coachesCount: 0,
    adminsCount: 0,
  },
  baseExpenses: BASE_EXPENSES_KEYS.reduce(
    (acc, curr) => ({
      ...acc,
      [curr.id]: { covered: false, value: 0, notes: "" },
    }),
    {},
  ),
  extraExpenses: [],
  baseIncomeSources: BASE_INCOME_KEYS.reduce(
    (acc, curr) => ({ ...acc, [curr.id]: { value: 0, notes: "" } }),
    {},
  ),
  extraIncomeSources: [],
  notes: "",
};

export default function ClassificationABudget() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(DEFAULT_DATA);
  const [showToast, setShowToast] = useState(false);
  const [extraExpenseInput, setExtraExpenseInput] = useState({
    name: "",
    value: 0,
    notes: "",
  });
  const [extraIncomeInput, setExtraIncomeInput] = useState({
    name: "",
    value: 0,
    notes: "",
  });

  useEffect(() => {
    appStorage.setItem("lastOpenedAxis", "/classification/a/budget");
    const saved = appStorage.getItem("classificationA_budget");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData({
          ...DEFAULT_DATA,
          ...parsed,
          generalInfo: { ...DEFAULT_DATA.generalInfo, ...parsed.generalInfo },
          baseExpenses: {
            ...DEFAULT_DATA.baseExpenses,
            ...parsed.baseExpenses,
          },
          baseIncomeSources: {
            ...DEFAULT_DATA.baseIncomeSources,
            ...parsed.baseIncomeSources,
          },
        });
      } catch (e) {
        console.error("Error loading saved data");
      }
    }
  }, []);

  const calculateProgressAndTotals = (currentData: any) => {
    let completed = 0;
    const totalReqs = 13;

    // General Info (5)
    if (currentData.generalInfo?.season) completed++;
    if (Number(currentData.generalInfo?.playersCount) > 0) completed++;
    if (Number(currentData.generalInfo?.ageGroupsCount) > 0) completed++;
    if (Number(currentData.generalInfo?.coachesCount) > 0) completed++;
    if (Number(currentData.generalInfo?.adminsCount) > 0) completed++;

    // Base Expenses (7)
    let coveredBaseExpensesCount = 0;
    let totalExpensesNum = 0;
    BASE_EXPENSES_KEYS.forEach((key) => {
      const item = currentData.baseExpenses?.[key.id];
      if (item?.covered && Number(item?.value) > 0) {
        completed++;
        coveredBaseExpensesCount++;
      }
      totalExpensesNum += Number(item?.value || 0);
    });

    currentData.extraExpenses?.forEach((ex: any) => {
      totalExpensesNum += Number(ex.value || 0);
    });

    // Income (1)
    let hasIncome = false;
    let totalIncomeNum = 0;
    Object.values(currentData.baseIncomeSources || {}).forEach((item: any) => {
      totalIncomeNum += Number(item?.value || 0);
      if (Number(item?.value || 0) > 0) hasIncome = true;
    });
    currentData.extraIncomeSources?.forEach((ex: any) => {
      totalIncomeNum += Number(ex.value || 0);
      if (Number(ex.value || 0) > 0) hasIncome = true;
    });

    if (hasIncome) completed++;

    const percentage = Math.round((completed / totalReqs) * 100);
    const status =
      percentage === 0
        ? "لم يبدأ"
        : percentage === 100
          ? "مكتمل"
          : percentage >= 50
            ? "مكتمل جزئيًا"
            : "قيد التعبئة";

    return {
      percentage,
      status,
      totalExpenses: totalExpensesNum,
      totalIncome: totalIncomeNum,
      balance: totalIncomeNum - totalExpensesNum,
      coveredBaseExpensesCount,
      completed,
      totalReqs,
    };
  };

  const totals = calculateProgressAndTotals(data);

  const saveProgress = (currentData: any = data) => {
    const calc = calculateProgressAndTotals(currentData);
    const payload = {
      ...currentData,
      totalExpenses: calc.totalExpenses,
      totalIncome: calc.totalIncome,
      balance: calc.balance,
      coveredBaseExpensesCount: calc.coveredBaseExpensesCount,
      completionPercentage: calc.percentage,
      status: calc.status,
      lastUpdated: Date.now(),
    };
    appStorage.setItem("classificationA_budget", JSON.stringify(payload));

    // Explicitly set app type to A and application started so dashboard updates
    appStorage.setItem("selectedApplicationType", "A");
    appStorage.setItem("applicationStarted", "true");

    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const updateGeneralInfo = (field: string, value: string | number) => {
    const newData = {
      ...data,
      generalInfo: { ...data.generalInfo, [field]: value },
    };
    setData(newData);
    // Auto-save disabled per input for performance, user will click save?
    // Let's autosave on change
    saveProgress(newData);
  };

  const updateBaseExpense = (id: string, field: string, value: any) => {
    const newData = {
      ...data,
      baseExpenses: {
        ...data.baseExpenses,
        [id]: { ...data.baseExpenses[id], [field]: value },
      },
    };
    setData(newData);
    saveProgress(newData);
  };

  const updateBaseIncome = (id: string, field: string, value: any) => {
    const newData = {
      ...data,
      baseIncomeSources: {
        ...data.baseIncomeSources,
        [id]: { ...data.baseIncomeSources[id], [field]: value },
      },
    };
    setData(newData);
    saveProgress(newData);
  };

  const addExtraExpense = () => {
    if (!extraExpenseInput.name || extraExpenseInput.value <= 0) return;
    const newData = {
      ...data,
      extraExpenses: [
        ...data.extraExpenses,
        { ...extraExpenseInput, id: Date.now().toString() },
      ],
    };
    setData(newData);
    setExtraExpenseInput({ name: "", value: 0, notes: "" });
    saveProgress(newData);
  };

  const deleteExtraExpense = (id: string) => {
    const newData = {
      ...data,
      extraExpenses: data.extraExpenses.filter((e: any) => e.id !== id),
    };
    setData(newData);
    saveProgress(newData);
  };

  const addExtraIncome = () => {
    if (!extraIncomeInput.name || extraIncomeInput.value <= 0) return;
    const newData = {
      ...data,
      extraIncomeSources: [
        ...data.extraIncomeSources,
        { ...extraIncomeInput, id: Date.now().toString() },
      ],
    };
    setData(newData);
    setExtraIncomeInput({ name: "", value: 0, notes: "" });
    saveProgress(newData);
  };

  const deleteExtraIncome = (id: string) => {
    const newData = {
      ...data,
      extraIncomeSources: data.extraIncomeSources.filter(
        (e: any) => e.id !== id,
      ),
    };
    setData(newData);
    saveProgress(newData);
  };

  return (
    <div className="min-h-screen bg-[#F6F1E7] font-body-md pb-24" dir="rtl">
      <AppHeader showBackToDashboard />

      {/* Toast Notification */}
      <div
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#022C22] text-white px-6 py-3 rounded-xl shadow-lg font-bold flex items-center gap-3 transition-all duration-300 ${showToast ? "translate-y-0 opacity-100" : "-translate-y-20 opacity-0"}`}
      >
        <span className="material-symbols-outlined text-[#C9A227]">
          check_circle
        </span>
        تم حفظ نموذج الميزانية كمسودة
      </div>

      {/* Main Content */}
      <main className="max-w-[1000px] mx-auto px-4 md:px-6 py-8 space-y-8">
        <AxisTopNav
          prevPath="/classification/a/technical"
          nextPath="/classification/a/facilities"
        />

        {/* Page Title */}
        <div>
          <div className="inline-flex items-center gap-2 bg-[#C9A227]/10 text-[#C9A227] px-4 py-1.5 rounded-full font-bold text-sm mb-4 border border-[#C9A227]/20">
            ملف تصنيف A
          </div>
          <h1 className="font-display-md text-3xl md:text-4xl font-bold text-[#064E3B] mb-4">
            المحور الخامس: الميزانية المالية
          </h1>
          <p className="text-[#64748B] text-lg leading-relaxed max-w-3xl">
            يهدف هذا المحور إلى توثيق المصاريف والإيرادات الخاصة بالأكاديمية
            للتأكد من الاستدامة المالية والشفافية. يرجى إدخال كافة المعلومات
            بدقة والتأكيد على صحتها.
          </p>
        </div>

        <div className="bg-[#FFFDF7] rounded-3xl p-6 shadow-sm border border-[#E5DED0]">
          <h3 className="text-xl font-bold text-[#022C22] mb-4">
            معلومات عامة للموسم
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="الموسم الرياضي"
              value={data.generalInfo?.season || ""}
              onChange={(e) => updateGeneralInfo("season", e.target.value)}
              className="w-full bg-white border border-[#E5DED0] rounded-xl px-4 py-3 outline-none focus:border-[#C9A227]"
            />
            <input
              type="number"
              placeholder="عدد اللاعبين المسجلين"
              value={data.generalInfo?.playersCount || ""}
              onChange={(e) =>
                updateGeneralInfo("playersCount", parseInt(e.target.value))
              }
              className="w-full bg-white border border-[#E5DED0] rounded-xl px-4 py-3 outline-none focus:border-[#C9A227]"
            />
          </div>
        </div>

        <div className="bg-[#FFFDF7] rounded-3xl p-6 shadow-sm border border-[#E5DED0]">
          <h3 className="text-xl font-bold text-[#022C22] mb-4">
            المصاريف الأساسية
          </h3>
          <div className="space-y-4">
            {BASE_EXPENSES_KEYS.map((expense) => (
              <div
                key={expense.id}
                className="flex flex-col md:flex-row md:items-center gap-4 bg-white p-4 rounded-xl border border-[#E5DED0]"
              >
                <span className="font-bold text-[#022C22] w-1/3">
                  {expense.label}
                </span>
                <label className="flex items-center gap-2 text-sm font-bold w-1/4">
                  <input
                    type="checkbox"
                    checked={data.baseExpenses?.[expense.id]?.covered || false}
                    onChange={(e) =>
                      updateBaseExpense(expense.id, "covered", e.target.checked)
                    }
                    className="w-4 h-4 accent-[#064E3B]"
                  />
                  تمت تغطيتها
                </label>
                <input
                  type="number"
                  placeholder="القيمة (بالدولار)"
                  value={data.baseExpenses?.[expense.id]?.value || ""}
                  onChange={(e) =>
                    updateBaseExpense(
                      expense.id,
                      "value",
                      parseInt(e.target.value),
                    )
                  }
                  className="w-full md:w-1/4 bg-white border border-[#E5DED0] rounded-lg px-3 py-2 outline-none focus:border-[#C9A227]"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#FFFDF7] rounded-3xl p-6 shadow-sm border border-[#E5DED0]">
          <h3 className="text-xl font-bold text-[#022C22] mb-4">
            الإيرادات ومصادر الدخل
          </h3>
          <div className="space-y-4">
            {BASE_INCOME_KEYS.map((income) => (
              <div
                key={income.id}
                className="flex flex-col md:flex-row md:items-center gap-4 bg-white p-4 rounded-xl border border-[#E5DED0]"
              >
                <span className="font-bold text-[#022C22] w-1/3">
                  {income.label}
                </span>
                <input
                  type="number"
                  placeholder="القيمة (بالدولار)"
                  value={data.baseIncomeSources?.[income.id]?.value || ""}
                  onChange={(e) =>
                    updateBaseIncome(
                      income.id,
                      "value",
                      parseInt(e.target.value),
                    )
                  }
                  className="w-full md:w-1/3 bg-white border border-[#E5DED0] rounded-lg px-3 py-2 outline-none focus:border-[#C9A227]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Completion Summary */}
        <div className="bg-[#FFFDF7] rounded-3xl p-6 md:p-8 shadow-sm border border-[#C9A227]/30 mb-8">
          <h3 className="font-bold text-[#022C22] text-xl mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#C9A227]">note_alt</span>
            ملاحظات الأكاديمية (اختياري)
          </h3>
          <textarea
            value={data.notes}
            onChange={(e) => setData({ ...data, notes: e.target.value })}
            placeholder="أضف أي ملاحظات أو توضيحات إضافية حول ميزانية الأكاديمية..."
            className="w-full bg-white border border-[#E5DED0] rounded-xl p-4 outline-none focus:border-[#C9A227] min-h-[120px] resize-y"
          />
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#E5DED0] mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-[#022C22]">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-xl border-4 ${totals.percentage === 100 ? "bg-green-100 border-green-500 text-green-700" : "bg-[#FFF9E6] border-[#C9A227] text-[#C9A227]"}`}
              >
                {totals.percentage}%
              </div>
              <div>
                <h3 className="font-black text-xl mb-1">ملخص المحور</h3>
                <p className="text-[#64748B] text-sm font-bold">
                  {totals.percentage === 100
                    ? "اكتملت جميع متطلبات هذا المحور"
                    : "يرجى إكمال المتطلبات المتبقية لإنهاء المحور"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col md:flex-row items-center gap-4 pt-10 border-t border-[#E5DED0]">
          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4 md:mr-auto">
            <Link
              to="/classification/a/technical"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold bg-white border border-[#E5DED0] text-[#64748B] hover:text-[#022C22] hover:bg-gray-50 transition-all text-center flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">
                chevron_right
              </span>
              السابق: الجانب الفني
            </Link>
            <button
              onClick={() => saveProgress(data)}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold bg-white border border-[#E5DED0] text-[#64748B] hover:text-[#064E3B] hover:border-[#064E3B] transition-all text-center flex items-center justify-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">
                save
              </span>
              حفظ كمسودة
            </button>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold bg-white border border-[#E5DED0] text-[#64748B] hover:text-[#022C22] hover:bg-gray-50 transition-all text-center flex items-center justify-center gap-2"
            >
              الرجوع للوحة
            </Link>
            <Link
              to="/classification/a/facilities"
              className="w-full sm:w-auto px-10 py-4 rounded-2xl font-bold bg-[#064E3B] text-white hover:bg-[#022C22] transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-95"
            >
              التالي: الملعب والمرافق
              <span className="material-symbols-outlined text-[20px]">
                chevron_left
              </span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
