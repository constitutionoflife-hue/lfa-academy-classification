import UploadTrigger from "./components/UploadTrigger";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppHeader from "./components/AppHeader";
import AxisTopNav from "./components/AxisTopNav";
import {
  getRegistryData,
  getPersonByRole,
  getPeopleByRole,
} from "./lib/registry";
import { appStorage } from "./lib/appStorage";
import { uploadFileAndReturnMetadata } from "./lib/fileUpload";
import { AxisSummary } from "./components/AxisSummary";

interface Requirement {
  id: string;
  condition: string;
  proofType:
    | "file"
    | "checkbox"
    | "text"
    | "url"
    | "select"
    | "selectPerson"
    | "automatic"
    | "yes_no";
  proofLabel?: string;
  details?: string;
  optional?: boolean;
  placeholder?: string;
  hasFileIfYes?: boolean; // custom to show file upload if yes
}

export default function ClassificationASocialMedia() {
  const navigate = useNavigate();
  const [data, setData] = useState<Record<string, any>>({});
  const [showToast, setShowToast] = useState(false);
  const [registryPeople, setRegistryPeople] = useState<any[]>([]);

  useEffect(() => {
    appStorage.setItem("lastOpenedAxis", "/classification/a/social-media");
    const saved = appStorage.getItem("classificationA_social_media");
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading saved data");
      }
    }
    const registry = getRegistryData();
    setRegistryPeople(registry.people || []);
  }, []);

  const saveProgress = (currentData: Record<string, any>) => {
    const progress = calculateProgress(currentData);
    const payload = {
      ...currentData,
      completionPercentage: progress.percentage,
      status:
        progress.percentage === 0
          ? "لم يبدأ"
          : progress.percentage === 100
            ? "مكتمل"
            : progress.percentage >= 50
              ? "مكتمل جزئيًا"
              : "قيد التعبئة",
      lastUpdated: Date.now(),
    };
    appStorage.setItem("classificationA_social_media", JSON.stringify(payload));
    appStorage.setItem("applicationStarted", "true");
  };

  const handleFileUpload = async (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { waitForAuth } = await import("./lib/auth");
                const user = await waitForAuth();
        if (!user) return;
        
        const fileData = await uploadFileAndReturnMetadata(file, user.uid, "classification-axes");
        setData((prev) => {
          const newData = { ...prev, [id]: fileData };
          saveProgress(newData);
          return newData;
        });
      } catch (err) {
        console.error("Upload failed", err);
        alert((err as any)?.message || "فشل رفع الملف. يرجى المحاولة مرة أخرى.");
      }
    }
  };

  const handleFileCancel = (id: string) => {
    setData((prev) => {
      const newData = { ...prev };
      delete newData[id];
      saveProgress(newData);
      return newData;
    });
  };

  const handleCheckboxChange = (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setData((prev) => {
      const newData = {
        ...prev,
        [id]: { type: "checkbox", checked: e.target.checked },
      };
      saveProgress(newData);
      return newData;
    });
  };

  const handleYesNoChange = (id: string, value: "yes" | "no") => {
    setData((prev) => {
      const newData = { ...prev, [id]: { type: "yes_no", value } };
      saveProgress(newData);
      return newData;
    });
  };

  const handlePlatformUsernameChange = (platform: string, username: string) => {
    setData((prev) => {
      const platformData = prev.platformData || {};
      const newData = {
        ...prev,
        platformData: {
          ...platformData,
          [platform]: username,
        },
      };
      saveProgress(newData);
      return newData;
    });
  };

  const handleTextChange = (id: string, value: string) => {
    setData((prev) => {
      const newData = { ...prev, [id]: { ...prev[id], value } };
      saveProgress(newData);
      return newData;
    });
  };

  const handlePlatformChange = (platform: string) => {
    setData((prev) => {
      const currentPlatforms = prev.platforms || [];
      const newPlatforms = currentPlatforms.includes(platform)
        ? currentPlatforms.filter((p: string) => p !== platform)
        : [...currentPlatforms, platform];
      const newData = { ...prev, platforms: newPlatforms };
      saveProgress(newData);
      return newData;
    });
  };

  const calculateProgress = (currentData: Record<string, any> = data) => {
    let completedCount = 0;
    let total = 0;

    // 1. Official Presence
    total++;
    if (currentData.has_official_page?.value) {
      if (currentData.has_official_page.value === "no") {
        completedCount++;
      } else if (currentData.has_official_page.value === "yes") {
        const platforms = currentData.platforms || [];
        if (platforms.length > 0) {
          // Check if all selected platforms have a username
          let allPlatformsHaveUsername = true;
          platforms.forEach((p: string) => {
            if (
              !currentData.platformData ||
              !currentData.platformData[p] ||
              currentData.platformData[p].trim() === ""
            ) {
              allPlatformsHaveUsername = false;
            }
          });
          if (allPlatformsHaveUsername) completedCount++;
        }
      }
    }

    // "is there a written plan or policy for content creation"
    total++;
    if (currentData.content_plan_policy?.value) completedCount++;

    // 2. Content & Publishing
    const contentReqs = [
      "training_content_yesno",
      "match_content_yesno",
      "educational_values_yesno",
      "non_offensive_yesno",
    ];
    contentReqs.forEach((req) => {
      total++;
      if (currentData[req]?.value) completedCount++;
    });

    total++;
    if (currentData.review_mechanism_yesno?.value === "no") {
      completedCount++;
    } else if (currentData.review_mechanism_yesno?.value === "yes") {
      if (currentData["review_mechanism_yesno_file"]?.uploaded) {
        completedCount++;
      }
    }

    // 3. Media Responsibility (moved up, removing visual identity)
    total += 3;
    if (currentData.legal_abuse_confirm?.checked) completedCount++;
    if (currentData.legal_children_confirm?.checked) completedCount++;
    if (currentData.legal_parents_confirm?.checked) completedCount++;

    // Role checks
    total += 2;
    const mediaOfficer = getPersonByRole("mediaOfficer");
    const socialMediaOfficer = getPersonByRole("socialMediaOfficer");
    if (mediaOfficer) completedCount++;
    if (socialMediaOfficer) completedCount++;

    return {
      total,
      completed: completedCount,
      percentage: total > 0 ? Math.round((completedCount / total) * 100) : 0,
    };
  };

  const progress = calculateProgress();

  const renderUploadField = (
    id: string,
    label: string,
    helperText?: string,
  ) => {
    const currentFile = data[id];
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-bold text-[#022C22] mb-2">
            {label}
          </label>
        )}
        {currentFile?.uploaded ? (
          <div className="flex items-center gap-3 bg-[#064E3B]/5 px-4 py-3 rounded-xl border border-[#064E3B]/20">
            <span className="material-symbols-outlined text-[20px] text-[#064E3B]">
              check_circle
            </span>
            <span className="text-sm font-bold text-[#022C22] truncate flex-1">
              {currentFile.name}
            </span>
            <div className="flex items-center gap-3">
              <UploadTrigger className="text-xs text-[#064E3B] font-bold underline cursor-pointer" accept=".pdf,.png,.jpg,.jpeg" onFileSelect={(e) => handleFileUpload(id, e)}>تعديل</UploadTrigger>
              <button
                type="button"
                onClick={() => handleFileCancel(id)}
                className="text-xs text-red-600 font-bold underline"
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          <UploadTrigger className="flex flex-col items-center justify-center gap-2 bg-[#FFFDF7] border-2 border-dashed border-[#E5DED0] text-[#64748B] p-4 rounded-2xl cursor-pointer hover:border-[#064E3B] hover:bg-[#F6F1E7] transition-all group" accept=".pdf,.png,.jpg,.jpeg" onFileSelect={(e) => handleFileUpload(id, e)}>
            <div className="w-10 h-10 bg-[#064E3B]/5 rounded-full flex items-center justify-center text-[#064E3B] group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[24px]">
                upload_file
              </span>
            </div>
            <div className="text-center">
              <span className="font-bold text-sm block text-[#064E3B]">
                اضغط لرفع الملف
              </span>
              <span className="text-[10px]">
                {helperText || "صورة أو PDF للأدلة"}
              </span>
            </div>
            </UploadTrigger>
        )}
      </div>
    );
  };

  const renderRequirement = (req: Requirement) => {
    return (
      <div
        key={req.id}
        className="py-5 border-b border-[#E5DED0] last:border-0 flex flex-col md:flex-row gap-6"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-[#022C22] leading-relaxed">
              {req.condition}
            </p>
            {req.optional && (
              <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">
                اختياري
              </span>
            )}
          </div>
          {req.details && (
            <p className="text-xs text-[#64748B] mb-3 leading-relaxed">
              {req.details}
            </p>
          )}
          <div className="flex items-center gap-2 text-[10px] font-bold text-[#64748B]">
            <span className="material-symbols-outlined text-[14px]">
              {req.proofType === "file"
                ? "description"
                : req.proofType === "checkbox"
                  ? "fact_check"
                  : req.proofType === "url"
                    ? "link"
                    : "history_edu"}
            </span>
            <span>{req.proofLabel}</span>
          </div>
        </div>

        <div className="w-full md:w-[300px] shrink-0 space-y-3">
          {req.proofType === "yes_no" ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${data[req.id]?.value === "yes" ? "bg-[#064E3B]/5 border-[#064E3B] text-[#064E3B]" : "bg-white border-[#E5DED0] hover:border-[#064E3B]"}`}
                >
                  <input
                    type="radio"
                    name={req.id}
                    className="hidden"
                    onChange={() => handleYesNoChange(req.id, "yes")}
                  />
                  <span className="font-bold text-sm">نعم</span>
                </label>
                <label
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${data[req.id]?.value === "no" ? "bg-red-50 border-red-200 text-red-600" : "bg-white border-[#E5DED0] hover:border-red-200"}`}
                >
                  <input
                    type="radio"
                    name={req.id}
                    className="hidden"
                    onChange={() => handleYesNoChange(req.id, "no")}
                  />
                  <span className="font-bold text-sm">لا</span>
                </label>
              </div>
              {req.hasFileIfYes && data[req.id]?.value === "yes" && (
                <div className="mt-3">
                  {renderUploadField(`${req.id}_file`, "", "ارفق الملف")}
                </div>
              )}
            </div>
          ) : req.proofType === "file" ? (
            renderUploadField(req.id, "", "صور أو PDF")
          ) : req.proofType === "checkbox" ? (
            <label
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${data[req.id]?.checked ? "bg-[#064E3B]/5 border-[#064E3B]" : "bg-white border-[#E5DED0] hover:border-[#064E3B]"}`}
            >
              <input
                type="checkbox"
                checked={data[req.id]?.checked || false}
                onChange={(e) => handleCheckboxChange(req.id, e)}
                className="w-5 h-5 accent-[#064E3B] rounded border-[#E5DED0]"
              />
              <span className="text-sm font-bold text-[#022C22]">تأكيد</span>
              {data[req.id]?.checked && (
                <span className="material-symbols-outlined text-green-600 text-[18px] mr-auto">
                  check_circle
                </span>
              )}
            </label>
          ) : req.proofType === "url" ? (
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg italic">
                link
              </span>
              <input
                type="url"
                value={data[req.id]?.value || ""}
                onChange={(e) => handleTextChange(req.id, e.target.value)}
                placeholder={req.placeholder || "https://..."}
                className="w-full p-3 rounded-xl border border-[#E5DED0] outline-none focus:ring-2 focus:ring-[#064E3B]/20 transition-all text-xs text-left font-sans"
                dir="ltr"
              />
            </div>
          ) : req.proofType === "text" ? (
            <textarea
              value={data[req.id]?.value || ""}
              onChange={(e) => handleTextChange(req.id, e.target.value)}
              placeholder={req.placeholder || "اكتب هنا..."}
              className="w-full p-3 h-24 rounded-xl border border-[#E5DED0] outline-none focus:ring-2 focus:ring-[#064E3B]/20 transition-all text-sm leading-relaxed"
            />
          ) : req.proofType === "selectPerson" ? (
            <div className="space-y-3">
              <select
                className="w-full bg-white p-3 rounded-xl border border-[#E5DED0] focus:ring-2 focus:ring-[#064E3B]/20 outline-none font-bold text-sm"
                value={data[req.id]?.value || ""}
                onChange={(e) => handleTextChange(req.id, e.target.value)}
              >
                <option value="">-- اختر --</option>
                {registryPeople.map((person, idx) => (
                  <option key={idx} value={person.fullName}>
                    {person.fullName} ({person.roleLabel || "غير محدد"})
                  </option>
                ))}
              </select>
              {(data[req.id]?.value === "غير ذلك" ||
                data[req.id]?.value === undefined ||
                true) && (
                <div>
                  <input
                    className="w-full bg-white p-3 rounded-xl border border-[#E5DED0] focus:ring-2 focus:ring-[#064E3B]/20 outline-none font-bold text-sm"
                    placeholder="أو أدخل اسم المسؤول..."
                    value={data[req.id]?.value || ""}
                    onChange={(e) => handleTextChange(req.id, e.target.value)}
                  />
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const renderPersonCard = (p: any, title: string, roleKey: string) => {
    if (!p) {
      return (
        <div className="p-6 bg-red-50 border border-red-100 rounded-2xl flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-3">
            <span className="material-symbols-outlined">person_off</span>
          </div>
          <p className="text-red-700 font-bold mb-3">
            لم يتم تسجيل {title} في سجل الأكاديمية.
          </p>
          <Link
            to="/academy-registry"
            className="px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all"
          >
            إضافة في سجل الأكاديمية
          </Link>
        </div>
      );
    }

    return (
      <div className="p-6 bg-white border border-[#E5DED0] rounded-2xl flex items-center gap-4 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-1.5 h-full bg-[#064E3B]"></div>
        <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
          {p.files?.profilePhoto?.preview ? (
            <img
              src={(p?.files?.profilePhoto?.preview || p?.files?.profilePhoto?.downloadURL || p?.files?.profilePhoto?.url)}
              alt={p.fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#064E3B]/5 text-[#064E3B]">
              <span className="material-symbols-outlined text-3xl">person</span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-[#022C22]">{p.fullName}</h4>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
            <div className="flex items-center gap-1 text-[10px] text-[#64748B]">
              <span className="material-symbols-outlined text-[14px]">
                call
              </span>
              <span>{p.phone || "غير مسجل"}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-[#64748B]">
              <span className="material-symbols-outlined text-[14px]">
                mail
              </span>
              <span className="truncate">{p.email || "غير مسجل"}</span>
            </div>
          </div>
          {p.roleLabel && (
            <p className="text-[10px] mt-2 inline-block px-2 py-0.5 bg-[#064E3B]/5 text-[#064E3B] rounded-md font-bold">
              {p.roleLabel}
            </p>
          )}
        </div>
        <Link
          to="/academy-registry"
          className="text-xs font-bold text-[#064E3B] underline opacity-0 group-hover:opacity-100 transition-opacity"
        >
          تعديل
        </Link>
      </div>
    );
  };

  const mediaOfficer = getPersonByRole("mediaOfficer");
  const socialMediaOfficer = getPersonByRole("socialMediaOfficer");
  const photographers = getPeopleByRole("photographer");

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
        تم حفظ محور التواصل الاجتماعي كمسودة
      </div>

      {/* Breadcrumbs Sub-Header */}
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
            <span className="text-white/80">تصنيف A</span>
            <span className="material-symbols-outlined text-[16px] text-[#C9A227]">
              chevron_left
            </span>
            <span className="text-white font-bold">التواصل الاجتماعي</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1000px] mx-auto px-4 md:px-6 py-8 space-y-8">
        <AxisTopNav
          prevPath="/classification/a/equipment"
          isNextDisabled={true}
          nextTitle="سوف يتم فتح محور مراجعة الملف في المرحلة القادمة"
        />

        {/* Page Title */}
        <div>
          <div className="inline-flex items-center gap-2 bg-[#C9A227]/10 text-[#C9A227] px-4 py-1.5 rounded-full font-bold text-sm mb-4 border border-[#C9A227]/20">
            ملف تصنيف A
          </div>
          <h1 className="font-display-md text-3xl md:text-4xl font-bold text-[#064E3B] mb-4">
            المحور العاشر: التواصل الاجتماعي
          </h1>
          <p className="text-[#64748B] text-lg leading-relaxed max-w-3xl">
            يتناول هذا المحور حضور الأكاديمية الإعلامي والرقمي، ومدى التزامها
            بهوية بصرية واضحة ومحتوى منظم يعكس نشاطها وقيمها التربوية والرياضية.
          </p>
        </div>

        {/* Section 1: Official Presence */}
        <div className="bg-[#FFFDF7] rounded-3xl shadow-sm border border-[#E5DED0] overflow-hidden">
          <div className="bg-gray-50 border-b border-[#E5DED0] p-6">
            <h2 className="text-xl font-bold text-[#022C22] mb-1 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#064E3B] text-white flex items-center justify-center text-sm font-bold">
                1
              </div>
              الحضور الإعلامي الرسمي
            </h2>
            <p className="text-xs text-[#64748B] mt-1 italic">
              يجب أن تمتلك الأكاديمية صفحة رسمية أو قناة تواصل معتمدة.
            </p>
          </div>
          <div className="p-6">
            {renderRequirement({
              id: "has_official_page",
              condition:
                "هل توجد صفحة رسمية للأكاديمية على وسائل التواصل الاجتماعي؟",
              proofType: "yes_no",
            })}

            {data.has_official_page?.value === "yes" && (
              <div className="py-5 border-b border-[#E5DED0] last:border-0 flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <p className="font-bold text-[#022C22] leading-relaxed">
                    ما المنصات المستخدمة؟
                  </p>
                  <p className="text-xs text-[#64748B] mb-3 leading-relaxed font-bold italic">
                    اختر المنصات التي تتواجد عليها الأكاديمية وأدخل اسم المستخدم
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-[#64748B]">
                    <span className="material-symbols-outlined text-[14px]">
                      checklist
                    </span>
                    <span>اختيار المنصات</span>
                  </div>
                </div>
                <div className="w-full md:w-[300px] shrink-0 space-y-3">
                  {[
                    "Facebook",
                    "Instagram",
                    "TikTok",
                    "YouTube",
                    "Website",
                    "X",
                    "Snapchat",
                    "Other",
                  ].map((platform) => (
                    <div key={platform} className="space-y-2">
                      <button
                        onClick={() => handlePlatformChange(platform)}
                        className={`w-full flex items-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${data.platforms?.includes(platform) ? "bg-[#064E3B]/5 text-[#064E3B] border-[#064E3B]" : "bg-white text-[#64748B] border-[#E5DED0] hover:border-[#064E3B]"}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {data.platforms?.includes(platform)
                            ? "check_box"
                            : "check_box_outline_blank"}
                        </span>
                        {platform}
                      </button>
                      {data.platforms?.includes(platform) && (
                        <input
                          type="text"
                          placeholder={`اسم الحساب في ${platform}...`}
                          value={data.platformData?.[platform] || ""}
                          onChange={(e) =>
                            handlePlatformUsernameChange(
                              platform,
                              e.target.value,
                            )
                          }
                          className="w-full p-3 bg-white border border-[#064E3B]/20 rounded-xl outline-none focus:border-[#C9A227] text-sm"
                          dir="ltr"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {renderRequirement({
              id: "content_plan_policy",
              condition: "هل توجد خطة مكتوبة أو سياسة لإنشاء المحتوى؟",
              proofType: "yes_no",
            })}
          </div>
        </div>

        {/* Section 2: Content & Publishing */}
        <div className="bg-[#FFFDF7] rounded-3xl shadow-sm border border-[#E5DED0] overflow-hidden">
          <div className="bg-gray-50 border-b border-[#E5DED0] p-6 flex items-start gap-4">
            <div className="w-10 h-10 bg-[#C9A227]/10 rounded-xl flex items-center justify-center text-[#C9A227] shrink-0">
              <span className="material-symbols-outlined">description</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#022C22] mb-1">
                المحتوى والنشر
              </h2>
              <p className="text-xs text-[#64748B]">
                التنظيم والالتزام بالقيم الرياضية والتربوية.
              </p>
            </div>
          </div>
          <div className="p-6">
            {renderRequirement({
              id: "training_content_yesno",
              condition: "هل يتم نشر محتوى مرتبط بأنشطة الأكاديمية؟",
              proofType: "yes_no",
            })}
            {renderRequirement({
              id: "match_content_yesno",
              condition: "هل يتم نشر محتوى خاص بالمباريات أو المهرجانات؟",
              proofType: "yes_no",
            })}
            {renderRequirement({
              id: "educational_values_yesno",
              condition: "هل يتم الالتزام بالمحتوى التربوي والرياضي؟",
              proofType: "yes_no",
            })}
            {renderRequirement({
              id: "non_offensive_yesno",
              condition: "هل تلتزم الأكاديمية بعدم نشر محتوى مسيء أو استفزازي؟",
              proofType: "yes_no",
            })}
            {renderRequirement({
              id: "review_mechanism_yesno",
              condition: "هل توجد آلية داخلية لمراجعة المحتوى قبل النشر؟",
              proofType: "yes_no",
              hasFileIfYes: true,
            })}
          </div>
        </div>

        {/* Section 3: Media Responsibility */}
        <div className="bg-[#FFFDF7] rounded-3xl shadow-sm border border-[#E5DED0] overflow-hidden">
          <div className="bg-[#022C22] text-white p-6 md:p-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 bg-[#C9A227] rounded-xl flex items-center justify-center text-[#022C22]">
                <span className="material-symbols-outlined">shield_person</span>
              </div>
              <h2 className="text-2xl font-bold">3. المسؤولية الإعلامية</h2>
            </div>
            <p className="text-white/70 text-sm">
              الأشخاص المسؤولون عن التواصل الإعلامي (يتم جلبهم تلقائياً من سجل
              الأكاديمية).
            </p>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 text-right">
              <h3 className="font-bold text-[#022C22] text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-[#064E3B] rounded-full"></span>
                المسؤول الإعلامي
              </h3>
              {renderPersonCard(
                mediaOfficer,
                "المسؤول الإعلامي",
                "mediaOfficer",
              )}
            </div>

            <div className="space-y-4 text-right">
              <h3 className="font-bold text-[#022C22] text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-[#064E3B] rounded-full"></span>
                مسؤول التواصل الاجتماعي
              </h3>
              {renderPersonCard(
                socialMediaOfficer,
                "مسؤول التواصل الاجتماعي",
                "socialMediaOfficer",
              )}
            </div>

            <div className="md:col-span-2 pt-6 border-t border-[#E5DED0]">
              <h3 className="font-bold text-[#022C22] text-sm mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">
                  photo_camera
                </span>
                المصورون المسجلون
              </h3>
              {photographers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {photographers.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 bg-gray-50 rounded-xl border border-[#E5DED0] flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#064E3B]/10 flex items-center justify-center text-[#064E3B]">
                        <span className="material-symbols-outlined">
                          photo_camera
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-[#022C22] text-xs">
                          {p.fullName}
                        </p>
                        <p className="text-[10px] text-[#64748B]">
                          {p.phone || "بدون هاتف"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-gray-50 border border-dashed border-[#E5DED0] rounded-2xl text-center">
                  <p className="text-[#64748B] text-sm italic">
                    لم يتم تسجيل أي مصور في سجل الأكاديمية.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Media Commitment */}
        <div className="bg-[#FFFDF7] rounded-3xl shadow-sm border border-[#E5DED0] overflow-hidden">
          <div className="bg-[#064E3B] text-white p-6">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <span className="material-symbols-outlined text-[#C9A227]">
                verified_user
              </span>
              4. الالتزام بالمعايير الإعلامية
            </h2>
          </div>
          <div className="p-6">
            {renderRequirement({
              id: "legal_abuse_confirm",
              condition:
                "هل تلتزم الأكاديمية بعدم الإساءة للحكام أو الاتحاد أو الأكاديميات الأخرى؟",
              proofType: "checkbox",
              proofLabel: "تأكيد ضمن الطلب",
            })}
            {renderRequirement({
              id: "legal_children_confirm",
              condition:
                "هل تلتزم الأكاديمية بعدم نشر صور أو بيانات الأطفال بشكل غير مناسب؟",
              proofType: "checkbox",
              proofLabel: "تأكيد ضمن الطلب",
            })}
            {renderRequirement({
              id: "legal_parents_confirm",
              condition:
                "هل تلتزم الأكاديمية بالحصول على موافقة الأهالي عند نشر صور اللاعبين؟",
              proofType: "checkbox",
              proofLabel: "تأكيد ضمن الطلب",
            })}
            {renderRequirement({
              id: "parents_consent_file",
              condition: "نموذج موافقة الأهالي المعتمد",
              proofType: "file",
              proofLabel: "رفع ملف (اختياري)",
              optional: true,
            })}
            {renderRequirement({
              id: "content_reviewer",
              condition: "هل يوجد مسؤول لمراجعة المنشورات الحساسة قبل النشر؟",
              proofType: "selectPerson",
              proofLabel: "اسم المسؤول أو تأكيد ضمن الطلب",
              placeholder: "اسم الشخص المسؤول...",
            })}
          </div>
        </div>

        {/* Summary Card */}
        <AxisSummary
          title="ملخص جاهزية التواصل الاجتماعي"
          icon="campaign"
          percentage={progress.percentage}
          status={progress.percentage === 100 ? "مكتمل" : "قيد الإنجاز"}
          subTitle="تصنيف A - محور التواصل الاجتماعي"
          backLink="/dashboard"
          items={[
            {
              label: "الصفحة الرسمية",
              isActive: data.has_official_page?.value === "yes",
            },
            {
              label: "المنصات المستخدمة",
              isActive: data.platforms?.length > 0,
            },
            {
              label: "المسؤول الإعلامي",
              isActive: !!mediaOfficer && !!socialMediaOfficer,
            },
          ]}
        >
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Link
              to="/classification/a/equipment"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold bg-white border-2 border-[#E5DED0] text-[#64748B] hover:text-[#022C22] hover:bg-gray-50 transition-all text-center flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">
                chevron_right
              </span>
              السابق: المعدات والتجهيزات
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold bg-white border-2 border-[#E5DED0] text-[#64748B] hover:text-[#022C22] hover:bg-gray-50 transition-all text-center flex items-center justify-center gap-2"
            >
              الرجوع للوحة
            </Link>
            <Link
              to="/classification/a/leadership"
              className="w-full sm:w-auto px-10 py-3.5 rounded-2xl font-bold bg-[#C9A227] text-[#022C22] hover:bg-[#b89324] transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95"
            >
              مراجعة الملف قبل الإرسال
              <span className="material-symbols-outlined text-[20px]">
                preview
              </span>
            </Link>
          </div>
        </AxisSummary>
      </main>
    </div>
  );
}
