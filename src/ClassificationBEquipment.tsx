import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { appStorage } from "./lib/appStorage";
import { uploadFileAndReturnMetadata } from "./lib/fileUpload";
import { AxisSummary } from "./components/AxisSummary";
import AppHeader from "./components/AppHeader";
import AxisTopNav from "./components/AxisTopNav";

export default function ClassificationBEquipment() {
  const navigate = useNavigate();

  // Section 1: Playing Kit
  const [hasPlayingKit, setHasPlayingKit] = useState<boolean | null>(null);
  const [playingKitPhotos, setPlayingKitPhotos] = useState<{
    name: string;
    uploadedAt: string;
  } | null>(null);

  // Section 2: Numbering
  const [hasNumbering, setHasNumbering] = useState<boolean | null>(null);
  const [numberingPhotos, setNumberingPhotos] = useState<{
    name: string;
    uploadedAt: string;
  } | null>(null);
  const [numberingConfirmed, setNumberingConfirmed] = useState(false);

  // Section 3: Logo
  const [hasShirtLogo, setHasShirtLogo] = useState<boolean | null>(null);
  const [shirtLogoPhotos, setShirtLogoPhotos] = useState<{
    name: string;
    uploadedAt: string;
  } | null>(null);

  // Section 4: Goalkeeper Kit
  const [hasGoalkeeperKit, setHasGoalkeeperKit] = useState<boolean | null>(
    null,
  );
  const [goalkeeperKitPhotos, setGoalkeeperKitPhotos] = useState<{
    name: string;
    uploadedAt: string;
  } | null>(null);

  // Section 5: Technical Staff Kit
  const [hasTechnicalStaffKit, setHasTechnicalStaffKit] = useState<
    boolean | null
  >(null);
  const [technicalStaffKitPhotos, setTechnicalStaffKitPhotos] = useState<{
    name: string;
    uploadedAt: string;
  } | null>(null);

  // Section 6: Goalposts
  const [hasGoalPosts, setHasGoalPosts] = useState<boolean | null>(null);
  const [goalPostsPhotos, setGoalPostsPhotos] = useState<{
    name: string;
    uploadedAt: string;
  } | null>(null);
  const [twoGoalPostsConfirmed, setTwoGoalPostsConfirmed] = useState(false);
  const [goalPostSizeConfirmed, setGoalPostSizeConfirmed] = useState(false);
  const [goalPostSize, setGoalPostSize] = useState("");
  const [customGoalPostSize, setCustomGoalPostSize] = useState("");

  const [showToast, setShowToast] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    appStorage.setItem("lastOpenedAxis", "/classification/b/equipment");

    const saved = appStorage.getItem("classificationB_equipment");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.hasPlayingKit !== undefined)
          setHasPlayingKit(parsed.hasPlayingKit);
        if (parsed.playingKitPhotos)
          setPlayingKitPhotos(parsed.playingKitPhotos);

        if (parsed.hasNumbering !== undefined)
          setHasNumbering(parsed.hasNumbering);
        if (parsed.numberingPhotos) setNumberingPhotos(parsed.numberingPhotos);
        if (parsed.numberingConfirmed !== undefined)
          setNumberingConfirmed(parsed.numberingConfirmed);

        if (parsed.hasShirtLogo !== undefined)
          setHasShirtLogo(parsed.hasShirtLogo);
        if (parsed.shirtLogoPhotos) setShirtLogoPhotos(parsed.shirtLogoPhotos);

        if (parsed.hasGoalkeeperKit !== undefined)
          setHasGoalkeeperKit(parsed.hasGoalkeeperKit);
        if (parsed.goalkeeperKitPhotos)
          setGoalkeeperKitPhotos(parsed.goalkeeperKitPhotos);

        if (parsed.hasTechnicalStaffKit !== undefined)
          setHasTechnicalStaffKit(parsed.hasTechnicalStaffKit);
        if (parsed.technicalStaffKitPhotos)
          setTechnicalStaffKitPhotos(parsed.technicalStaffKitPhotos);

        if (parsed.hasGoalPosts !== undefined)
          setHasGoalPosts(parsed.hasGoalPosts);
        if (parsed.goalPostsPhotos) setGoalPostsPhotos(parsed.goalPostsPhotos);
        if (parsed.twoGoalPostsConfirmed !== undefined)
          setTwoGoalPostsConfirmed(parsed.twoGoalPostsConfirmed);
        if (parsed.goalPostSizeConfirmed !== undefined)
          setGoalPostSizeConfirmed(parsed.goalPostSizeConfirmed);
        if (parsed.goalPostSize) setGoalPostSize(parsed.goalPostSize);
        if (parsed.customGoalPostSize)
          setCustomGoalPostSize(parsed.customGoalPostSize);

        if (parsed.lastUpdated) setLastUpdated(parsed.lastUpdated);
      } catch (e) {
        console.error("Error loading saved data", e);
      }
    }
  }, []);

  const saveProgress = (currentData: Record<string, any>) => {
    const prog = calculateCompletion(currentData);
    const dataToSave = {
      ...currentData,
      completionPercentage: prog.percentage,
      status: prog.status,
      lastUpdated: new Date().toISOString(),
    };
    appStorage.setItem("classificationB_equipment", JSON.stringify(dataToSave));
    appStorage.setItem("selectedApplicationType", "B");
    appStorage.setItem("applicationStarted", "true");
  };

  const calculateCompletion = (
    currentData: any = {
      hasPlayingKit,
      playingKitPhotos,
      hasNumbering,
      numberingPhotos,
      numberingConfirmed,
      hasShirtLogo,
      shirtLogoPhotos,
      hasGoalkeeperKit,
      goalkeeperKitPhotos,
      hasTechnicalStaffKit,
      technicalStaffKitPhotos,
      hasGoalPosts,
      goalPostsPhotos,
      twoGoalPostsConfirmed,
      goalPostSizeConfirmed,
    },
  ) => {
    const required = [
      currentData.hasPlayingKit === true,
      currentData.playingKitPhotos !== null,
      currentData.hasNumbering === true,
      currentData.numberingPhotos !== null,
      currentData.numberingConfirmed === true,
      currentData.hasShirtLogo === true,
      currentData.shirtLogoPhotos !== null,
      currentData.hasGoalkeeperKit === true,
      currentData.goalkeeperKitPhotos !== null,
      currentData.hasTechnicalStaffKit === true,
      currentData.technicalStaffKitPhotos !== null,
      currentData.hasGoalPosts === true,
      currentData.goalPostsPhotos !== null,
      currentData.twoGoalPostsConfirmed === true,
      currentData.goalPostSizeConfirmed === true,
    ];

    const metCount = required.filter(Boolean).length;
    const totalRequired = required.length;
    const percentage =
      totalRequired > 0 ? Math.round((metCount / totalRequired) * 100) : 0;

    let status = "لم يبدأ";
    if (percentage === 100) status = "مكتمل";
    else if (percentage >= 50) status = "مكتمل جزئيًا";
    else if (percentage > 0) status = "قيد التعبئة";

    return { percentage, status };
  };

  const handleUpdate = (updates: Partial<any>) => {
    const currentData = {
      hasPlayingKit,
      playingKitPhotos,
      hasNumbering,
      numberingPhotos,
      numberingConfirmed,
      hasShirtLogo,
      shirtLogoPhotos,
      hasGoalkeeperKit,
      goalkeeperKitPhotos,
      hasTechnicalStaffKit,
      technicalStaffKitPhotos,
      hasGoalPosts,
      goalPostsPhotos,
      twoGoalPostsConfirmed,
      goalPostSizeConfirmed,
      goalPostSize,
      customGoalPostSize,
      ...updates,
    };
    saveProgress(currentData);
  };

  const progress = calculateCompletion();

  const handleFileUpload =
    (fieldName: string, setter: any) =>
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          const { waitForAuth } = await import("./lib/auth");
                    const user = await waitForAuth();
          if (!user) return;
          
          const fileData = await uploadFileAndReturnMetadata(file, user.uid, "classification-axes");
          setter(fileData);
          handleUpdate({ [fieldName]: fileData });
        } catch (error) {
          console.error(error);
          alert((err as any)?.message || "فشل رفع الملف. يرجى المحاولة مرة أخرى.");
        }
      }
    };

  const goalPostStandards = [
    { age: "دون 10 ودون 11", size: "4.5 – 5 أمتار" },
    { age: "دون 12 ودون 13", size: "5 – 6 أمتار" },
  ];

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
        تم حفظ محور المعدات والتجهيزات لتصنيف B كمسودة
      </div>

      {/* Breadcrumbs */}
      <div className="bg-[#022C22]/90 text-white border-t border-white/10">
        <div className="max-w-[1000px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-white/80 overflow-x-auto whitespace-nowrap hide-scrollbar">
            <Link
              to="/dashboard"
              className="hover:text-white transition-colors"
            >
              لوحة الأكاديمية
            </Link>
            <span className="material-symbols-outlined text-[16px] text-[#C9A227]">
              chevron_left
            </span>
            <span className="text-white font-bold">تصنيف B</span>
            <span className="material-symbols-outlined text-[16px] text-[#C9A227]">
              chevron_left
            </span>
            <span className="text-white text-xs opacity-70">
              المعدات والتجهيزات
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-[1000px] mx-auto px-4 md:px-6 py-8 space-y-8">
        <AxisTopNav
          prevPath="/classification/b/safeguarding"
          nextPath="/classification/b/leadership"
          isNextDisabled={false}
        />

        <div>
          <div className="inline-flex items-center gap-2 bg-[#064E3B]/10 text-[#064E3B] px-4 py-1.5 rounded-full font-bold text-sm mb-4 border border-[#064E3B]/20">
            ملف تصنيف B
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#064E3B] mb-4">
            تصنيف B - المحور السابع: المعدات والتجهيزات
          </h1>
          <p className="text-[#64748B] text-lg leading-relaxed max-w-3xl">
            يتناول هذا المحور توفر المعدات والتجهيزات الأساسية المطلوبة
            للمشاركة، بما يشمل طقم اللعب، الترقيم، شعار الأكاديمية، لباس حارس
            المرمى، طقم الجهاز الفني، والمرمى.
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="bg-[#FFFDF7] rounded-3xl p-6 shadow-sm border border-[#E5DED0]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
            <div className="font-bold text-[#022C22] text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-[#064E3B]">
                checkroom
              </span>
              المحور 7 من 7
            </div>
            <div className="text-[#064E3B] font-bold">
              {progress.percentage}% مكتمل
            </div>
          </div>
          <div className="h-2.5 w-full bg-[#E5DED0] rounded-full overflow-hidden text-right">
            <div
              className="h-full bg-[#C9A227] rounded-full transition-all duration-1000"
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
        </div>

        {/* Section 1: Playing Kit */}
        <RequirementSection
          index="1"
          title="طقم اللعب"
          question="هل يوجد طقم لعب للفريق؟"
          helperText="يشمل طقم اللعب: قميص، شورت، جوارب."
          hasRequirement={hasPlayingKit}
          setHasRequirement={(val: any) => {
            setHasPlayingKit(val);
            handleUpdate({ hasPlayingKit: val });
          }}
          warningMessage="عدم توفر طقم لعب للفريق يعني أن هذا المتطلب غير مكتمل."
        >
          <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <RequirementInfoCard
              condition="وجود طقم لعب للفريق يتضمن قميص، شورت، وجوارب"
              evidence="تحميل صور الطقم"
            />
            <UploadCard
              label="رفع صور طقم اللعب"
              helper="يرجى رفع صور واضحة لطقم اللعب الكامل للفريق."
              file={playingKitPhotos}
              onUpload={handleFileUpload(
                "playingKitPhotos",
                setPlayingKitPhotos,
              )}
              onDelete={() => {
                setPlayingKitPhotos(null);
                handleUpdate({ playingKitPhotos: null });
              }}
            />
          </div>
        </RequirementSection>

        {/* Section 2: Numbering */}
        <RequirementSection
          index="2"
          title="الترقيم"
          question="هل يوجد رقم لكل لاعب على القميص من الخلف؟"
          helperText="يُمنع تكرار الأرقام بين اللاعبين داخل الفريق."
          hasRequirement={hasNumbering}
          setHasRequirement={(val: any) => {
            setHasNumbering(val);
            handleUpdate({ hasNumbering: val });
          }}
          warningMessage="عدم وجود أرقام واضحة على القمصان يعني أن هذا المتطلب غير مكتمل."
        >
          <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <RequirementInfoCard
              condition="وجود رقم لكل لاعب على القميص من الخلف مع عدم تكرار الأرقام"
              evidence="تحميل صور نموذج للقميص من الخلف"
            />
            <UploadCard
              label="رفع صور نموذج الترقيم"
              helper="يرجى رفع صورة واضحة تظهر رقم اللاعب على القميص من الخلف."
              file={numberingPhotos}
              onUpload={handleFileUpload("numberingPhotos", setNumberingPhotos)}
              onDelete={() => {
                setNumberingPhotos(null);
                handleUpdate({ numberingPhotos: null });
              }}
            />
            <ConfirmationCheckbox
              label="أؤكد أنه لا يوجد تكرار في أرقام اللاعبين داخل الفريق."
              checked={numberingConfirmed}
              onChange={(val: any) => {
                setNumberingConfirmed(val);
                handleUpdate({ numberingConfirmed: val });
              }}
            />
          </div>
        </RequirementSection>

        {/* Section 3: Logo */}
        <RequirementSection
          index="3"
          title="الشعار"
          question="هل يوجد شعار على القميص جهة اليسار؟"
          hasRequirement={hasShirtLogo}
          setHasRequirement={(val: any) => {
            setHasShirtLogo(val);
            handleUpdate({ hasShirtLogo: val });
          }}
          warningMessage="عدم وجود شعار الأكاديمية على القميص يعني أن هذا المتطلب غير مكتمل."
        >
          <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <RequirementInfoCard
              condition="وجود شعار الأكاديمية على القميص جهة اليسار"
              evidence="تحميل صور نموذج للشعار"
            />
            <UploadCard
              label="رفع صورة شعار القميص"
              helper="يرجى رفع صورة واضحة تظهر شعار الأكاديمية على القميص جهة اليسار."
              file={shirtLogoPhotos}
              onUpload={handleFileUpload("shirtLogoPhotos", setShirtLogoPhotos)}
              onDelete={() => {
                setShirtLogoPhotos(null);
                handleUpdate({ shirtLogoPhotos: null });
              }}
            />
          </div>
        </RequirementSection>

        {/* Section 4: Goalkeeper Kit */}
        <RequirementSection
          index="4"
          title="حارس المرمى"
          question="هل يوجد لباس خاص بحارس المرمى يميزه عن باقي اللاعبين؟"
          hasRequirement={hasGoalkeeperKit}
          setHasRequirement={(val: any) => {
            setHasGoalkeeperKit(val);
            handleUpdate({ hasGoalkeeperKit: val });
          }}
          warningMessage="عدم توفر لباس خاص لحارس المرمى يعني أن هذا المتطلب غير مكتمل."
        >
          <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <RequirementInfoCard
              condition="وجود لباس خاص بحارس المرمى يميزه عن باقي اللاعبين"
              evidence="تحميل صورة الطقم"
            />
            <UploadCard
              label="رفع صورة طقم حارس المرمى"
              helper="يرجى رفع صورة واضحة لطقم حارس المرمى."
              file={goalkeeperKitPhotos}
              onUpload={handleFileUpload(
                "goalkeeperKitPhotos",
                setGoalkeeperKitPhotos,
              )}
              onDelete={() => {
                setGoalkeeperKitPhotos(null);
                handleUpdate({ goalkeeperKitPhotos: null });
              }}
            />
          </div>
        </RequirementSection>

        {/* Section 5: Technical Staff Kit */}
        <RequirementSection
          index="5"
          title="طقم الجهاز الفني"
          question="هل يوجد طقم خاص وموحد للأجهزة الفنية؟"
          helperText="يشمل الطقم: قميص، شورت، جوارب. ويُطلب طباعة شعار الأكاديمية فقط."
          hasRequirement={hasTechnicalStaffKit}
          setHasRequirement={(val: any) => {
            setHasTechnicalStaffKit(val);
            handleUpdate({ hasTechnicalStaffKit: val });
          }}
          warningMessage="عدم توفر طقم موحد للجهاز الفني يعني أن هذا المتطلب غير مكتمل."
        >
          <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <RequirementInfoCard
              condition="وجود طقم خاص وموحد للأجهزة الفنية يتضمن قميص، شورت، وجوارب"
              evidence="تحميل صورة الطقم مع طباعة شعار الأكاديمية فقط"
            />
            <UploadCard
              label="رفع صورة طقم الجهاز الفني"
              helper="يرجى رفع صورة واضحة لطقم الجهاز الفني الموحد مع شعار الأكاديمية."
              file={technicalStaffKitPhotos}
              onUpload={handleFileUpload(
                "technicalStaffKitPhotos",
                setTechnicalStaffKitPhotos,
              )}
              onDelete={() => {
                setTechnicalStaffKitPhotos(null);
                handleUpdate({ technicalStaffKitPhotos: null });
              }}
            />
          </div>
        </RequirementSection>

        {/* Section 6: Goalposts */}
        <RequirementSection
          index="6"
          title="المرمى"
          question="هل يوجد مرميان ضمن المواصفات أدناه؟"
          hasRequirement={hasGoalPosts}
          setHasRequirement={(val: any) => {
            setHasGoalPosts(val);
            handleUpdate({ hasGoalPosts: val });
          }}
          warningMessage="عدم توفر مرميين ضمن المواصفات المطلوبة يعني أن هذا المتطلب غير مكتمل."
          persistentContent={
            <div className="overflow-x-auto rounded-2xl border border-[#E5DED0]">
              <table className="w-full text-right bg-white">
                <thead className="bg-[#022C22] text-white">
                  <tr>
                    <th className="py-3 px-6 text-sm font-bold">الفئة</th>
                    <th className="py-3 px-6 text-sm font-bold border-r border-white/10 text-center">
                      قياس العرض
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {goalPostStandards.map((std, i) => (
                    <tr key={i} className="border-t border-[#E5DED0]">
                      <td className="py-4 px-6 text-[#022C22] font-bold text-sm">
                        {std.age}
                      </td>
                      <td className="py-4 px-6 text-[#064E3B] font-bold text-sm border-r border-[#E5DED0] text-center">
                        {std.size}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
        >
          <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <RequirementInfoCard
              condition="وجود مرميين ضمن المواصفات المطلوبة"
              evidence="تحميل صور واضحة للمرميين"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <UploadCard
                  label="رفع صور المرميين"
                  helper="يرجى رفع صور واضحة للمرميين المستخدمين في التدريبات أو المباريات."
                  file={goalPostsPhotos}
                  onUpload={handleFileUpload(
                    "goalPostsPhotos",
                    setGoalPostsPhotos,
                  )}
                  onDelete={() => {
                    setGoalPostsPhotos(null);
                    handleUpdate({ goalPostsPhotos: null });
                  }}
                />
              </div>
              <div className="space-y-4 pt-4">
                <ConfirmationCheckbox
                  label="أؤكد أن عدد المرميين لا يقل عن اثنين."
                  checked={twoGoalPostsConfirmed}
                  onChange={(val: any) => {
                    setTwoGoalPostsConfirmed(val);
                    handleUpdate({ twoGoalPostsConfirmed: val });
                  }}
                />
                <ConfirmationCheckbox
                  label="أؤكد أن قياس المرمى مناسب للفئات العمرية المطلوبة."
                  checked={goalPostSizeConfirmed}
                  onChange={(val: any) => {
                    setGoalPostSizeConfirmed(val);
                    handleUpdate({ goalPostSizeConfirmed: val });
                  }}
                />
                <div className="space-y-2">
                  <label className="font-bold text-[#022C22] text-sm">
                    قياس المرمى المتوفر
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["4.5 – 5 أمتار", "5 – 6 أمتار", "قياس آخر"].map(
                      (size) => (
                        <button
                          key={size}
                          onClick={() => {
                            setGoalPostSize(size);
                            handleUpdate({ goalPostSize: size });
                          }}
                          className={`px-3 py-2 rounded-lg text-xs font-bold border-2 transition-all ${goalPostSize === size ? "bg-[#064E3B] text-white border-[#064E3B]" : "bg-gray-50 text-[#64748B] border-gray-100 hover:border-gray-200"}`}
                        >
                          {size}
                        </button>
                      ),
                    )}
                  </div>
                  {goalPostSize === "قياس آخر" && (
                    <input
                      type="text"
                      value={customGoalPostSize}
                      onChange={(e) => {
                        setCustomGoalPostSize(e.target.value);
                        handleUpdate({ customGoalPostSize: e.target.value });
                      }}
                      placeholder="أدخل قياس المرمى"
                      className="w-full p-3.5 rounded-xl border border-[#E5DED0] outline-none focus:border-[#064E3B] text-sm"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </RequirementSection>

        {/* Section 7: Summary */}
        <AxisSummary
          title="ملخص جاهزية المعدات والتجهيزات"
          icon="inventory_2"
          percentage={progress.percentage}
          status={progress.status}
          subTitle="تصنيف B - المحور السابع والاخير"
          backLink="/dashboard"
          items={[
            {
              label: "طقم اللعب",
              isActive: hasPlayingKit === true && !!playingKitPhotos,
            },
            {
              label: "الترقيم",
              isActive:
                hasNumbering === true &&
                !!numberingPhotos &&
                numberingConfirmed,
            },
            {
              label: "الشعار",
              isActive: hasShirtLogo === true && !!shirtLogoPhotos,
            },
            {
              label: "طقم حارس المرمى",
              isActive: hasGoalkeeperKit === true && !!goalkeeperKitPhotos,
            },
            {
              label: "طقم الجهاز الفني",
              isActive:
                hasTechnicalStaffKit === true && !!technicalStaffKitPhotos,
            },
            {
              label: "المرميين",
              isActive:
                hasGoalPosts === true &&
                !!goalPostsPhotos &&
                twoGoalPostsConfirmed &&
                goalPostSizeConfirmed,
            },
          ]}
        >
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Link
              to="/classification/b/safeguarding"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold bg-white border-2 border-[#E5DED0] text-[#022C22] hover:bg-gray-50 transition-all text-center flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">
                arrow_forward
              </span>
              السابق: الرعاية والتعليم
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold bg-white border-2 border-[#E5DED0] text-gray-500 hover:text-[#022C22] hover:bg-gray-50 transition-all text-center flex items-center justify-center gap-2"
            >
              الرجوع للوحة
            </Link>
            <Link
              to="/classification/b/leadership"
              className="w-full sm:w-auto px-10 py-3.5 rounded-2xl font-bold bg-[#C9A227] text-white hover:bg-[#A8861D] transition-all flex items-center justify-center gap-3 shadow-md active:scale-95"
            >
              مراجعة الملف
              <span className="material-symbols-outlined text-[20px] rotate-180">
                arrow_forward
              </span>
            </Link>
          </div>
        </AxisSummary>
      </main>
    </div>
  );
}

// Sub-components for cleaner code
function RequirementSection({
  index,
  title,
  question,
  helperText,
  hasRequirement,
  setHasRequirement,
  warningMessage,
  persistentContent,
  children,
}: any) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#064E3B] text-white rounded-full flex items-center justify-center font-bold font-mono">
          {index}
        </div>
        <h2 className="text-xl font-bold text-[#022C22]">{title}</h2>
      </div>

      <div className="bg-white rounded-[32px] border border-[#E5DED0] p-6 md:p-8 space-y-8 shadow-sm">
        <div>
          <p className="font-bold text-[#022C22] mb-1">{question}</p>
          {helperText && (
            <p className="text-xs text-[#64748B] mb-4">{helperText}</p>
          )}
          <div className="flex gap-4">
            <button
              onClick={() => setHasRequirement(true)}
              className={`flex-1 sm:flex-none px-10 py-3.5 rounded-xl font-bold transition-all border-2 ${hasRequirement === true ? "bg-[#064E3B] text-white border-[#064E3B] shadow-md shadow-[#064E3B]/20" : "bg-white text-[#64748B] border-[#E5DED0] hover:border-[#064E3B]/30"}`}
            >
              نعم
            </button>
            <button
              onClick={() => setHasRequirement(false)}
              className={`flex-1 sm:flex-none px-10 py-3.5 rounded-xl font-bold transition-all border-2 ${hasRequirement === false ? "bg-red-500 text-white border-red-500 shadow-md shadow-red-200" : "bg-white text-[#64748B] border-[#E5DED0] hover:border-red-300"}`}
            >
              كلا
            </button>
          </div>
        </div>

        {persistentContent}

        {children}
      </div>
    </section>
  );
}

function RequirementInfoCard({
  condition,
  evidence,
}: {
  condition: string;
  evidence: string;
}) {
  return (
    <div className="bg-[#F6F1E7]/50 rounded-2xl p-6 border border-[#E5DED0]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-block px-3 py-1 bg-[#064E3B]/10 text-[#064E3B] rounded-lg text-xs font-bold mb-2">
            الشرط
          </div>
          <p className="font-bold text-[#022C22] text-sm">{condition}</p>
        </div>
        <div className="md:text-left">
          <div className="inline-block px-3 py-1 bg-[#C9A227]/10 text-[#C9A227] rounded-lg text-xs font-bold mb-2">
            الدليل المطلوب
          </div>
          <p className="font-bold text-[#C9A227] text-sm">{evidence}</p>
        </div>
      </div>
    </div>
  );
}

function UploadCard({ label, helper, file, onUpload, onDelete }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-[#022C22] text-sm">{label}</h4>
        <div className="text-[10px] font-black text-[#C9A227] bg-[#C9A227]/5 px-3 py-1 rounded-full border border-[#C9A227]/20 uppercase">
          JPG, PNG, PDF
        </div>
      </div>
      {!file ? (
        <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#E5DED0] rounded-2xl bg-gray-50/20 hover:bg-white hover:border-[#064E3B]/30 transition-all cursor-pointer group h-[160px]">
          <input
            type="file"
            className="hidden"
            accept=".jpg,.png,.pdf"
            onChange={onUpload}
          />
          <span className="material-symbols-outlined text-4xl text-[#64748B] group-hover:text-[#064E3B] mb-2 transition-colors">
            add_photo_alternate
          </span>
          <span className="text-sm font-bold text-[#022C22]">اضغط للرفع</span>
          <p className="text-[10px] text-[#64748B] mt-1 text-center font-medium">
            {helper}
          </p>
        </label>
      ) : (
        <div className="bg-white border border-[#E5DED0] rounded-2xl p-5 flex items-center justify-between shadow-sm border-r-4 border-r-green-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shrink-0">
              <span className="material-symbols-outlined">image</span>
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-[#022C22] truncate max-w-[150px]">
                {file.name}
              </div>
              <div className="text-[10px] text-green-600 font-bold">
                تم الرفع
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onDelete}
              className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-red-50"
            >
              <span className="material-symbols-outlined text-[20px]">
                delete
              </span>
            </button>
            <label className="p-2.5 text-[#064E3B] hover:bg-[#064E3B]/5 rounded-xl transition-colors cursor-pointer border border-[#064E3B]/10">
              <input
                type="file"
                className="hidden"
                accept=".jpg,.png,.pdf"
                onChange={onUpload}
              />
              <span className="material-symbols-outlined text-[20px]">
                edit_square
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfirmationCheckbox({ label, checked, onChange }: any) {
  return (
    <label
      className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${checked ? "bg-[#064E3B]/5 border-[#064E3B]" : "bg-gray-50/50 border-[#E5DED0] hover:border-gray-200"}`}
    >
      <div
        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${checked ? "bg-[#064E3B] border-[#064E3B] text-white" : "bg-white border-gray-300"}`}
      >
        {checked && (
          <span className="material-symbols-outlined text-[18px]">check</span>
        )}
      </div>
      <input
        type="checkbox"
        className="hidden"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <p className="font-bold text-[#022C22] text-xs leading-relaxed">
        {label}
      </p>
    </label>
  );
}
