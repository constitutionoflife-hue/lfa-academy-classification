import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./lib/firebase";
import { AcademyAccount } from "./types";
import { FILE_KEYS } from "./lib/registry";
import PdfViewer from "./components/PdfViewer";
import { maybeCreateDecisionNotification, mapDecisionTextToKey } from "./lib/notifications";

const FIELD_LABELS: Record<string, string> = {
  hasMinimumPitchSize: "تتمتع الملاعب بمساحات كافية؟",
  actualPitchSize: "مساحة الملعب الفعلية",
  pitchSurfaceQuality: "جودة أرضية الملعب",
  hasLighting: "هل يوجد إنارة للتدريب ليلاً؟",
  hasChangingRooms: "غرف تبديل للملابس والدورات المياه",
  hasTechnicalBenches: "مقاعد للجهاز الفني واللاعبين الاحتياط",
  hasFirstAidPoint: "نقطة إسعاف وتجهيزات طبية أولية",
  hasParkingAccess: "مواقف قريبة أو آمنة لاصطفاف السيارات",
  hasParentsWaitingArea: "أماكن مخصصة لانتظار أهالي اللاعبين",
  hasSafeViewingArea: "أماكن آمنة لمشاهدة التدريبات",
  hasAdministrativePoint: "نقطة إدارية للتسجيل والاستعلام",
  hasLegalUsageRight: "حقوق استخدام قانونية؟",
  pitchName: "اسم الملعب",
  pitchUsageDuration: "مدة حق الاستخدام (بالأشهر/السنوات)",
  hasEnoughWeeklySessions: "يغطي الاستخدام جميع الحصص؟",
  canHostOfficialMatches: "صالح لاستضافة مباريات رسمية؟",
  usageRightType: "نوع حق الاستخدام",
  pitchSpecifications: "مواصفات الملعب",
  pitchRights: "حق استخدام الملعب",
  playerFacilities: "مرافق اللاعبين والمدربين",
  supportFacilities: "المرافق المساندة للملعب",
  filter: "بحث",
  cones_stock_photo: "صورة الأقماع (Cones)",
  hurdles_stock_photo: "صورة الحواجز (Hurdles)",
  poles_stock_photo: "صورة الشواخص (Poles)",
  medical_kit_photo: "صورة الحقيبة الطبية",
  whistles_stock_photo: "صورة الصافرات",
  watches_stock_photo: "صورة الساعات المؤقتة",
  owner_1: "سجل عدلي نظيف (لا حكم عليه)",
  owner_2: "أن يكون عمره 28 سنة وما فوق",
  owner_3:
    "أن يمثل الأكاديمية أمام الاتحاد اللبناني لكرة القدم والجهات الرسمية الأخرى",
  owner_4: "يُمنع عليه إشغال أي منصب آخر ضمن الأكاديمية",
  manager_1: "سجل عدلي نظيف (لا حكم عليه)",
  manager_2: "أن يكون عمره 25 سنة وما فوق",
  manager_3: "السيرة الذاتية",
  manager_4: "أن يكون لديه خبرة في العمل الإداري أو الرياضي لا تقل عن 3 سنوات",
  manager_5:
    "أن يمتلك مهارات في القيادة والتواصل وقادر على التنسيق بين الأقسام المختلفة",
  manager_6: "يجب أن يكون حائزاً على شهادة ثانوية عامة أو ما يعادلها",
  manager_7: "أن يعمل بموجب عقد عمل موقع من الطرفين",
  manager_8: "رقم الجوال",
  manager_9: "البريد الإلكتروني",
  manager_10: "تفويض / قرار تعيين",
  tech_1: "سجل عدلي نظيف (لا حكم عليه)",
  tech_2: "الهوية الوطنية",
  tech_3: "أن يكون حائزاً على شهادة تدريبية A أو B الآسيوية أو ما يعادلها",
  tech_4:
    "يجب أن يكون حائزاً على شهادة الثانوية العامة على الأقل أو ما يعادلها",
  tech_5:
    "أن يكون لديه خبرة لا تقل عن 5 سنوات في مجال التدريب أو الإشراف الفني في أكاديميات الواعدين",
  tech_6:
    "أن يكون لديه القدرة على قيادة الجهاز الفني والتخطيط اليومي والأسبوعي والفصلي لجميع الفئات العمرية",
  tech_7: "أن يعمل بموجب عقد عمل موقع من الطرفين",
  sup_1: "سجل عدلي لا يعود لأكثر من 3 أشهر",
  sup_2: "أن يكون عمره 28 سنة وما فوق",
  sup_3: "أن يكون لديه خبرة في العمل الاداري أو الرياضي لا تقل عن 3 سنوات",
  sup_4: "شهادة التدريب كحد أدنى مستوى B",
  sup_5: "عقد عمل موقع من الطرفين",
  official_name_confirm: "تأكيد الاسم الرسمي للأكاديمية",
  platforms: "منصات التواصل الاجتماعي",
  has_official_page: "وجود صفحة رسمية للأكاديمية",
  regular_posting_file: "إثبات النشر المنتظم",
  training_content_yesno: "نشر محتوى تدريبي",
  match_content_yesno: "نشر محتوى المباريات",
  review_mechanism_yesno: "وجود آلية مراجعة للمحتوى",
  content_plan_policy: "سياسة / خطة المحتوى",
  educational_values_yesno: "نشر قيم تربوية وتعليمية",
  non_offensive_yesno: "خلو المحتوى من الإساءة",
  Website: "الموقع الإلكتروني",
  website: "الموقع الإلكتروني",
  Facebook: "فيسبوك",
  facebook: "فيسبوك",
  Instagram: "إنستجرام",
  instagram: "إنستجرام",
  Twitter: "تويتر (X)",
  twitter: "تويتر (X)",
  X: "تويتر (X)",
  x: "تويتر (X)",
  Snapchat: "سناب شات",
  snapchat: "سناب شات",
  TikTok: "تيك توك",
  tiktok: "تيك توك",
  Youtube: "يوتيوب",
  youtube: "يوتيوب",
  YouTube: "يوتيوب",
  vision_1: "نص يشرح الرؤية والمهمة",
  vision_2: "نموذج خط رسمي / هوية بصرية",
  hasTrainingSessionPlan: "هل يوجد نموذج تخطيط لحصة تدريبية؟",
  uploadedTrainingSessionPlan: "النموذج المرفوع",
  notes: "ملاحظات الأكاديمية",
  plan_1: "فلسفة لعب موحدة مكتوبة",
  plan_2: "منهاج تدريبي عام سنوي",
  plan_3: "نموذج لتخطيط أسبوعي",
  plan_4: "نموذج تخطيط لحصة تدريبية",
  plan_5: "برنامج لتطوير المدربين",
  a_planning_playing_philosophy: "هل توجد فلسفة لعب موحدة (هوية كروية) مكتوبة لجميع الفئات؟ (الملف المرفق)",
  a_planning_annual_training_curriculum: "هل يوجد منهاج تدريبي عام سنوي؟ (الملف المرفق)",
  a_planning_weekly_planning_template: "هل يوجد نموذج تخطيط أسبوعي؟ (الملف المرفق)",
  a_planning_session_plan_template: "هل يوجد نموذج تخطيط لحصة تدريبية؟ (الملف المرفق)",
  a_planning_coach_development_program: "هل يوجد برنامج تطوير للمدربين في الأكاديمية؟ (الملف المرفق)",
  has_a_planning_playing_philosophy: "هل توجد فلسفة لعب موحدة (هوية كروية) مكتوبة لجميع الفئات؟",
  has_a_planning_annual_training_curriculum: "هل يوجد منهاج تدريبي عام سنوي؟",
  has_a_planning_weekly_planning_template: "هل يوجد نموذج تخطيط أسبوعي؟",
  has_a_planning_session_plan_template: "هل يوجد نموذج تخطيط لحصة تدريبية؟",
  has_a_planning_coach_development_program: "هل يوجد برنامج تطوير للمدربين في الأكاديمية؟",
  charter_includes_players: "الميثاق يشمل اللاعبين",
  charter_includes_coaches: "الميثاق يشمل المدربين",
  charter_includes_parents: "الميثاق يشمل الأهالي",
  charter_signed: "توقيع الميثاق من المعنيين",
  charter_explained: "شرح الميثاق قبل بداية الموسم",
  insurance_hospital: "اسم المستشفى/المركز الطبي المعتمد",
  insurance_hospital_file: "مستند الاعتماد الطبي",
  insurance_start_date: "تاريخ بداية التأمين",
  insurance_end_date: "تاريخ نهاية التأمين",
  tech_salaries: "رواتب الجهاز الفني",
  admin_salaries: "رواتب الإداريين",
  field_rent: "بدل ملعب",
  lfa_fees: "رسوم الاتحاد",
  medical_insurance: "تأمين طبي / إسعافات أولية",
  equipment: "تجهيزات ومعدات",
  dev_activities: "أنشطة تطوير",
  player_subs: "اشتراكات اللاعبين",
  sponsorships: "رعايات",
  owner_contribution: "مساهمة المالك / الإدارة",
  activities: "أنشطة / بطولات",
  others: "مصادر أخرى",
  legal_abuse_confirm: "التعهد بحماية الأطفال",
  legal_children_confirm: "التعهد بعدم استغلال الأطفال",
  legal_parents_confirm: "التعهد بحقوق الأهالي",
  parents_consent_file: "نموذج موافقة أولياء الأمور",
  content_reviewer: "المسؤول عن مراجعة المحتوى",
  u10: "فئة U10",
  u11: "فئة U11",
  u12: "فئة U12",
  u13: "فئة U13",
  behavior_charter_doc: "ميثاق السلوك",
  behavior_charter_status: "اعتماد ميثاق السلوك",
  cp_policy_doc: "سياسة حماية الأطفال",
  cp_policy_status: "اعتماد سياسة حماية الأطفال",
  internal_rules_doc: "النظام الداخلي للأكاديمية",
  goalkeeper_kit_photo: "صورة لباس حراس المرمى",
  goals_photo: "صورة المرمى",
  goals_safe_status: "أمان المرمى وتثبيته",
  insurance_policy_status: "حالة بوليصة التأمين",
  insured_players_list_status: "لوائح اللاعبين المؤمن عليهم",
  parent_complaints_confirm_status: "سياسة شكاوى أولياء الأمور",
  pitchUsageRight: "حق استخدام الملعب",
  playerCoachFacilities: "مرافق اللاعبين والمدربين",
  supportingFacilities: "المرافق المساندة",
  team_jersey_photo: "صورة اللباس الموحد",
  workshop_plan_doc: "خطة ورش العمل",
  workshop_plan_status: "اعتماد خطة ورش العمل",
  balls_stock_photo: "صورة توفر الكرات",
  bibs_stock_photo: "صورة الشيفونات",
  baseExpenses: "المصروفات الأساسية",
  baseIncomeSources: "مصادر الدخل الأساسية",
  extraExpenses: "مصروفات أخرى",
  extraIncomeSources: "مصادر دخل أخرى",
  generalInfo: "بيانات وإحصاءات عامة",
  platformData: "منصات إضافية",
  media: "الإعلام والتواصل",
  finance: "المسؤول المالي",
  medical: "الرعاية الصحية والأداء",
  leadership: "القيادة",
  planning: "التخطيط",
  organization: "التنظيم",
  technical: "الجانب الفني",
  budget: "الميزانية",
  safeguarding: "حماية وتطوير اللاعبين",
  facilities: "المنشآت والمرافق",
  health: "الرعاية الصحية",
  social_media: "العلامة التجارية",
  first_aid_kit_status: "توفر حقيبة إسعافات",
  first_aid_kit_file: "إثبات حقيبة الإسعافات",
  on_site_medic_status: "تواجد طبيب أو معالج",
  injury_protocol_status: "بروتوكول التعامل مع الإصابات",
  injury_protocol_file: "ملف بروتوكول الإصابات",
  emergency_transport_status: "وسيلة نقل إسعاف / خطة",
  emergency_transport_desc: "تفاصيل خطة الإسعاف الطارئ",
  facility_cleaning_status: "بروتوكول تنظيف المنشأة",
  facility_cleaning_file: "إثبات تنظيف المنشأة",
  potable_water_status: "مياه صالحة للشرب",
  safe_facility_confirm_status: "سلامة المنشأة من المخاطر",
  evacuation_plan_status: "خطة إخلاء / طوارئ",
  evacuation_plan_file: "ملف خطة الإخلاء",
  waste_management_status: "نظام جمع النفايات",
  waste_management_file: "إثبات نظام جمع النفايات",
  assembly_point_status: "نقطة تجمع آمنة",
  assembly_point_file: "إثبات نقطة التجمع",
  insurance_policy: "بوليصة التأمين / إثبات التغطية",
  insured_players_list: "لائحة أسماء اللاعبين وتوقيعهم",
  cp_reporting_mechanism_doc: "آلية الإبلاغ عن الانتهاكات / التجاوزات",
  cp_officer_name: "اسم مسؤول الحماية في الأكاديمية",
  ws_content_doc: "محتوى ورش العمل (الوقاية وحماية الأطفال)",
  ws_attendance_doc: "سجلات حضور ورش العمل",
  ws_coordinator_name: "المسؤول عن ورش العمل",
  parent_comm_doc_status: "اعتماد وثيقة تواصل مع الأهالي",
  parent_comm_doc: "وثيقة سياسة التواصل مع الأهالي",
  parent_notified_rules_status: "إعلام الأهالي باللوائح والقوانين",
  parent_comm_channel_status: "آلية تواصل واضحة للأهالي",
  parent_comm_channel_text: "شرح آلية التواصل المعتمدة",
  parent_complaints_doc: "مستند سياسة الشكاوى المعتمدة للأهالي",
};

const ARABIC_MAPPING: Record<string, string> = {
  playersCount: "عدد اللاعبين",
  coachName: "اسم المدرب",
  sessionsPerWeek: "عدد الحصص الأسبوعية",
  trainingDays: "أيام التدريب",
  trainingTime: "وقت التدريب",
  trainingLocation: "مكان التدريب",
  ageGroup: "الفئة العمرية",
  category: "الفئة",
  teamName: "اسم الفريق",
  notes: "ملاحظات",
  date: "التاريخ",
  startDate: "تاريخ البداية",
  endDate: "تاريخ النهاية",
  data: "البيانات",
  value: "القيمة",
  ...FIELD_LABELS,
};

const getFieldLabel = (key: string) => FIELD_LABELS[key] || `متطلب غير مسمى`;

const AxisAnswerRenderer = ({
  val,
  title,
  academyName,
  handleFilePreview,
}: {
  val: any;
  title: string;
  academyName: string;
  handleFilePreview: (
    e: React.MouseEvent,
    label: string,
    fullName: string,
    fileObj: any,
  ) => void;
}) => {
  if (val === null || val === undefined) return null;

  if (Array.isArray(val)) {
    return (
      <div className="flex flex-col gap-3 w-full">
        <span className="text-xs text-gray-500 font-bold">
          العنوان: {title}
        </span>
        <div className="flex flex-col gap-2">
          {val.map((item, idx) => (
            <div
              key={idx}
              className="p-2 bg-white border border-gray-100 rounded flex flex-col gap-1"
            >
              <AxisAnswerRenderer
                val={item}
                title={`${title} (ملحق ${idx + 1})`}
                academyName={academyName}
                handleFilePreview={handleFilePreview}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (typeof val === "object") {
    if (val.type === "checkbox") {
      return (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-gray-500 font-bold">
            العنوان: {title}
          </span>
          <span className="text-sm font-bold text-gray-800">
            الإجابة:{" "}
            {val.empty ? (
              <span className="text-gray-500">لم يتم تقديم هذا المتطلب</span>
            ) : val.checked ? (
              <span className="text-[#064E3B] bg-[#064E3B]/10 px-2 py-1 rounded border border-[#064E3B]/20 text-xs">
                تم التأكيد
              </span>
            ) : (
              <span className="text-red-500">لا / غير مكتمل</span>
            )}
          </span>
        </div>
      );
    }

    if (
      val.type === "file" ||
      val.uploaded ||
      val.name ||
      val.storagePath ||
      val.preview ||
      val.data ||
      val.downloadURL ||
      val.fileUrl
    ) {
      return (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-gray-500 font-bold">
            العنوان: {title}
          </span>
          <div className="flex flex-col gap-2">
            {val.fromRegistry && val.data ? (
              <span className="text-sm text-gray-800">
                الإجابة:{" "}
                <span dir="ltr" className="ml-1 inline-block">
                  {val.data}
                </span>{" "}
                <span className="text-[#C9A227] bg-[#C9A227]/10 px-2 py-1 rounded border border-[#C9A227]/20 text-xs mr-2 font-bold">
                  مستخرج من السجل
                </span>
              </span>
            ) : val.fromRegistry ? (
              <div className="flex items-center justify-between">
                {val.name ? (
                  <span className="text-sm text-gray-700">
                    الملف المرفوع: {val.name}
                  </span>
                ) : (
                  <span className="text-sm text-gray-700">ملف مرفوع</span>
                )}
                <span className="text-[#C9A227] bg-[#C9A227]/10 px-2 py-1 rounded border border-[#C9A227]/20 text-xs font-bold shrink-0">
                  مستخرج من السجل
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                {val.name ? (
                  <span className="text-sm text-gray-700">
                    الملف المرفوع: {val.name}
                  </span>
                ) : (
                  <span className="text-sm text-gray-700">ملف مرفوع</span>
                )}
                {val.empty ? (
                  <span className="text-gray-500 text-xs">
                    لم يتم تقديم هذا المتطلب
                  </span>
                ) : (
                  <span className="text-[#064E3B] bg-[#064E3B]/10 px-2 py-1 rounded border border-[#064E3B]/20 text-xs font-bold shrink-0">
                    تم الرفع
                  </span>
                )}
              </div>
            )}
            {(val.storagePath ||
              val.downloadURL ||
              val.fileUrl ||
              val.preview ||
              val.data) && (
              <button
                onClick={(e) => handleFilePreview(e, title, academyName, val)}
                className="inline-flex w-fit items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors mt-1"
              >
                <span className="material-symbols-outlined text-[16px]">
                  visibility
                </span>
                عرض الملف
              </button>
            )}
          </div>
        </div>
      );
    }

    if (val.type === "text" || val.value !== undefined) {
      return (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-gray-500 font-bold">
            العنوان: {title}
          </span>
          <span className="text-sm text-gray-800">
            الإجابة: {val.value || val.text || "لا يوجد"}
          </span>
        </div>
      );
    }

    // It's a nested object that is not a recognized type
    const objectKeys = Object.keys(val);
    if (objectKeys.length === 0) return null;

    if (title === "منصات التواصل الاجتماعي") {
      return (
        <div className="flex flex-col gap-2 w-full">
          <span className="text-xs text-gray-500 font-bold">
            العنوان: {title}
          </span>
          <div className="flex flex-col gap-2 border-r-2 border-gray-200 pl-2 mr-2">
            {objectKeys.map((k) => (
              <div
                key={k}
                className="flex flex-col gap-1 text-sm bg-gray-50 p-2 rounded w-full border border-gray-100"
              >
                <span className="text-gray-700 font-bold">
                  - المنصة: {getFieldLabel(k)}
                </span>
                <span className="text-gray-600 font-mono text-xs pr-2">
                  - الرابط/الحساب: {String(val[k])}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2 w-full">
        <span className="text-xs text-gray-500 font-bold">
          العنوان: {title}
        </span>
        <div className="grid grid-cols-1 gap-2 pl-2 border-r-2 border-gray-200 mr-2">
          {objectKeys.map((k) => (
            <div
              key={k}
              className="p-2 bg-gray-50/80 rounded border border-gray-50"
            >
              <AxisAnswerRenderer
                val={val[k]}
                title={getFieldLabel(k)}
                academyName={academyName}
                handleFilePreview={handleFilePreview}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Primitive values (string, number, boolean)
  let stringVal = String(val);
  if (typeof val === "boolean") {
    stringVal = val ? "نعم" : "لا";
  } else if (
    stringVal.toLowerCase() === "yes" ||
    stringVal.toLowerCase() === "true"
  ) {
    stringVal = "نعم";
  } else if (
    stringVal.toLowerCase() === "no" ||
    stringVal.toLowerCase() === "false"
  ) {
    stringVal = "لا";
  }
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-gray-500 font-bold">العنوان: {title}</span>
      <span className="text-sm text-gray-800">الإجابة: {stringVal}</span>
    </div>
  );
};

export default function AdminReviewDossier() {
  const { academyId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [academyData, setAcademyData] = useState<AcademyAccount | null>(null);
  const [progressData, setProgressData] = useState<Record<string, any>>({});
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Admin Review State
  const [savingReview, setSavingReview] = useState(false);
  const [adminReviews, setAdminReviews] = useState<Record<string, any>>({});
  const [activeReviewAxis, setActiveReviewAxis] = useState<string | null>(null);

  // Final Decision State
  const [finalDecision, setFinalDecision] = useState<string>("قيد المراجعة");
  const [finalDecisionNote, setFinalDecisionNote] = useState<string>("");

  // Person Profile Modal State
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    title: string;
    fileObj?: any;
    downloadUrl?: string;
    detectedKind?: string;
  } | null>(null);

  useEffect(() => {
    const fetchAcademyDossier = async () => {
      if (!academyId) return;
      try {
        const docRef = doc(db, "users", academyId);
        const docSnap = await getDoc(docRef);
        let accountData: AcademyAccount;
        if (docSnap.exists()) {
          accountData = docSnap.data() as AcademyAccount;
          setAcademyData(accountData);
          if (accountData.adminStatus) {
            setFinalDecision(
              accountData.adminStatus === "approved"
                ? "مقبول (نموذج معتمد)"
                : accountData.adminStatus === "declined"
                  ? "مرفوض"
                  : accountData.adminStatus,
            );
          }
          if (accountData.adminFinalNote)
            setFinalDecisionNote(accountData.adminFinalNote);
        } else {
          setError("لم يتم العثور على الأكاديمية.");
          setLoading(false);
          return;
        }

        // Fetch their progress (axes and registry)
        const progressRef = collection(db, "users", academyId, "progress");
        const progressSnap = await getDocs(progressRef);
        const pData: Record<string, any> = {};

        let inferredType = accountData.classificationType;
        let progressSum = 0;
        let count = 0;

        progressSnap.forEach((d) => {
          const pd = d.data();
          if (pd.key && pd.data) {
            try {
              const parsed = JSON.parse(pd.data);
              pData[pd.key] = parsed;

              if (!inferredType) {
                if (pd.key.includes("classificationA")) inferredType = "A";
                else if (pd.key.includes("classificationB")) inferredType = "B";
              }
              if (parsed.completionPercentage) {
                progressSum += parsed.completionPercentage;
                count++;
              }
            } catch (e) {
              pData[pd.key] = pd.data;
            }
          }
        });
        setProgressData(pData);

        if (!accountData.classificationType && inferredType) {
          accountData.classificationType = inferredType;
          setAcademyData(accountData);
        }
        if (accountData.totalProgress === undefined) {
          accountData.totalProgress =
            count > 0 ? Math.round(progressSum / count) : 0;
        }

        // Fetch our prior admin reviews for this academy
        const reviewsRef = collection(db, "users", academyId, "adminReviews");
        const reviewsSnap = await getDocs(reviewsRef);
        const rData: Record<string, any> = {};
        reviewsSnap.forEach((r) => {
          rData[r.id] = r.data();
        });
        setAdminReviews(rData);
      } catch (err: any) {
        setError("خطأ أثناء جلب البيانات: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAcademyDossier();
  }, [academyId]);

  const handleSaveAxisReview = async (
    axisKey: string,
    status: string,
    note: string,
    itemStatuses?: Record<string, string>,
    itemNotes?: Record<string, string>,
  ) => {
    if (!academyId) return;
    setSavingReview(true);
    try {
      const reviewDoc = doc(db, "users", academyId, "adminReviews", axisKey);
      await setDoc(
        reviewDoc,
        {
          status,
          note,
          itemStatuses: itemStatuses || {},
          itemNotes: itemNotes || {},
          reviewedAt: Date.now(),
          reviewedBy: "Admin",
        },
        { merge: true },
      );

      if (axisKey.startsWith("registry_")) {
        const personId = axisKey.replace("registry_", "");
        const reviewStatusEnum =
          status === "مقبول"
            ? "accepted"
            : status === "مرفوض"
              ? "rejected"
              : "under_review";

        // Find which registry contains this person
        let targetRegistryKey = "";
        let updatedPeople = null;

        if (
          progressData["classificationA_registry"]?.people?.find(
            (p: any) => p.id === personId,
          )
        ) {
          targetRegistryKey = "classificationA_registry";
        } else if (
          progressData["classificationB_registry"]?.people?.find(
            (p: any) => p.id === personId,
          )
        ) {
          targetRegistryKey = "classificationB_registry";
        } else if (
          progressData["registryData"]?.people?.find(
            (p: any) => p.id === personId,
          )
        ) {
          targetRegistryKey = "registryData";
        }

        if (targetRegistryKey) {
          updatedPeople = progressData[targetRegistryKey].people.map(
            (p: any) => {
              if (p.id === personId) {
                return {
                  ...p,
                  reviewStatus: reviewStatusEnum,
                  acceptedAt:
                    reviewStatusEnum === "accepted" ? Date.now() : p.acceptedAt,
                };
              }
              return p;
            },
          );

          const newRegistryData = {
            ...progressData[targetRegistryKey],
            people: updatedPeople,
          };

          await setDoc(
            doc(db, "users", academyId, "progress", targetRegistryKey),
            {
              userId: academyId,
              key: targetRegistryKey,
              data: JSON.stringify(newRegistryData),
              updatedAt: Date.now(),
            },
            { merge: true },
          );

          setProgressData((prev) => ({
            ...prev,
            [targetRegistryKey]: newRegistryData,
          }));
        }
      }

      setAdminReviews((prev) => ({
        ...prev,
        [axisKey]: {
          ...prev[axisKey],
          status,
          note,
          itemStatuses: itemStatuses || {},
          itemNotes: itemNotes || {},
          reviewedAt: Date.now(),
        },
      }));
      alert("تم حفظ تقييم المحور بنجاح.");
    } catch (e: any) {
      alert("خطأ أثناء حفظ التقييم: " + e.message);
    } finally {
      setSavingReview(false);
    }
  };

  const handleSaveFileReview = async (
    personId: string,
    fileKey: string,
    fileStatus: "approved" | "declined" | null,
  ) => {
    if (!academyId) return;
    const axisKey = `registry_${personId}`;
    const currentReview = adminReviews[axisKey] || {};
    const currentFileStatuses = currentReview.fileStatuses || {};

    // Optimistic UI update
    setAdminReviews((prev) => ({
      ...prev,
      [axisKey]: {
        ...prev[axisKey],
        status: prev[axisKey]?.status || "قيد المراجعة",
        fileStatuses: {
          ...currentFileStatuses,
          [fileKey]: fileStatus,
        },
      },
    }));

    try {
      const reviewDoc = doc(db, "users", academyId, "adminReviews", axisKey);
      await setDoc(
        reviewDoc,
        {
          fileStatuses: {
            ...currentFileStatuses,
            [fileKey]: fileStatus,
          },
          reviewedAt: Date.now(),
          reviewedBy: "Admin",
        },
        { merge: true },
      );
    } catch (err) {
      console.error("Failed to save file review", err);
    }
  };

  const handleFilePreview = (
    e: React.MouseEvent,
    label: string,
    fullName: string,
    fileObj: any,
  ) => {
    e.stopPropagation();

    if (!fileObj) {
      setPreviewFile({
        url: "missing",
        title: `${label} - ${fullName}`,
        fileObj,
      });
      return;
    }

    const resolveAndSet = async () => {
      const getPreviewSource = (f: any) => {
        const staticUrl =
          f.downloadURL ||
          f.downloadUrl ||
          f.url ||
          f.fileUrl ||
          f.previewUrl ||
          f.publicUrl ||
          f.metadata?.downloadURL ||
          f.metadata?.downloadUrl ||
          f.preview;
        if (
          staticUrl &&
          typeof staticUrl === "string" &&
          (staticUrl.startsWith("http") ||
            staticUrl.startsWith("blob:") ||
            staticUrl.startsWith("data:"))
        ) {
          return staticUrl;
        }
        const base64Data = f.base64 || f.dataUrl || f.data || f.preview;
        if (base64Data && typeof base64Data === "string") {
          if (base64Data.startsWith("data:")) {
            return base64Data;
          } else {
            const mt = f.contentType || f.type || f.mimeType || "image/jpeg";
            return `data:${mt};base64,${base64Data}`;
          }
        }
        return "";
      };

      let resolvedSource = getPreviewSource(fileObj);
      let downloadSource = resolvedSource;

      // Handle firestore chunked file logic
      if (!resolvedSource) {
         let maybeFirestoreUrl = fileObj.downloadURL || fileObj.url || fileObj.metadata?.downloadURL;
         if (maybeFirestoreUrl && typeof maybeFirestoreUrl === 'string' && maybeFirestoreUrl.startsWith('firestore://')) {
            try {
               const parts = maybeFirestoreUrl.replace('firestore://', '').split('/');
               if (parts.length >= 2) {
                   const { getFirestoreFileBase64 } = await import("./lib/fileDownload");
                   const base64Data = await getFirestoreFileBase64(parts[0], parts[1]);
                   if (base64Data) {
                       resolvedSource = base64Data.startsWith('data:') ? base64Data : `data:${fileObj.mimeType || fileObj.type || 'application/octet-stream'};base64,${base64Data}`;
                       downloadSource = resolvedSource;
                   }
               }
            } catch (e) {
               console.error("Failed to load firestore file", e);
            }
         }
      }

      // Fix 1: storagePath fallback — get real downloadURL from Firebase Storage
      if (!resolvedSource && fileObj.storagePath) {
        try {
          const { getDownloadURL, ref } = await import('firebase/storage');
          const { storage } = await import('./lib/firebase');
          const storageRef = ref(storage, fileObj.storagePath);
          resolvedSource = await getDownloadURL(storageRef);
          downloadSource = resolvedSource;
        } catch (e) {
          console.warn('Could not get downloadURL from storagePath:', e);
        }
      }

      const mimeType = (
        fileObj.contentType ||
        fileObj.type ||
        fileObj.mimeType ||
        ""
      ).toLowerCase();
      const fileName = (fileObj.name || fileObj.originalName || "").toLowerCase();

      const isImage =
        mimeType.startsWith("image/") ||
        /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName);

      let detectedKind = "unknown";
      if (isImage) {
        detectedKind = "image";
      } else if (mimeType.includes("pdf") || fileName.endsWith(".pdf")) {
        detectedKind = "pdf";
      } else if (mimeType.includes("word") || /\.(doc|docx)$/i.test(fileName)) {
        detectedKind = "doc";
      }

      // Convert PDF/doc to a same-origin Blob URL so PDF.js can load it.
      // Strategy 1: plain fetch() — works when CORS is configured on Storage.
      // Strategy 2: Firebase Storage SDK getBlob() — bypasses CORS entirely
      //             by using the authenticated Firebase SDK. Falls back to this
      //             automatically when fetch() is blocked.
      if (
        resolvedSource &&
        (detectedKind === "pdf" || detectedKind === "doc") &&
        (resolvedSource.startsWith("data:") || resolvedSource.startsWith("https://"))
      ) {
        let blobConverted = false;

        // Strategy 1: plain fetch
        try {
          const res = await fetch(resolvedSource);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();
          downloadSource = downloadSource || resolvedSource;
          resolvedSource = URL.createObjectURL(blob);
          blobConverted = true;
        } catch (fetchErr) {
          console.warn("fetch() failed for PDF preview, trying Firebase SDK:", fetchErr);
        }

        // Strategy 2: Firebase Storage SDK — handles auth + CORS automatically
        if (!blobConverted && fileObj?.storagePath) {
          try {
            const { ref: storageRef, getBlob: sdkGetBlob } = await import("firebase/storage");
            const { storage: fbStorage } = await import("./lib/firebase");
            const sRef = storageRef(fbStorage, fileObj.storagePath);
            const blob = await sdkGetBlob(sRef);
            downloadSource = downloadSource || resolvedSource;
            resolvedSource = URL.createObjectURL(blob);
            blobConverted = true;
          } catch (sdkErr) {
            console.error("Firebase SDK getBlob() also failed:", sdkErr);
            // resolvedSource stays as the original URL — PdfViewer will show an error
          }
        }
      }

      if (resolvedSource) {
        setPreviewFile({
          url: resolvedSource,
          title: `${label} - ${fullName}`,
          fileObj,
          downloadUrl: downloadSource || resolvedSource,
          detectedKind,
        });
      } else {
        setPreviewFile({
          url: "missing",
          title: `${label} - ${fullName}`,
          fileObj,
        });
      }
    };

    // Show spinner immediately while async resolution runs
    setPreviewFile({ url: "loading", title: `${label} - ${fullName}`, fileObj });
    resolveAndSet();
  };

  /**
   * Download a file using its blob URL (already fetched for the iframe) or by
   * fetching the Firebase Storage URL on demand. This avoids cross-origin URL
   * navigation which is blocked in some preview/sandbox environments.
   */
  const triggerBlobDownload = async (
    blobOrPreviewUrl: string,
    fallbackUrl: string,
    filename: string,
  ) => {
    const name = filename || "file";
    // Prefer the blob URL (already in memory for PDFs)
    const src = blobOrPreviewUrl?.startsWith("blob:") ? blobOrPreviewUrl : null;
    if (src) {
      const a = document.createElement("a");
      a.href = src;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    // Otherwise fetch on demand and create a temporary blob URL
    try {
      const res = await fetch(fallbackUrl || blobOrPreviewUrl);
      const blob = await res.blob();
      const tmp = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = tmp;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(tmp);
    } catch {
      window.open(fallbackUrl || blobOrPreviewUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleFinalDecision = async () => {
    if (!academyId) return;
    setSavingReview(true);
    try {
      let statusToSave = finalDecision;
      if (finalDecision.includes("مقبول")) statusToSave = "approved";
      if (finalDecision.includes("مرفوض")) statusToSave = "declined";

      const previousDecisionKey = mapDecisionTextToKey(academyData?.adminStatus);
      const previousComment = academyData?.adminFinalNote || "";
      const isFirstDecision = !academyData?.adminStatus;

      await updateDoc(doc(db, "users", academyId), {
        adminStatus: statusToSave,
        adminFinalNote: finalDecisionNote,
        updatedAt: Date.now(),
      });

      // The decision itself is already saved at this point — a failure sending
      // the academy's notification (e.g. Firestore rules not yet deployed)
      // must never make this look like the whole save failed.
      const decisionKey = mapDecisionTextToKey(finalDecision);
      if (decisionKey) {
        try {
          await maybeCreateDecisionNotification({
            academyId,
            decisionKey,
            adminComment: finalDecisionNote,
            previousDecisionKey,
            previousComment,
            isFirstDecision,
          });
        } catch (notifyErr: any) {
          console.error("Failed to create decision notification:", notifyErr);
        }
      }

      setAcademyData((prev) =>
        prev ? { ...prev, adminStatus: statusToSave, adminFinalNote: finalDecisionNote } : prev,
      );

      alert("تم اعتماد القرار النهائي للملف.");
    } catch (e: any) {
      alert("خطأ أثناء الاعتماد: " + e.message);
    } finally {
      setSavingReview(false);
    }
  };

  const handleDeleteAcademy = async () => {
    if (!academyId) return;
    setIsDeleting(true);
    try {
      // Delete progress subcollection
      const progressRef = collection(db, 'users', academyId, 'progress');
      const progressDocs = await getDocs(progressRef);
      const progressDeletePromises = progressDocs.docs.map(d => deleteDoc(d.ref));
      await Promise.all(progressDeletePromises);

      // Delete reviews subcollection
      const reviewsRef = collection(db, 'users', academyId, 'adminReviews');
      const reviewsDocs = await getDocs(reviewsRef);
      const reviewsDeletePromises = reviewsDocs.docs.map(d => deleteDoc(d.ref));
      await Promise.all(reviewsDeletePromises);

      // Delete the user document
      await deleteDoc(doc(db, 'users', academyId));
      
      alert('تم حذف الأكاديمية بنجاح.');
      navigate('/admin/dashboard');
    } catch (error: any) {
      console.error('Error deleting academy:', error);
      alert('تعذر حذف الأكاديمية: ' + error.message);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-16 h-16 border-4 border-[#064E3B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !academyData) {
    return (
      <div className="bg-red-50 text-red-600 p-8 rounded-2xl border border-red-200 text-center font-bold">
        {error || "بيانات غير متوفرة"}
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "البيانات العامة", icon: "info" },
    { id: "registry", label: "سجل الأكاديمية", icon: "badge" },
    { id: "classification", label: "محاور التصنيف", icon: "assignment" },
    { id: "decision", label: "القرار النهائي", icon: "gavel" },
  ];

  const registryPeople =
    progressData["classificationA_registry"]?.people ||
    progressData["classificationB_registry"]?.people ||
    progressData["registryData"]?.people ||
    [];

  const axesListA = [
    { id: "leadership", name: "القيادة", key: "classificationA_leadership" },
    { id: "planning", name: "التخطيط", key: "classificationA_planning" },
    {
      id: "organization",
      name: "التنظيم",
      key: "classificationA_organization",
    },
    { id: "technical", name: "الجانب الفني", key: "classificationA_technical" },
    { id: "budget", name: "الميزانية", key: "classificationA_budget" },
    {
      id: "safeguarding",
      name: "حماية وتطوير اللاعبين",
      key: "classificationA_safeguarding",
    },
    {
      id: "facilities",
      name: "المنشآت والمرافق",
      key: "classificationA_facilities",
    },
    {
      id: "equipment",
      name: "المعدات والتجهيزات",
      key: "classificationA_equipment",
    },
    {
      id: "health",
      name: "الرعاية الصحية والأداء",
      key: "classificationA_health",
    },
    {
      id: "social_media",
      name: "العلامة التجارية",
      key: "classificationA_social_media",
    },
  ];

  const axesListB = [
    { id: "leadership", name: "القيادة", key: "classificationB_leadership" },
    { id: "planning", name: "التخطيط", key: "classificationB_planning" },
    {
      id: "organization",
      name: "التنظيم",
      key: "classificationB_organization",
    },
    { id: "technical", name: "الجانب الفني", key: "classificationB_technical" },
    {
      id: "safeguarding",
      name: "الرعاية والتعليم",
      key: "classificationB_safeguarding",
    },
    {
      id: "facilities",
      name: "المنشآت والمرافق",
      key: "classificationB_facilities",
    },
    {
      id: "equipment",
      name: "المعدات والتجهيزات",
      key: "classificationB_equipment",
    },
  ];

  const axesToRender =
    academyData.classificationType === "A"
      ? axesListA
      : academyData.classificationType === "B"
        ? axesListB
        : [];

  return (
    <div className="space-y-6">
      {/* Dossier Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#E5DED0]">
        <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
          <div className="w-20 h-20 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center p-2">
            {academyData.academyLogo ? (
              <img
                src={academyData.academyLogo}
                alt="Logo"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <span className="material-symbols-outlined text-4xl text-gray-300">
                sports_soccer
              </span>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-[#022C22] mb-1">
              {academyData.academyName}
            </h2>
            <div className="text-[#64748B] flex items-center gap-4 text-sm font-bold">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">
                  location_on
                </span>{" "}
                {academyData.governorate} - {academyData.district}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">
                  phone
                </span>{" "}
                {academyData.academyPhone}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 relative">
            <span className="px-4 py-2 bg-[#064E3B] text-white rounded-xl font-bold flex items-center justify-center gap-2">
              نوع الطلب:{" "}
              {academyData.classificationType === "A"
                ? "الفئة A"
                : academyData.classificationType === "B"
                  ? "الفئة B"
                  : "انتساب فقط"}
            </span>
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-100 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-200 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              حذف الحساب
            </button>
          </div>
        </div>

        {/* Dossier Navigation */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-[#064E3B] text-[#064E3B]"
                  : "border-transparent text-[#64748B] hover:text-[#022C22] hover:bg-gray-50"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-3xl shadow-sm border border-[#E5DED0] p-6 min-h-[400px]">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <h3 className="text-xl font-black text-[#022C22] mb-4">
              نظرة عامة على الملف
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="text-xs text-gray-500 font-bold mb-1">
                  البريد الإلكتروني للإدارة
                </div>
                <div className="font-bold text-[#022C22]">
                  {academyData.loginEmail}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="text-xs text-gray-500 font-bold mb-1">
                  رقم هاتف الأكاديمية
                </div>
                <div className="font-bold text-[#022C22]">
                  {academyData.academyPhone}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="text-xs text-gray-500 font-bold mb-1">
                  تاريخ تقديم الطلب
                </div>
                <div className="font-bold text-[#022C22]">
                  {academyData.submittedAt
                    ? new Date(academyData.submittedAt).toLocaleDateString("ar")
                    : "غير مسجل"}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="text-xs text-gray-500 font-bold mb-1">
                  إجمالي المرفقات في المستودع
                </div>
                <div className="font-bold text-[#022C22]">
                  غير متاح برمجياً حتى الآن
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "registry" && (
          <div className="space-y-10">
            {/* Academy Profile Info */}
            <div>
              <h3 className="text-xl font-black text-[#022C22] mb-4">
                الملف التعريفي للأكاديمية
              </h3>
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6">
                {academyData.academyLogo && (
                  <div className="w-32 h-32 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center p-2 shrink-0">
                    <img
                      src={academyData.academyLogo}
                      alt="Logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 flex-1">
                  <div>
                    <div className="text-xs text-gray-500 font-bold mb-1">
                      اسم الأكاديمية
                    </div>
                    <div className="font-bold text-[#022C22]">
                      {academyData.academyName || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-bold mb-1">
                      الموقع / المحافظة / القضاء
                    </div>
                    <div className="font-bold text-[#022C22]">
                      {academyData.governorate || "-"} -{" "}
                      {academyData.district || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-bold mb-1">
                      رقم الهاتف
                    </div>
                    <div className="font-bold text-[#064E3B]">
                      {academyData.academyPhone || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-bold mb-1">
                      حساب المسؤول (الإيميل)
                    </div>
                    <div className="font-bold text-gray-600">
                      {academyData.loginEmail || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-bold mb-1">
                      اسم الملعب المعتمد
                    </div>
                    <div className="font-bold text-gray-600">
                      {academyData.approvedStadiumName || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-bold mb-1">
                      الجنسية
                    </div>
                    <div className="font-bold text-gray-600">
                      {academyData.nationality || "لبنانية"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Registry People */}
            <div>
              <h3 className="text-xl font-black text-[#022C22] mb-4">
                مراجعة سجل الكوادر
              </h3>
              <div className="bg-blue-50 text-blue-700 p-4 rounded-xl font-bold flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined">info</span>
                يتضمن هذا القسم مراجعة سجل الإداريين والمدربين واللاعبين. يجب
                التحقق من شهادات التدريب.
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-right text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-4 font-bold text-gray-600">الاسم</th>
                      <th className="p-4 font-bold text-gray-600">الدور</th>
                      <th className="p-4 font-bold text-gray-600">
                        الملفات المرفوعة
                      </th>
                      <th className="p-4 font-bold text-gray-600 border-r border-gray-200">
                        إجراءات المراجعة
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {registryPeople.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-8 text-center text-gray-400 font-bold"
                        >
                          لم تقم الأكاديمية بإضافة كوادر بعد.
                        </td>
                      </tr>
                    ) : (
                      registryPeople.map((person: any, idx: number) => {
                        const pReview =
                          adminReviews[`registry_${person.id}`] || {};

                        // Collect uploaded files
                        const uploadedFiles: {
                          key: string;
                          label: string;
                          fileObj: any;
                        }[] = [];
                        if (person.files) {
                          Object.entries(FILE_KEYS).forEach(([key, label]) => {
                            if (person.files[key]?.uploaded) {
                              uploadedFiles.push({
                                key,
                                label,
                                fileObj: person.files[key],
                              });
                            }
                          });
                        }

                        return (
                          <tr key={person.id || idx}>
                            <td className="p-4 font-bold text-[#022C22]">
                              <button
                                onClick={() => setSelectedPerson(person)}
                                className="hover:underline text-[#C9A227] font-black text-right focus:outline-none"
                              >
                                {person.fullName || "-"}
                              </button>
                            </td>
                            <td className="p-4 font-bold text-[#064E3B]">
                              {person.roleLabel || person.roleKey || "-"}
                              {person.ageCategory && (
                                <span className="block text-xs text-gray-500 font-mono mt-1">
                                  {person.ageCategory}
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-xs font-bold text-gray-600">
                              {uploadedFiles.length === 0 ? (
                                <span className="text-gray-400">
                                  لا يوجد ملفات
                                </span>
                              ) : (
                                <div className="flex flex-wrap gap-4">
                                  {uploadedFiles.map(
                                    (file: any, fidx: number) => {
                                      const fileStatus =
                                        pReview?.fileStatuses?.[file.key] ||
                                        null;
                                      return (
                                        <div
                                          key={fidx}
                                          className="flex flex-col gap-1 items-start min-w-[140px]"
                                        >
                                          <button
                                            onClick={(e) =>
                                              handleFilePreview(
                                                e,
                                                file.label,
                                                person.fullName || "",
                                                file.fileObj,
                                              )
                                            }
                                            className={`inline-flex items-center justify-between w-full gap-2 px-3 py-1.5 rounded-md border shadow-sm transition-all focus:outline-none ${fileStatus === "approved" ? "bg-green-100 text-green-800 border-green-300" : fileStatus === "declined" ? "bg-red-100 text-red-800 border-red-300" : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"}`}
                                          >
                                            <span
                                              className="font-bold whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]"
                                              title={file.label}
                                            >
                                              {file.label}
                                            </span>
                                            <span className="material-symbols-outlined text-[16px] opacity-70">
                                              visibility
                                            </span>
                                          </button>

                                          <div className="flex w-full overflow-hidden rounded border border-gray-200">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleSaveFileReview(
                                                  person.id,
                                                  file.key,
                                                  "approved",
                                                );
                                              }}
                                              className={`flex-1 p-1 flex justify-center items-center transition-colors ${fileStatus === "approved" ? "bg-green-600 text-white" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                                              title="قبول"
                                            >
                                              <span className="material-symbols-outlined text-[14px]">
                                                check
                                              </span>
                                            </button>
                                            <div className="w-[1px] bg-gray-200"></div>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleSaveFileReview(
                                                  person.id,
                                                  file.key,
                                                  "declined",
                                                );
                                              }}
                                              className={`flex-1 p-1 flex justify-center items-center transition-colors ${fileStatus === "declined" ? "bg-red-600 text-white" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
                                              title="رفض"
                                            >
                                              <span className="material-symbols-outlined text-[14px]">
                                                close
                                              </span>
                                            </button>
                                            {fileStatus && (
                                              <>
                                                <div className="w-[1px] bg-gray-200"></div>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSaveFileReview(
                                                      person.id,
                                                      file.key,
                                                      null,
                                                    );
                                                  }}
                                                  className="flex-1 p-1 flex justify-center items-center bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                                                  title="إلغاء المراجعة"
                                                >
                                                  <span className="material-symbols-outlined text-[14px]">
                                                    remove
                                                  </span>
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    },
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="p-4 border-r border-gray-200">
                              <select
                                className="w-full p-2 border border-gray-200 rounded-lg text-xs font-bold font-sans cursor-pointer focus:border-[#C9A227] outline-none"
                                value={pReview.status || "قيد المراجعة"}
                                onChange={(e) =>
                                  handleSaveAxisReview(
                                    `registry_${person.id}`,
                                    e.target.value,
                                    pReview.note || "",
                                  )
                                }
                              >
                                <option>قيد المراجعة</option>
                                <option>مقبول</option>
                                <option>مرفوض</option>
                                <option>بحاجة استكمال</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "classification" && (
          <div className="space-y-6">
            <h3 className="text-xl font-black text-[#022C22] mb-4">
              مراجعة محاور التصنيف ({academyData.classificationType})
            </h3>

            {!academyData.classificationType ||
            academyData.classificationType === "AffiliationOnly" ? (
              <div className="bg-gray-50 text-center p-12 rounded-2xl font-bold border border-gray-200">
                هذا الطلب هو طلب انتساب فقط، ولا يتطلب تعبئة محاور التصنيف.
              </div>
            ) : (
              <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar list of axes */}
                <div className="w-full md:w-1/3 md:border-l border-gray-200 md:pl-6 space-y-2">
                  {axesToRender.map((axis) => {
                    const isSelected = activeReviewAxis === axis.key;
                    const progressObj = progressData[axis.key];
                    const pct = progressObj?.completionPercentage ?? 0;
                    const reviewStatus = adminReviews[axis.key]?.status;

                    let bgClass = "bg-gray-50 text-gray-700 hover:bg-gray-100";
                    if (isSelected)
                      bgClass = "bg-[#064E3B] text-white shadow-md";
                    else if (reviewStatus === "مقبول")
                      bgClass = "bg-green-50 text-green-800 border-green-200";
                    else if (reviewStatus === "مرفوض")
                      bgClass = "bg-red-50 text-red-800 border-red-200";

                    return (
                      <button
                        key={axis.key}
                        onClick={() => setActiveReviewAxis(axis.key)}
                        className={`w-full text-right p-3 rounded-xl font-bold flex justify-between items-center transition-all border border-transparent ${bgClass}`}
                      >
                        {axis.name}
                        <span
                          className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-white border"}`}
                        >
                          {pct}% {reviewStatus && `• ${reviewStatus}`}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Active Axis Editor */}
                <div className="w-full md:w-2/3">
                  {!activeReviewAxis ? (
                    <div className="bg-gray-50 p-12 rounded-2xl border border-gray-100 h-full flex items-center justify-center text-center text-gray-400 font-bold">
                      اختر محوراً من القائمة الجانبية لبدء المراجعة
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 h-full">
                      {(() => {
                        const activeAxisDef = axesToRender.find(
                          (a) => a.key === activeReviewAxis,
                        );
                        let axisAnswerData = {
                          ...(progressData[activeReviewAxis] || {}),
                        };
                        axisAnswerData.files = {
                          ...(axisAnswerData.files || {}),
                        };
                        const reviewData = adminReviews[activeReviewAxis] || {
                          status: "قيد المراجعة",
                          note: "",
                        };

                        // Inject files from registry for Leadership Axis
                        if (activeReviewAxis === "classificationA_leadership") {
                          const ownerPerson = registryPeople.find(
                            (p: any) => p.roleKey === "owner",
                          );
                          const adminPerson = registryPeople.find(
                            (p: any) => p.roleKey === "administrativeManager",
                          );
                          const techPerson = registryPeople.find(
                            (p: any) => p.roleKey === "technicalSupervisor",
                          );

                          if (ownerPerson) {
                            if (ownerPerson.files?.criminalRecord)
                              axisAnswerData.files.owner_1 = {
                                ...ownerPerson.files.criminalRecord,
                                fromRegistry: true,
                              };
                            if (
                              ownerPerson.files?.idDocument ||
                              ownerPerson.dateOfBirth
                            )
                              axisAnswerData.files.owner_2 = ownerPerson.files
                                .idDocument
                                ? {
                                    ...ownerPerson.files.idDocument,
                                    fromRegistry: true,
                                  }
                                : {
                                    uploaded: true,
                                    data: ownerPerson.dateOfBirth,
                                    fromRegistry: true,
                                  };
                          }
                          if (adminPerson) {
                            if (adminPerson.files?.criminalRecord)
                              axisAnswerData.files.manager_1 = {
                                ...adminPerson.files.criminalRecord,
                                fromRegistry: true,
                              };
                            if (
                              adminPerson.files?.idDocument ||
                              adminPerson.dateOfBirth
                            )
                              axisAnswerData.files.manager_2 = adminPerson.files
                                .idDocument
                                ? {
                                    ...adminPerson.files.idDocument,
                                    fromRegistry: true,
                                  }
                                : {
                                    uploaded: true,
                                    data: adminPerson.dateOfBirth,
                                    fromRegistry: true,
                                  };
                            if (adminPerson.files?.cv)
                              axisAnswerData.files.manager_4 = {
                                ...adminPerson.files.cv,
                                fromRegistry: true,
                              };
                            if (adminPerson.files?.certificate)
                              axisAnswerData.files.manager_6 = {
                                ...adminPerson.files.certificate,
                                fromRegistry: true,
                              };
                            if (adminPerson.files?.contract)
                              axisAnswerData.files.manager_7 = {
                                ...adminPerson.files.contract,
                                fromRegistry: true,
                              };
                          }
                          if (techPerson) {
                            if (techPerson.files?.criminalRecord)
                              axisAnswerData.files.tech_1 = {
                                ...techPerson.files.criminalRecord,
                                fromRegistry: true,
                              };
                            if (
                              techPerson.files?.idDocument ||
                              techPerson.dateOfBirth
                            )
                              axisAnswerData.files.tech_2 = techPerson.files
                                .idDocument
                                ? {
                                    ...techPerson.files.idDocument,
                                    fromRegistry: true,
                                  }
                                : {
                                    uploaded: true,
                                    data: techPerson.dateOfBirth,
                                    fromRegistry: true,
                                  };
                            if (techPerson.files?.certificate)
                              axisAnswerData.files.tech_3 = {
                                ...techPerson.files.certificate,
                                fromRegistry: true,
                              };
                            if (techPerson.files?.cv)
                              axisAnswerData.files.tech_5 = {
                                ...techPerson.files.cv,
                                fromRegistry: true,
                              };
                            if (techPerson.files?.contract)
                              axisAnswerData.files.tech_7 = {
                                ...techPerson.files.contract,
                                fromRegistry: true,
                              };
                          }

                          // Missing keys logic to ensure all are shown
                          const expectedKeys = [
                            "owner_1",
                            "owner_2",
                            "owner_3",
                            "owner_4",
                            "manager_1",
                            "manager_2",
                            "manager_3",
                            "manager_4",
                            "manager_5",
                            "manager_6",
                            "manager_7",
                            "manager_8",
                            "manager_9",
                            "manager_10",
                            "tech_1",
                            "tech_2",
                            "tech_3",
                            "tech_4",
                            "tech_5",
                            "tech_6",
                            "tech_7",
                          ];
                          expectedKeys.forEach((k) => {
                            if (
                              !axisAnswerData[k] &&
                              !axisAnswerData.files[k]
                            ) {
                              axisAnswerData[k] = {
                                type: "checkbox",
                                checked: false,
                                empty: true,
                              };
                            }
                          });
                        } else if (
                          activeReviewAxis === "classificationB_leadership"
                        ) {
                          const bOwner =
                            registryPeople.find(
                              (p: any) => p.roleKey === "bOwner",
                            ) ||
                            registryPeople.find(
                              (p: any) => p.roleKey === "owner",
                            );
                          const bSup = registryPeople.find(
                            (p: any) => p.roleKey === "bGeneralSupervisor",
                          );

                          if (bOwner) {
                            if (bOwner.files?.criminalRecord)
                              axisAnswerData.files.owner_1 = {
                                ...bOwner.files.criminalRecord,
                                fromRegistry: true,
                              };
                            if (bOwner.files?.idDocument || bOwner.dateOfBirth)
                              axisAnswerData.files.owner_2 = bOwner.files
                                .idDocument
                                ? {
                                    ...bOwner.files.idDocument,
                                    fromRegistry: true,
                                  }
                                : {
                                    uploaded: true,
                                    data: bOwner.dateOfBirth,
                                    fromRegistry: true,
                                  };
                          }
                          if (bSup) {
                            if (bSup.files?.criminalRecord)
                              axisAnswerData.files.sup_1 = {
                                ...bSup.files.criminalRecord,
                                fromRegistry: true,
                              };
                            if (bSup.files?.idDocument || bSup.dateOfBirth)
                              axisAnswerData.files.sup_2 = bSup.files.idDocument
                                ? {
                                    ...bSup.files.idDocument,
                                    fromRegistry: true,
                                  }
                                : {
                                    uploaded: true,
                                    data: bSup.dateOfBirth,
                                    fromRegistry: true,
                                  };
                            if (bSup.files?.cv)
                              axisAnswerData.files.sup_3 = {
                                ...bSup.files.cv,
                                fromRegistry: true,
                              };
                            if (bSup.files?.certificate)
                              axisAnswerData.files.sup_4 = {
                                ...bSup.files.certificate,
                                fromRegistry: true,
                              };
                            if (bSup.files?.contract)
                              axisAnswerData.files.sup_5 = {
                                ...bSup.files.contract,
                                fromRegistry: true,
                              };
                          }

                          const expectedKeys = [
                            "owner_1",
                            "owner_2",
                            "owner_3",
                            "owner_4",
                            "sup_1",
                            "sup_2",
                            "sup_3",
                            "sup_4",
                            "sup_5",
                          ];
                          expectedKeys.forEach((k) => {
                            if (
                              !axisAnswerData[k] &&
                              !axisAnswerData.files[k]
                            ) {
                              axisAnswerData[k] = {
                                type: "checkbox",
                                checked: false,
                                empty: true,
                              };
                            }
                          });
                        }

                        // Extract files if available
                        const extractedFiles: {
                          key: string;
                          label: string;
                          uploaded: boolean;
                          data?: string;
                          fileObj?: any;
                        }[] = [];
                        if (axisAnswerData.files) {
                          Object.keys(axisAnswerData.files).forEach((fk) => {
                            extractedFiles.push({
                              key: fk,
                              label: fk,
                              uploaded: axisAnswerData.files[fk]?.uploaded,
                              data: axisAnswerData.files[fk]?.data,
                              fileObj: axisAnswerData.files[fk],
                            });
                          });
                        }

                        const rootKeys = Object.keys(axisAnswerData).filter(
                          (k) =>
                            ![
                              "files",
                              "completionPercentage",
                              "key",
                              "status",
                              "lastUpdated",
                            ].includes(k),
                        );
                        const fileKeys = axisAnswerData.files
                          ? Object.keys(axisAnswerData.files)
                          : [];
                        const rawKeys = Array.from(
                          new Set([...rootKeys, ...fileKeys]),
                        );

                        console.log("=== Admin Review Axis Log ===");
                        console.log("Selected Axis Key:", activeReviewAxis);
                        console.log("Raw answers object:", axisAnswerData);
                        console.log(
                          "Parsed display fields:",
                          rawKeys.map((k) => getFieldLabel(k)),
                        );
                        console.log(
                          "Extracted Files:",
                          extractedFiles.map((f) => f.fileObj),
                        );

                        const getSectionTitle = (key: string) => {
                          if (
                            [
                              "baseIncomeSources",
                              "extraIncomeSources",
                              "player_subs",
                              "sponsorships",
                              "owner_contribution",
                              "activities",
                              "others",
                            ].includes(key)
                          )
                            return "مصادر الدخل المالي";
                          if (
                            [
                              "baseExpenses",
                              "extraExpenses",
                              "tech_salaries",
                              "admin_salaries",
                              "field_rent",
                              "lfa_fees",
                              "medical_insurance",
                              "equipment",
                              "dev_activities",
                            ].includes(key)
                          )
                            return "المصروفات والتكاليف";
                          if (
                            ["pitchSpecifications", "pitchUsageRight"].includes(
                              key,
                            )
                          )
                            return "مواصفات وحقوق استخدام الملعب";
                          if (
                            [
                              "playerCoachFacilities",
                              "supportingFacilities",
                            ].includes(key)
                          )
                            return "المرافق المساندة للملعب";
                          if (
                            [
                              "goalkeeper_kit_photo",
                              "team_jersey_photo",
                            ].includes(key)
                          )
                            return "صورة أطقم اللاعبين";
                          if (
                            ["goals_photo", "goals_safe_status"].includes(key)
                          )
                            return "أمان ومواصفات المرمى";
                          if (
                            ["balls_stock_photo", "bibs_stock_photo"].includes(
                              key,
                            )
                          )
                            return "متطلبات التمرين (كرات، شيفونات)";
                          if (
                            key === "content_reviewer" ||
                            key.includes("content") ||
                            key.includes("_yesno") ||
                            key === "has_official_page"
                          )
                            return "إدارة محتوى المنصات";
                          if (
                            key === "official_name_confirm" ||
                            key === "platforms"
                          )
                            return "التواجد الرقمي والمنصات";
                          if (
                            key.startsWith("u10") ||
                            key.startsWith("u11") ||
                            key.startsWith("u12") ||
                            key.startsWith("u13")
                          )
                            return "الفئات السنية المعتمدة";
                          if (
                            key.includes("policy") ||
                            key.includes("charter") ||
                            key.includes("rules")
                          )
                            return "السياسات والقوانين الخاصة";

                          if (key.startsWith("owner_"))
                            return "مالك الأكاديمية";
                          if (key.startsWith("manager_"))
                            return "المدير الإداري";
                          if (key.startsWith("tech_")) return "المشرف الفني";
                          if (key.startsWith("sup_")) return "المشرف العام";
                          if (key.startsWith("vision_"))
                            return "الرؤية والمهمة";
                          if (key.startsWith("plan_") || key.startsWith("a_planning_") || key.startsWith("has_a_planning_"))
                            return "المنهاج وفلسفة التدريب";
                          if (key.startsWith("charter_"))
                            return "ميثاق السلوك واصدار القوانين";
                          if (key.startsWith("insurance_"))
                            return "التأمين والرعاية الصحية";
                          if (
                            key.startsWith("legal_") ||
                            key === "parents_consent_file"
                          )
                            return "الجوانب القانونية لأولياء الأمور";

                          return "متطلبات عامة وتفاصيل";
                        };

                        if (activeReviewAxis === "classificationA_planning") {
                          const pData = axisAnswerData || {};
                          const files = pData.files || {};
                          const currentReview = adminReviews[activeReviewAxis] || { status: "قيد المراجعة", note: "" };

                          const handleStatusChange = (status: string) => {
                            setAdminReviews((prev: any) => ({
                              ...prev,
                              [activeReviewAxis]: { ...currentReview, status },
                            }));
                          };
                          const handleNoteChange = (note: string) => {
                            setAdminReviews((prev: any) => ({
                              ...prev,
                              [activeReviewAxis]: { ...currentReview, note },
                            }));
                          };

                          const conditions = [
                            {
                              id: "a_planning_playing_philosophy",
                              label: "هل توجد فلسفة لعب موحدة (هوية كروية) مكتوبة لجميع الفئات؟",
                            },
                            {
                              id: "a_planning_annual_training_curriculum",
                              label: "هل يوجد منهاج تدريبي عام سنوي؟",
                            },
                            {
                              id: "a_planning_weekly_planning_template",
                              label: "هل يوجد نموذج تخطيط أسبوعي؟",
                            },
                            {
                              id: "a_planning_session_plan_template",
                              label: "هل يوجد نموذج تخطيط لحصة تدريبية؟",
                            },
                            {
                              id: "a_planning_coach_development_program",
                              label: "هل يوجد برنامج تطوير للمدربين في الأكاديمية؟",
                            }
                          ];

                          return (
                            <div className="space-y-6">
                              <div className="flex items-center justify-between border-b border-[#E5DED0] pb-4">
                                <h4 className="font-black text-xl text-[#022C22]">{activeAxisDef?.name}</h4>
                                <span className="px-3 py-1 bg-white border border-[#E5DED0] rounded-full text-xs font-bold">
                                  استكمال: {pData.completionPercentage || 0}%
                                </span>
                              </div>

                              <div className="grid grid-cols-1 gap-6">
                                {conditions.map((cond, index) => {
                                  const hasCondition = pData[`has_${cond.id}`];
                                  const fileKey = pData[cond.id] || (pData.files ? pData.files[cond.id] : null);
                                  
                                  return (
                                    <div key={cond.id} className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm flex flex-col gap-4">
                                      <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-[#064E3B] text-white rounded-full flex items-center justify-center font-bold shrink-0">
                                          {index + 1}
                                        </div>
                                        <div className="flex-1">
                                          <h4 className="font-bold text-[#022C22] mb-1 leading-relaxed">{cond.label}</h4>
                                          <div className="flex items-center gap-2 mt-2">
                                            <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${hasCondition === true ? "bg-green-50 text-green-700 border-green-200" : hasCondition === false ? "bg-red-50 text-red-700 border-red-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                                              {hasCondition === true ? "متوفر" : hasCondition === false ? "غير متوفر" : "لم يتم الإجابة"}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {hasCondition === true && (
                                        <div className="mr-14 border-t border-gray-100 pt-4 flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                                          <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-gray-400">attach_file</span>
                                            <span className="text-sm font-bold text-gray-600">
                                              {fileKey?.uploaded ? (fileKey.name || 'ملف مرفق') : "لم يتم رفع الملف"}
                                            </span>
                                          </div>
                                          {fileKey?.uploaded && (
                                            <button
                                              onClick={(e) => handleFilePreview(e, cond.label, fileKey.name || "", fileKey)}
                                              className="text-xs bg-[#064E3B] text-white px-4 py-2 rounded-lg flex items-center gap-1 hover:bg-[#022C22] transition-colors shadow-sm font-bold"
                                            >
                                              <span className="material-symbols-outlined text-[16px]">visibility</span>
                                              عرض الملف
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}

                                {pData.notes && (
                                  <div className="bg-[#FFFDF7] p-6 rounded-xl border border-[#C9A227]/30 shadow-sm">
                                    <h4 className="font-bold text-[#022C22] mb-2 flex items-center gap-2">
                                      <span className="material-symbols-outlined text-[#C9A227]">note</span>
                                      ملاحظات الأكاديمية
                                    </h4>
                                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{pData.notes}</p>
                                  </div>
                                )}
                              </div>

                              <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm space-y-4">
                                <h4 className="font-bold text-[#022C22] text-lg border-b border-gray-100 pb-2">قرار المراجعة</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div className="md:col-span-1 border-l border-gray-100 pl-6">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">حالة المحور</label>
                                    <select
                                      value={currentReview.status}
                                      onChange={(e) => handleStatusChange(e.target.value)}
                                      className="w-full p-3 border border-gray-200 rounded-lg text-sm font-bold cursor-pointer focus:border-[#C9A227] outline-none"
                                    >
                                      <option>قيد المراجعة</option>
                                      <option>مقبول</option>
                                      <option>مرفوض</option>
                                      <option>بحاجة استكمال</option>
                                    </select>
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">ملاحظات وسبب القرار</label>
                                    <textarea
                                      value={currentReview.note}
                                      onChange={(e) => handleNoteChange(e.target.value)}
                                      placeholder="ملاحظات توضيحية للقرار..."
                                      className="w-full text-sm p-3 border border-gray-200 rounded-lg min-h-[100px] outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227]"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        } else if (activeReviewAxis === "classificationB_planning") {
                          const pData = axisAnswerData || {};
                          const fileObj = pData.uploadedTrainingSessionPlan;
                          const currentReview = adminReviews[activeReviewAxis] || { status: "قيد المراجعة", note: "" };

                          const handleStatusChange = (status: string) => {
                            setAdminReviews((prev: any) => ({
                              ...prev,
                              [activeReviewAxis]: { ...currentReview, status },
                            }));
                          };
                          const handleNoteChange = (note: string) => {
                            setAdminReviews((prev: any) => ({
                              ...prev,
                              [activeReviewAxis]: { ...currentReview, note },
                            }));
                          };

                          return (
                            <div className="space-y-6">
                              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                                <h4 className="font-black text-xl text-[#022C22]">{activeAxisDef?.name}</h4>
                                <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-bold">
                                  استكمال المتقدم: {axisAnswerData.completionPercentage || 0}%
                                </span>
                              </div>

                              <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm flex flex-col gap-4">
                                <div className="flex items-start justify-between sm:items-center">
                                  <div className="flex flex-col gap-2">
                                    <h5 className="font-bold text-[#022C22] text-lg">نموذج حصة تدريبية</h5>
                                    {fileObj?.uploaded && (
                                      <button
                                        onClick={(e) => handleFilePreview(e, "نموذج حصة تدريبية", academyData?.academyName || "", fileObj)}
                                        className="text-xs bg-white text-[#064E3B] border border-[#064E3B]/20 py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-[#064E3B] hover:text-white transition-all font-bold shadow-sm w-fit mt-2"
                                      >
                                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                                        {fileObj.name || "عرض الملف المرفق"}
                                      </button>
                                    )}
                                  </div>
                                  <span className={`px-4 py-1.5 rounded-lg text-sm font-bold border ${fileObj?.uploaded ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                                    {fileObj?.uploaded ? "تم الرفع" : "لم يتم الرفع"}
                                  </span>
                                </div>
                              </div>

                              <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm space-y-4">
                                <h4 className="font-bold text-[#022C22] text-lg border-b border-gray-100 pb-2">قرار المراجعة</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div className="md:col-span-1 border-l border-gray-100 pl-6">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">حالة المحور</label>
                                    <select
                                      value={currentReview.status}
                                      onChange={(e) => handleStatusChange(e.target.value)}
                                      className="w-full p-3 border border-gray-200 rounded-lg text-sm font-bold cursor-pointer focus:border-[#C9A227] outline-none"
                                    >
                                      <option>قيد المراجعة</option>
                                      <option>مقبول</option>
                                      <option>مرفوض</option>
                                      <option>بحاجة استكمال</option>
                                    </select>
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">ملاحظات وسبب القرار</label>
                                    <textarea
                                      value={currentReview.note}
                                      onChange={(e) => handleNoteChange(e.target.value)}
                                      placeholder="ملاحظات توضيحية للقرار..."
                                      className="w-full text-sm p-3 border border-gray-200 rounded-lg min-h-[100px] outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227]"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        } else if (activeReviewAxis === "classificationA_leadership") {
                          const lData = axisAnswerData || {};
                          const files = lData.files || {};
                          const currentReview = adminReviews[activeReviewAxis] || { status: "قيد المراجعة", note: "" };

                          const handleStatusChange = (status: string) => {
                            setAdminReviews((prev: any) => ({
                              ...prev,
                              [activeReviewAxis]: { ...currentReview, status },
                            }));
                          };
                          const handleNoteChange = (note: string) => {
                            setAdminReviews((prev: any) => ({
                              ...prev,
                              [activeReviewAxis]: { ...currentReview, note },
                            }));
                          };

                          const getOwnerRequirements = () => [
                            { id: "owner_1", condition: "سجل عدلي نظيف (لا حكم عليه)", proofType: "file", proofLabel: "سجل عدلي لا يعود لأكثر من 3 أشهر" },
                            { id: "owner_2", condition: "أن يكون عمره 28 سنة وما فوق", proofType: "checkbox", proofLabel: "تم التحقق من الهوية أو تاريخ الميلاد" },
                            { id: "owner_3", condition: "أن يمثل الأكاديمية أمام الاتحاد اللبناني لكرة القدم والجهات الرسمية الأخرى", proofType: "checkbox", proofLabel: "تأكيد واعتماد ضمن الطلب" },
                            { id: "owner_4", condition: "يُمنع عليه إشغال أي منصب آخر ضمن الأكاديمية", proofType: "checkbox", proofLabel: "تأكيد" },
                          ];

                          const getManagerRequirements = () => [
                            { id: "manager_1", condition: "سجل عدلي نظيف (لا حكم عليه)", proofType: "file", proofLabel: "سجل عدلي لا يعود لأكثر من 3 أشهر" },
                            { id: "manager_2", condition: "أن يكون عمره 25 سنة وما فوق", proofType: "checkbox", proofLabel: "تم التحقق من الهوية أو تاريخ الميلاد" },
                            { id: "manager_4", condition: "أن يكون لديه خبرة في العمل الإداري أو الرياضي لا تقل عن 3 سنوات", proofType: "file", proofLabel: "سيرة ذاتية" },
                            { id: "manager_5", condition: "أن يمتلك مهارات في القيادة والتواصل وقادر على التنسيق بين الأقسام المختلفة", proofType: "checkbox", proofLabel: "تأكيد ضمن الطلب أو مقابلة عند الحاجة" },
                            { id: "manager_6", condition: "يجب أن يكون حائزًا على شهادة ثانوية عامة أو ما يعادلها", proofType: "file", proofLabel: "صورة عن الشهادة" },
                            { id: "manager_7", condition: "أن يعمل بموجب عقد عمل موقع من الطرفين", proofType: "file", proofLabel: "صورة عن عقد العمل" },
                          ];

                          const getTechnicalRequirements = () => [
                            { id: "tech_1", condition: "سجل عدلي نظيف (لا حكم عليه)", proofType: "file", proofLabel: "سجل عدلي لا يعود لأكثر من 3 أشهر" },
                            { id: "tech_3", condition: "أن يكون حائزًا على شهادة تدريب A أو B الآسيوية أو ما يعادلهما", proofType: "file", proofLabel: "نسخة عن الشهادة" },
                            { id: "tech_4", condition: "أن يكون حائزًا على شهادة الثانوية العامة على الأقل أو ما يعادلها", proofType: "file", proofLabel: "نسخة عن الشهادة" },
                            { id: "tech_5", condition: "أن يكون لديه خبرة لا تقل عن 5 سنوات في مجال التدريب أو الإشراف الفني في أكاديميات الواعدين", proofType: "file", proofLabel: "سيرة ذاتية" },
                            { id: "tech_6", condition: "أن يكون لديه القدرة على قيادة الجهاز الفني والتخطيط اليومي والأسبوعي والفصلي لجميع الفئات العمرية", proofType: "note", proofLabel: "مقابلة في الدائرة الفنية" },
                            { id: "tech_7", condition: "أن يعمل بموجب عقد عمل موقع من الطرفين", proofType: "file", proofLabel: "صورة عن عقد العمل" },
                          ];

                          const renderReq = (reqId: string, condition: string, proofLabel: string, proofType: string) => {
                            const hasDirectField = lData[reqId] !== undefined;
                            const hasFileField = files[reqId] !== undefined;

                            const isChecked = hasDirectField && lData[reqId].type === 'checkbox' && (lData[reqId].checked || true);
                            const isNote = proofType === 'note';

                            let docName = hasFileField ? (files[reqId].name || 'مرفق') : (hasDirectField ? lData[reqId].name : null);
                            const fileObj = files[reqId] || (hasDirectField && lData[reqId].type === 'file' ? lData[reqId] : null);
                            const isCompleted = isNote || (hasDirectField && lData[reqId].checked) || (fileObj && fileObj.uploaded) || files[reqId] !== undefined;
                            const fromRegistry = files[reqId]?.fromRegistry || lData[reqId]?.fromRegistry;

                            return (
                              <div key={reqId} className="flex flex-col md:flex-row justify-between items-start md:items-center py-4 border-b border-[#E5DED0] last:border-0 gap-4">
                                <div className="flex-1">
                                  <p className="font-bold text-[#022C22] mb-1">{condition}</p>
                                  <div className="flex items-center gap-2 text-sm text-[#64748B]">
                                    <span className="material-symbols-outlined text-[16px]">
                                      {proofType === "file" ? "attach_file" : proofType === "checkbox" ? "check_box" : "info"}
                                    </span>
                                    <span>{proofLabel}</span>
                                  </div>
                                </div>
                                <div className="w-full md:w-auto shrink-0 flex flex-col md:flex-row items-center gap-3">
                                  {isNote ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold border border-gray-200">
                                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                                      يُحدد لاحقاً
                                    </span>
                                  ) : isCompleted ? (
                                    <div className="flex items-center gap-3 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                                      <span className="inline-flex items-center gap-1.5 text-green-700 text-sm font-bold">
                                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                        {fromRegistry ? "مستخرج من السجل" : (proofType === "checkbox" ? "تم التأكيد" : "تم الرفع")}
                                      </span>
                                      {fileObj && (fileObj.uploaded || fromRegistry) && (
                                        <button
                                          onClick={(e) => handleFilePreview(e, condition, docName || "", fileObj)}
                                          className="text-xs bg-[#064E3B] text-white px-3 py-1.5 rounded flex items-center gap-1 hover:bg-[#022C22] transition-colors shadow-sm"
                                        >
                                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                                          عرض الملف
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-bold border border-red-200 w-full md:w-auto justify-center">
                                      <span className="material-symbols-outlined text-[16px]">error</span>
                                      غير مكتمل
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          };

                          return (
                            <div className="space-y-6">
                              <div className="flex items-center justify-between border-b border-[#E5DED0] pb-4">
                                <h4 className="font-black text-xl text-[#022C22]">{activeAxisDef?.name}</h4>
                                <span className="px-3 py-1 bg-white border border-[#E5DED0] rounded-full text-xs font-bold">
                                  استكمال: {lData.completionPercentage || 0}%
                                </span>
                              </div>

                              <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm mb-6">
                                <h5 className="font-bold text-[#064E3B] text-lg bg-[#064E3B]/5 px-4 py-2 rounded-lg mb-4">المالك</h5>
                                <div>
                                  {getOwnerRequirements().map((req) => renderReq(req.id, req.condition, req.proofLabel, req.proofType))}
                                </div>
                              </div>

                              <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm mb-6">
                                <h5 className="font-bold text-[#064E3B] text-lg bg-[#064E3B]/5 px-4 py-2 rounded-lg mb-4">المدير الإداري</h5>
                                <div>
                                  {getManagerRequirements().map((req) => renderReq(req.id, req.condition, req.proofLabel, req.proofType))}
                                </div>
                              </div>

                              <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm mb-6">
                                <h5 className="font-bold text-[#064E3B] text-lg bg-[#064E3B]/5 px-4 py-2 rounded-lg mb-4">المشرف الفني</h5>
                                <div>
                                  {getTechnicalRequirements().map((req) => renderReq(req.id, req.condition, req.proofLabel, req.proofType))}
                                </div>
                              </div>

                              <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm space-y-4">
                                <h4 className="font-bold text-[#022C22] text-lg border-b border-gray-100 pb-2">قرار المراجعة</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div className="md:col-span-1 border-l border-gray-100 pl-6">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">حالة المحور</label>
                                    <select
                                      value={currentReview.status}
                                      onChange={(e) => handleStatusChange(e.target.value)}
                                      className="w-full p-3 border border-gray-200 rounded-lg text-sm font-bold cursor-pointer focus:border-[#C9A227] outline-none"
                                    >
                                      <option>قيد المراجعة</option>
                                      <option>مقبول</option>
                                      <option>مرفوض</option>
                                      <option>بحاجة استكمال</option>
                                    </select>
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">ملاحظات وسبب القرار</label>
                                    <textarea
                                      value={currentReview.note}
                                      onChange={(e) => handleNoteChange(e.target.value)}
                                      placeholder="ملاحظات توضيحية للقرار..."
                                      className="w-full text-sm p-3 border border-gray-200 rounded-lg min-h-[100px] outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227]"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        } else if (
                          activeReviewAxis === "classificationA_organization"
                        ) {
                          const getPersonByRole = (roleKey: string) =>
                            registryPeople.find(
                              (p: any) => p.roleKey === roleKey,
                            );
                          const getPeopleByRole = (roleKey: string) =>
                            registryPeople.filter(
                              (p: any) => p.roleKey === roleKey,
                            );

                          const currentReview = adminReviews[
                            activeReviewAxis
                          ] || { status: "قيد المراجعة", note: "" };
                          const handleStatusChange = (status: string) =>
                            setAdminReviews((prev: any) => ({
                              ...prev,
                              [activeReviewAxis]: { ...currentReview, status },
                            }));
                          const handleNoteChange = (note: string) =>
                            setAdminReviews((prev: any) => ({
                              ...prev,
                              [activeReviewAxis]: { ...currentReview, note },
                            }));

                          const PersonCardLocal = ({
                            person,
                            roleLabel,
                            roleKey,
                          }: any) => {
                            if (!person) {
                              return (
                                <div className="bg-white border-2 border-dashed border-[#E5DED0] rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                    <span className="material-symbols-outlined text-gray-400">
                                      person_add
                                    </span>
                                  </div>
                                  <h4 className="font-bold text-[#022C22] text-sm mb-1">
                                    {roleLabel}
                                  </h4>
                                  <p className="text-xs text-red-400 font-bold">
                                    لم يتم تسجيل {roleLabel}
                                  </p>
                                </div>
                              );
                            }
                            const hasJD =
                              person.files?.jobDescription?.uploaded;
                            const hasCV =
                              person.files?.cv?.uploaded ||
                              person.files?.supportingDocument?.uploaded;
                            const hasCert = person.files?.certificate?.uploaded;
                            const hasContract =
                              person.files?.contract?.uploaded;
                            const isTechnical =
                              roleKey.startsWith("coach") ||
                              roleKey === "technicalSupervisor" ||
                              roleKey === "medicalManager" ||
                              roleKey === "doctor";
                            const needsContract = [
                              "administrativeManager",
                              "technicalSupervisor",
                              "coachU10",
                              "coachU11",
                              "coachU12",
                              "coachU13",
                              "medicalManager",
                              "doctor",
                            ].includes(roleKey);

                            return (
                              <div className="bg-white border border-[#E5DED0] rounded-2xl p-5 shadow-sm">
                                <div className="flex items-start gap-4 mb-4">
                                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
                                    {person.files?.profilePhoto?.preview ? (
                                      <img
                                        src={person.files.profilePhoto.preview}
                                        alt={person.fullName}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span className="material-symbols-outlined text-gray-300 text-3xl">
                                        account_circle
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-[#022C22] text-base truncate">
                                      {person.fullName}
                                    </h4>
                                    <div className="text-[10px] font-bold text-[#C9A227] uppercase tracking-wider mb-1">
                                      {roleLabel}
                                    </div>
                                    {person.phone && (
                                      <div className="text-[10px] text-[#64748B]">
                                        {person.phone}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <div
                                    className={`flex flex-col p-3 rounded-lg border ${hasJD ? "bg-[#064E3B]/5 border-[#064E3B]/20" : "bg-red-50 border-red-100"}`}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-bold text-[#022C22]">
                                        المسمى الوظيفي
                                      </span>
                                      {hasJD ? (
                                        <div className="text-[#064E3B] font-bold text-[10px] flex items-center gap-1">
                                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                          موجود
                                        </div>
                                      ) : (
                                        <div className="text-[10px] text-red-500 font-bold italic">
                                          ناقص
                                        </div>
                                      )}
                                    </div>
                                    {hasJD && (
                                      <button 
                                        onClick={(e) => handleFilePreview(e, "المسمى الوظيفي", person.files.jobDescription.name || "", person.files.jobDescription)}
                                        className="mt-1 w-full text-xs bg-white text-[#064E3B] border border-[#064E3B]/20 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 hover:bg-[#064E3B] hover:text-white transition-all font-bold shadow-sm"
                                      >
                                        <span className="material-symbols-outlined text-[14px]">visibility</span>
                                        عرض الملف
                                      </button>
                                    )}
                                  </div>
                                  
                                  {hasCV && (
                                    <div
                                      className={`flex flex-col p-3 rounded-lg border bg-[#064E3B]/5 border-[#064E3B]/20`}
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-[#022C22]">
                                          السيرة الذاتية (CV)
                                        </span>
                                        <div className="text-[#064E3B] font-bold text-[10px] flex items-center gap-1">
                                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                          موجود
                                        </div>
                                      </div>
                                      <button 
                                        onClick={(e) => handleFilePreview(e, "السيرة الذاتية", (person.files.cv || person.files.supportingDocument).name || "", (person.files.cv || person.files.supportingDocument))}
                                        className="mt-1 w-full text-xs bg-white text-[#064E3B] border border-[#064E3B]/20 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 hover:bg-[#064E3B] hover:text-white transition-all font-bold shadow-sm"
                                      >
                                        <span className="material-symbols-outlined text-[14px]">visibility</span>
                                        عرض الملف
                                      </button>
                                    </div>
                                  )}

                                  {isTechnical && (
                                    <div
                                      className={`flex flex-col p-3 rounded-lg border ${hasCert ? "bg-[#064E3B]/5 border-[#064E3B]/20" : "bg-red-50 border-red-100"}`}
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-[#022C22]">
                                          الشهادة / المؤهل
                                        </span>
                                        {hasCert ? (
                                          <div className="text-[#064E3B] font-bold text-[10px] flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">school</span>
                                            {person.certificateType || "موجودة"}
                                          </div>
                                        ) : (
                                          <div className="text-[10px] text-red-500 font-bold italic">
                                            ناقصة
                                          </div>
                                        )}
                                      </div>
                                      {hasCert && (
                                        <button 
                                          onClick={(e) => handleFilePreview(e, "الشهادة", person.files.certificate.name || "", person.files.certificate)}
                                          className="mt-1 w-full text-xs bg-white text-[#064E3B] border border-[#064E3B]/20 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 hover:bg-[#064E3B] hover:text-white transition-all font-bold shadow-sm"
                                        >
                                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                                          عرض الملف
                                        </button>
                                      )}
                                    </div>
                                  )}
                                  
                                  {needsContract && (
                                    <div
                                      className={`flex flex-col p-3 rounded-lg border ${hasContract ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-100"}`}
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-[#022C22]">
                                          عقد العمل
                                        </span>
                                        {hasContract ? (
                                          <div className="text-amber-700 font-bold text-[10px] flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">assignment</span>
                                            موجود
                                          </div>
                                        ) : (
                                          <div className="text-[10px] text-red-500 font-bold italic">
                                            ناقص
                                          </div>
                                        )}
                                      </div>
                                      {hasContract && (
                                        <button 
                                          onClick={(e) => handleFilePreview(e, "عقد العمل", person.files.contract.name || "", person.files.contract)}
                                          className="mt-1 w-full text-xs bg-white text-amber-700 border border-amber-700/20 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 hover:bg-amber-700 hover:text-white transition-all font-bold shadow-sm"
                                        >
                                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                                          عرض الملف
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          };

                          const ROLE_GROUPS = [
                            {
                              title: "القيادة الإدارة",
                              icon: "corporate_fare",
                              roles: [
                                { key: "owner", label: "مالك الأكاديمية" },
                                {
                                  key: "administrativeManager",
                                  label: "المدير الإداري",
                                },
                              ],
                            },
                            {
                              title: "المسؤول المالي",
                              icon: "account_balance_wallet",
                              roles: [
                                {
                                  key: "financeOfficer",
                                  label: "المسؤول المالي",
                                },
                              ],
                            },
                            {
                              title: "الجهاز الفني",
                              icon: "sports_soccer",
                              roles: [
                                {
                                  key: "technicalSupervisor",
                                  label: "المشرف الفني",
                                },
                                { key: "coachU10", label: "مدرب دون 10" },
                                { key: "coachU11", label: "مدرب دون 11" },
                                { key: "coachU12", label: "مدرب دون 12" },
                                { key: "coachU13", label: "مدرب دون 13" },
                              ],
                            },
                            {
                              title: "الإعلام التواصل",
                              icon: "campaign",
                              roles: [
                                {
                                  key: "mediaOfficer",
                                  label: "المسؤول الإعلامي",
                                },
                                {
                                  key: "socialMediaOfficer",
                                  label: "مسؤول التواصل الاجتماعي",
                                },
                                {
                                  key: "photographer",
                                  label: "المصورين",
                                  repeatable: true,
                                },
                              ],
                            },
                            {
                              title: "الجهاز الطبي",
                              icon: "health_and_safety",
                              roles: [
                                { key: "medicalManager", label: "مدير العلاج" },
                                { key: "doctor", label: "طبيب" },
                                {
                                  key: "physiotherapist",
                                  label: "المعالج الفيزيائي",
                                  repeatable: true,
                                },
                                {
                                  key: "paramedic",
                                  label: "المسعف",
                                  repeatable: true,
                                },
                                {
                                  key: "otherMedicalStaff",
                                  label: "مؤهل صحي آخر",
                                  repeatable: true,
                                },
                              ],
                            },
                          ];

                          return (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                              <div className="bg-[#022C22] text-white p-6 rounded-2xl flex items-center justify-between">
                                <div>
                                  <h3 className="text-2xl font-bold mb-1">
                                    المحور الثالث: التنظيم (تصنيف A)
                                  </h3>
                                  <p className="text-white/80 text-sm">
                                    مراجعة الهيكل التنظيمي والمسؤولين المسجلين
                                    في السجل
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-6">
                                {ROLE_GROUPS.map((group: any, idx: number) => (
                                  <div key={idx} className="space-y-4">
                                    <h2 className="text-xl font-bold text-[#022C22] flex items-center gap-2">
                                      <span className="material-symbols-outlined text-[#064E3B]">
                                        {group.icon}
                                      </span>
                                      {group.title}
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                      {group.roles.map((role: any) => {
                                        if (role.repeatable) {
                                          const items = getPeopleByRole(
                                            role.key,
                                          );
                                          if (items.length === 0)
                                            return (
                                              <PersonCardLocal
                                                key={role.key}
                                                roleLabel={role.label}
                                                roleKey={role.key}
                                              />
                                            );
                                          return items.map((p: any) => (
                                            <PersonCardLocal
                                              key={p.id}
                                              person={p}
                                              roleLabel={role.label}
                                              roleKey={role.key}
                                            />
                                          ));
                                        }
                                        const person = getPersonByRole(
                                          role.key,
                                        );
                                        return (
                                          <PersonCardLocal
                                            key={role.key}
                                            person={person}
                                            roleLabel={role.label}
                                            roleKey={role.key}
                                          />
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {(axisAnswerData?.internal_rules_doc?.uploaded || axisAnswerData?.internal_rules?.uploaded) && (
                                <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm">
                                  <h5 className="font-bold text-[#022C22] text-lg mb-4">
                                    النظام الداخلي المرفوع
                                  </h5>
                                  <button
                                    onClick={(e) =>
                                      handleFilePreview(
                                        e,
                                        "النظام الداخلي",
                                        (axisAnswerData?.internal_rules_doc || axisAnswerData?.internal_rules)?.name || "النظام الداخلي",
                                        (axisAnswerData?.internal_rules_doc || axisAnswerData?.internal_rules),
                                      )
                                    }
                                    className="text-sm font-bold text-[#022C22] bg-gray-100 border border-gray-200 px-4 py-3 rounded-xl hover:bg-gray-200 w-full md:w-auto flex items-center justify-center gap-2"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                                    عرض ملف النظام الداخلي
                                  </button>
                                </div>
                              )}

                              {/* Decision block */}
                              <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm">
                                <h5 className="font-bold text-[#022C22] text-lg mb-4 border-b border-[#E5DED0] pb-3">
                                  قرار الإدارة
                                </h5>
                                <div className="flex flex-col gap-4">
                                  <div className="flex gap-4">
                                    <button
                                      onClick={() =>
                                        handleStatusChange("مقبول")
                                      }
                                      className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all ${currentReview.status === "مقبول" ? "bg-green-50 border-green-500 text-green-700" : "border-gray-200 text-gray-400 hover:border-green-200 hover:text-green-600"}`}
                                    >
                                      مقبول
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleStatusChange("ملاحظات")
                                      }
                                      className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all ${currentReview.status === "ملاحظات" ? "bg-amber-50 border-amber-500 text-amber-700" : "border-gray-200 text-gray-400 hover:border-amber-200 hover:text-amber-600"}`}
                                    >
                                      طلب تعديل
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleStatusChange("مرفوض")
                                      }
                                      className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all ${currentReview.status === "مرفوض" ? "bg-red-50 border-red-500 text-red-700" : "border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-600"}`}
                                    >
                                      مرفوض
                                    </button>
                                  </div>
                                  <textarea
                                    value={currentReview.note}
                                    onChange={(e) =>
                                      handleNoteChange(e.target.value)
                                    }
                                    placeholder="ملاحظات توضيحية للقرار..."
                                    className="w-full text-sm p-3 border border-gray-200 rounded-lg min-h-[100px] outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227]"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        } else if (
                          activeReviewAxis === "classificationB_organization"
                        ) {
                          const getPersonByRole = (roleKey: string) =>
                            registryPeople.find(
                              (p: any) => p.roleKey === roleKey,
                            );
                          const getPeopleByRole = (roleKey: string) =>
                            registryPeople.filter(
                              (p: any) => p.roleKey === roleKey,
                            );

                          const peopleB = {
                            owner:
                              getPersonByRole("bOwner") ||
                              getPersonByRole("owner"),
                            supervisor: getPersonByRole("bGeneralSupervisor"),
                            coordinators: getPeopleByRole(
                              "bAdministrativeCoordinator",
                            ),
                            coach12: getPersonByRole("bCoachU12"),
                            coach13: getPersonByRole("bCoachU13"),
                            physios: getPeopleByRole("bPhysiotherapist"),
                          };

                          const ProfileCardLocal = ({
                            person,
                            roleLabel,
                            roleKey,
                          }: any) => {
                            if (!person) {
                              return (
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between text-gray-400">
                                  <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined rounded-full bg-gray-100 p-2 text-xl">
                                      person_off
                                    </span>
                                    <div>
                                      <p className="text-xs font-bold">
                                        {roleLabel}
                                      </p>
                                      <p className="text-xs">غير مسجل</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <div className="bg-white border border-[#E5DED0] rounded-xl p-4 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                  {person.files?.profilePhoto?.preview ? (
                                    <img
                                      src={person.files.profilePhoto.preview}
                                      alt={person.fullName}
                                      className="w-10 h-10 rounded-full object-cover shrink-0"
                                    />
                                  ) : (
                                    <span className="material-symbols-outlined rounded-full bg-gray-100 p-2 text-gray-400 shrink-0">
                                      person
                                    </span>
                                  )}
                                  <div>
                                    <p className="text-[10px] font-bold text-[#C9A227] uppercase">
                                      {roleLabel}
                                    </p>
                                    <p className="font-bold text-[#022C22]">
                                      {person.fullName}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  {person.files?.cv?.uploaded && (
                                    <span
                                      className="material-symbols-outlined text-green-600 text-sm"
                                      title="سيرة ذاتية موجودة"
                                    >
                                      check_circle
                                    </span>
                                  )}
                                  {person.files?.certificate?.uploaded && (
                                    <span
                                      className="material-symbols-outlined text-green-600 text-sm"
                                      title="شهادة موجودة"
                                    >
                                      workspace_premium
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          };

                          const currentReview = adminReviews[
                            activeReviewAxis
                          ] || { status: "قيد المراجعة", note: "" };
                          const handleStatusChange = (status: string) =>
                            setAdminReviews((prev: any) => ({
                              ...prev,
                              [activeReviewAxis]: { ...currentReview, status },
                            }));
                          const handleNoteChange = (note: string) =>
                            setAdminReviews((prev: any) => ({
                              ...prev,
                              [activeReviewAxis]: { ...currentReview, note },
                            }));

                          return (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                              <div className="bg-[#022C22] text-white p-6 rounded-2xl flex items-center justify-between">
                                <div>
                                  <h3 className="text-2xl font-bold mb-1">
                                    المحور الثالث: التنظيم (تصنيف B)
                                  </h3>
                                  <p className="text-white/80 text-sm">
                                    مراجعة الهيكل التنظيمي والمسؤولين المسجلين
                                    في السجل
                                  </p>
                                </div>
                              </div>

                              <div className="py-8 bg-gray-50/50 rounded-2xl border border-[#E5DED0] flex flex-col items-center overflow-x-auto hide-scrollbar">
                                <h3 className="font-bold text-center text-[#022C22] text-lg mb-8">
                                  الهيكل التنظيمي
                                </h3>
                                <div className="relative flex flex-col items-center min-w-[600px] pb-4">
                                  <div
                                    className={`w-64 p-5 rounded-3xl border-2 text-center transition-all bg-white shadow-md z-10 ${peopleB.owner ? "border-[#064E3B] text-[#064E3B]" : "border-[#E5DED0] text-gray-400 border-dashed"}`}
                                  >
                                    <div className="text-xs font-black uppercase text-[#C9A227] mb-2">
                                      مالك الأكاديمية
                                    </div>
                                    <div className="font-bold text-lg">
                                      {peopleB.owner?.fullName || "غير مسجل"}
                                    </div>
                                  </div>
                                  <div className="w-0.5 h-10 bg-[#E5DED0]"></div>

                                  <div className="relative w-full max-w-[600px] flex items-center justify-between">
                                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#E5DED0]"></div>
                                    <div className="flex justify-between w-full relative">
                                      <div className="flex flex-col items-center">
                                        <div className="w-0.5 h-10 bg-[#E5DED0]"></div>
                                        <div
                                          className={`w-56 p-5 rounded-2xl border-2 text-center transition-all shadow-sm ${peopleB.supervisor ? "bg-white border-[#064E3B] text-[#064E3B]" : "bg-white border-[#E5DED0] text-gray-400 border-dashed italic"}`}
                                        >
                                          <div className="text-[10px] font-black uppercase text-[#C9A227] mb-1">
                                            مشرف فني / إداري
                                          </div>
                                          <div className="font-bold text-base">
                                            {peopleB.supervisor?.fullName ||
                                              "غير مسجل"}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-center">
                                        <div className="w-0.5 h-10 bg-[#E5DED0]"></div>
                                        <div
                                          className={`w-56 p-5 rounded-2xl border-2 text-center transition-all shadow-sm ${peopleB.coordinators.length > 0 ? "bg-white border-[#064E3B] text-[#064E3B]" : "bg-white border-[#E5DED0] text-gray-400 border-dashed italic"}`}
                                        >
                                          <div className="text-[10px] font-black uppercase text-[#C9A227] mb-1">
                                            منسق إداري
                                          </div>
                                          <div className="font-bold text-base text-center">
                                            {peopleB.coordinators.length > 0
                                              ? peopleB.coordinators.length ===
                                                1
                                                ? peopleB.coordinators[0]
                                                    .fullName
                                                : `${peopleB.coordinators.length} منسقين`
                                              : "غير مسجل"}
                                          </div>
                                        </div>
                                        <div className="w-0.5 h-20 bg-[#E5DED0]"></div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="relative w-full max-w-[800px]">
                                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#E5DED0]"></div>
                                    <div className="flex justify-between w-full">
                                      <div className="flex flex-col items-center">
                                        <div className="w-0.5 h-10 bg-[#E5DED0]"></div>
                                        <div
                                          className={`w-48 p-4 rounded-xl border-2 text-center transition-all bg-white ${peopleB.physios.length > 0 ? "border-[#064E3B] shadow-sm" : "border-[#E5DED0] border-dashed text-gray-400"}`}
                                        >
                                          <div className="text-[9px] font-black uppercase text-[#C9A227] mb-1">
                                            معالجون
                                          </div>
                                          <div className="font-bold text-sm truncate">
                                            {peopleB.physios.length > 0
                                              ? `${peopleB.physios.length} معالجين`
                                              : "غير مسجل"}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-center">
                                        <div className="w-0.5 h-10 bg-[#E5DED0]"></div>
                                        <div
                                          className={`w-48 p-4 rounded-xl border-2 text-center transition-all bg-white ${peopleB.coordinators.length > 0 ? "border-[#064E3B] shadow-sm" : "border-[#E5DED0] border-dashed text-gray-400"}`}
                                        >
                                          <div className="text-[9px] font-black uppercase text-[#C9A227] mb-1">
                                            إداريون
                                          </div>
                                          <div className="font-bold text-sm">
                                            {peopleB.coordinators.length > 0
                                              ? `${peopleB.coordinators.length} إداري`
                                              : "غير مسجل"}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-center">
                                        <div className="w-0.5 h-10 bg-[#E5DED0]"></div>
                                        <div
                                          className={`w-64 p-4 rounded-xl border-2 text-center transition-all bg-white ${peopleB.coach12 || peopleB.coach13 ? "border-[#064E3B] shadow-sm" : "border-[#E5DED0] border-dashed text-gray-400"}`}
                                        >
                                          <div className="text-[9px] font-black uppercase text-[#C9A227] mb-2 text-center">
                                            مدربون
                                          </div>
                                          <div className="space-y-2 text-right">
                                            <div className="flex justify-between items-center text-[10px] gap-2">
                                              <span className="text-[#64748B] whitespace-nowrap">
                                                دون 12:
                                              </span>
                                              <span
                                                className={`font-bold truncate ${peopleB.coach12 ? "text-[#022C22]" : "text-gray-400 italic"}`}
                                              >
                                                {peopleB.coach12?.fullName ||
                                                  "غير مسجل"}
                                              </span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] gap-2">
                                              <span className="text-[#64748B] whitespace-nowrap">
                                                دون 13:
                                              </span>
                                              <span
                                                className={`font-bold truncate ${peopleB.coach13 ? "text-[#022C22]" : "text-gray-400 italic"}`}
                                              >
                                                {peopleB.coach13?.fullName ||
                                                  "غير مسجل"}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-6 bg-white p-6 rounded-2xl border border-[#E5DED0]">
                                <h3 className="font-bold text-xl text-[#022C22] mb-4">
                                  المسؤولون المسجلون في الأكاديمية
                                </h3>

                                <div className="space-y-4 font-bold">
                                  <h3 className="font-black text-[#64748B] flex items-center gap-2 text-sm uppercase tracking-wide">
                                    <span className="w-2 h-2 bg-[#064E3B] rounded-full"></span>{" "}
                                    القيادة
                                  </h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ProfileCardLocal
                                      person={peopleB.owner}
                                      roleLabel="مالك الأكاديمية"
                                      roleKey="bOwner"
                                    />
                                    <ProfileCardLocal
                                      person={peopleB.supervisor}
                                      roleLabel="مشرف فني أو إداري"
                                      roleKey="bGeneralSupervisor"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <h3 className="font-black text-[#64748B] flex items-center gap-2 text-sm uppercase tracking-wide">
                                    <span className="w-2 h-2 bg-[#064E3B] rounded-full"></span>{" "}
                                    الإدارة
                                  </h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {peopleB.coordinators.length > 0 ? (
                                      peopleB.coordinators.map((c: any) => (
                                        <ProfileCardLocal
                                          key={c.id}
                                          person={c}
                                          roleLabel="منسق إداري عام"
                                          roleKey="bAdministrativeCoordinator"
                                        />
                                      ))
                                    ) : (
                                      <ProfileCardLocal
                                        roleLabel="منسق إداري عام"
                                        roleKey="bAdministrativeCoordinator"
                                      />
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <h3 className="font-black text-[#64748B] flex items-center gap-2 text-sm uppercase tracking-wide">
                                    <span className="w-2 h-2 bg-[#064E3B] rounded-full"></span>{" "}
                                    الجهاز الفني الطبي
                                  </h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <ProfileCardLocal
                                      person={peopleB.coach13}
                                      roleLabel="مدرب دون 13"
                                      roleKey="bCoachU13"
                                    />
                                    <ProfileCardLocal
                                      person={peopleB.coach12}
                                      roleLabel="مدرب دون 12"
                                      roleKey="bCoachU12"
                                    />
                                    {peopleB.physios.length > 0 ? (
                                      peopleB.physios.map((c: any) => (
                                        <ProfileCardLocal
                                          key={c.id}
                                          person={c}
                                          roleLabel="معالج فيزيائي"
                                          roleKey="bPhysiotherapist"
                                        />
                                      ))
                                    ) : (
                                      <ProfileCardLocal
                                        roleLabel="معالج فيزيائي"
                                        roleKey="bPhysiotherapist"
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>

                              {axisAnswerData?.orgChartConfirm && (
                                <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm">
                                  <h5 className="font-bold text-[#022C22] text-lg mb-4">
                                    تأكيد الاعتماد
                                  </h5>
                                  <div className="text-sm font-bold text-[#064E3B] flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-100/50">
                                    <span className="material-symbols-outlined">
                                      verified
                                    </span>
                                    قام مقدم الطلب بتأكيد الهيكل التنظيمي
                                    واعتماده
                                  </div>
                                </div>
                              )}

                              {/* Decision block */}
                              <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm">
                                <h5 className="font-bold text-[#022C22] text-lg mb-4 border-b border-[#E5DED0] pb-3">
                                  قرار الإدارة
                                </h5>
                                <div className="flex flex-col gap-4">
                                  <div className="flex gap-4">
                                    <button
                                      onClick={() =>
                                        handleStatusChange("مقبول")
                                      }
                                      className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all ${currentReview.status === "مقبول" ? "bg-green-50 border-green-500 text-green-700" : "border-gray-200 text-gray-400 hover:border-green-200 hover:text-green-600"}`}
                                    >
                                      مقبول
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleStatusChange("ملاحظات")
                                      }
                                      className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all ${currentReview.status === "ملاحظات" ? "bg-amber-50 border-amber-500 text-amber-700" : "border-gray-200 text-gray-400 hover:border-amber-200 hover:text-amber-600"}`}
                                    >
                                      طلب تعديل
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleStatusChange("مرفوض")
                                      }
                                      className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all ${currentReview.status === "مرفوض" ? "bg-red-50 border-red-500 text-red-700" : "border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-600"}`}
                                    >
                                      مرفوض
                                    </button>
                                  </div>
                                  <textarea
                                    value={currentReview.note}
                                    onChange={(e) =>
                                      handleNoteChange(e.target.value)
                                    }
                                    placeholder="ملاحظات توضيحية للقرار..."
                                    className="w-full text-sm p-3 border border-gray-200 rounded-lg min-h-[100px] outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227]"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        } else if (
                          activeReviewAxis === "classificationB_technical"
                        ) {
                          const currentReview = adminReviews[
                            activeReviewAxis
                          ] || { status: "قيد المراجعة", note: "" };
                          const handleStatusChange = (status: string) =>
                            setAdminReviews((prev: any) => ({
                              ...prev,
                              [activeReviewAxis]: { ...currentReview, status },
                            }));
                          const handleNoteChange = (note: string) =>
                            setAdminReviews((prev: any) => ({
                              ...prev,
                              [activeReviewAxis]: { ...currentReview, note },
                            }));

                          const hasTwo = axisAnswerData?.hasTwoTeams;
                          const canCommit =
                            axisAnswerData?.canCommitToCoachPlayerFieldStandards;

                          return (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                              <div className="bg-[#022C22] text-white p-6 rounded-2xl flex items-center justify-between">
                                <div>
                                  <h3 className="text-2xl font-bold mb-1">
                                    المحور الرابع: الجانب الفني (تصنيف B)
                                  </h3>
                                  <p className="text-white/80 text-sm">
                                    مراجعة المعايير الفنية والفِرق
                                  </p>
                                </div>
                              </div>

                              <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E5DED0] shadow-sm space-y-6">
                                <div>
                                  <p className="font-bold text-[#022C22] mb-3 text-lg">
                                    هل يوجد فريقان على الأقل للمشاركة في دوريات
                                    الواعدين؟
                                  </p>
                                  {hasTwo === true ? (
                                    <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200 font-bold">
                                      <span className="material-symbols-outlined">
                                        check_circle
                                      </span>
                                      نعم
                                    </div>
                                  ) : hasTwo === false ? (
                                    <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-200 font-bold">
                                      <span className="material-symbols-outlined">
                                        cancel
                                      </span>
                                      كلا
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center gap-2 bg-gray-50 text-gray-500 px-4 py-2 rounded-lg border border-gray-200 font-bold">
                                      لم يتم تحديد إجابة
                                    </div>
                                  )}
                                </div>

                                <div className="border-t border-[#E5DED0] my-6"></div>

                                <div>
                                  <p className="font-bold text-[#022C22] mb-4 text-lg">
                                    معايير المدربون والملاعب واللاعبون
                                  </p>

                                  <div className="overflow-x-auto rounded-xl border border-[#E5DED0] mb-6">
                                    <table className="w-full text-right text-sm">
                                      <thead className="bg-[#022C22] text-white">
                                        <tr>
                                          <th className="px-4 py-3 font-bold whitespace-nowrap">
                                            الفئة العمرية
                                          </th>
                                          <th className="px-4 py-3 font-bold whitespace-nowrap">
                                            الشهادة التدريبية
                                          </th>
                                          <th className="px-4 py-3 font-bold whitespace-nowrap">
                                            الحد الأقصى للاعبين لكل مدرب
                                          </th>
                                          <th className="px-4 py-3 font-bold whitespace-nowrap">
                                            حجم الكرة
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-[#E5DED0]">
                                        {[
                                          {
                                            age: "دون 10",
                                            certificate: "D Diploma",
                                            players: 14,
                                            ball: 4,
                                          },
                                          {
                                            age: "دون 11",
                                            certificate: "D Diploma",
                                            players: 14,
                                            ball: 4,
                                          },
                                          {
                                            age: "دون 12",
                                            certificate: "C Diploma",
                                            players: 14,
                                            ball: 4,
                                          },
                                          {
                                            age: "دون 13",
                                            certificate: "C Diploma",
                                            players: 18,
                                            ball: 5,
                                          },
                                        ].map((std, i) => (
                                          <tr
                                            key={i}
                                            className="hover:bg-gray-50/50 transition-colors"
                                          >
                                            <td className="px-4 py-3 font-bold text-[#064E3B]">
                                              {std.age}
                                            </td>
                                            <td className="px-4 py-3 font-bold">
                                              {std.certificate}
                                            </td>
                                            <td className="px-4 py-3 font-bold">
                                              {std.players} لاعبين
                                            </td>
                                            <td className="px-4 py-3 font-bold">
                                              مقاس {std.ball}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>

                                  <p className="font-bold text-[#022C22] mb-3 text-lg">
                                    هل بإمكان الأكاديمية الالتزام بالشروط
                                    التالية؟
                                  </p>
                                  {canCommit === true ? (
                                    <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200 font-bold">
                                      <span className="material-symbols-outlined">
                                        check_circle
                                      </span>
                                      نعم
                                    </div>
                                  ) : canCommit === false ? (
                                    <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-200 font-bold">
                                      <span className="material-symbols-outlined">
                                        cancel
                                      </span>
                                      كلا
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center gap-2 bg-gray-50 text-gray-500 px-4 py-2 rounded-lg border border-gray-200 font-bold">
                                      لم يتم تحديد إجابة
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Decision block */}
                              <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm">
                                <h5 className="font-bold text-[#022C22] text-lg mb-4 border-b border-[#E5DED0] pb-3">
                                  قرار الإدارة
                                </h5>
                                <div className="flex flex-col gap-4">
                                  <div className="flex gap-4">
                                    <button
                                      onClick={() =>
                                        handleStatusChange("مقبول")
                                      }
                                      className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all ${currentReview.status === "مقبول" ? "bg-green-50 border-green-500 text-green-700" : "border-gray-200 text-gray-400 hover:border-green-200 hover:text-green-600"}`}
                                    >
                                      مقبول
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleStatusChange("ملاحظات")
                                      }
                                      className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all ${currentReview.status === "ملاحظات" ? "bg-amber-50 border-amber-500 text-amber-700" : "border-gray-200 text-gray-400 hover:border-amber-200 hover:text-amber-600"}`}
                                    >
                                      طلب تعديل
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleStatusChange("مرفوض")
                                      }
                                      className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all ${currentReview.status === "مرفوض" ? "bg-red-50 border-red-500 text-red-700" : "border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-600"}`}
                                    >
                                      مرفوض
                                    </button>
                                  </div>
                                  <textarea
                                    value={currentReview.note}
                                    onChange={(e) =>
                                      handleNoteChange(e.target.value)
                                    }
                                    placeholder="ملاحظات توضيحية للقرار..."
                                    className="w-full text-sm p-3 border border-gray-200 rounded-lg min-h-[100px] outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227]"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        } else if (
                          activeReviewAxis === "classificationB_safeguarding"
                        ) {
                          const currentReview = adminReviews[
                            activeReviewAxis
                          ] || { status: "قيد المراجعة", note: "" };
                          const handleStatusChange = (status: string) =>
                            setAdminReviews((prev: any) => ({
                              ...prev,
                              [activeReviewAxis]: { ...currentReview, status },
                            }));
                          const handleNoteChange = (note: string) =>
                            setAdminReviews((prev: any) => ({
                              ...prev,
                              [activeReviewAxis]: { ...currentReview, note },
                            }));

                          const hasPolicy =
                            axisAnswerData?.hasChildProtectionPolicy;
                          const policyFile =
                            axisAnswerData?.childProtectionPolicyFile;
                          const confirmed = axisAnswerData?.policyConfirmed;
                          const notes = axisAnswerData?.safeguardingNotes;

                          return (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                              <div className="bg-[#022C22] text-white p-6 rounded-2xl flex items-center justify-between">
                                <div>
                                  <h3 className="text-2xl font-bold mb-1">
                                    المحور السادس: الرعاية والتعليم (تصنيف B)
                                  </h3>
                                  <p className="text-white/80 text-sm">
                                    مراجعة سياسة حماية الطفل
                                  </p>
                                </div>
                              </div>

                              <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E5DED0] shadow-sm space-y-6">
                                <div>
                                  <p className="font-bold text-[#022C22] mb-3 text-lg">
                                    هل يوجد سياسة مكتوبة للرعاية وحماية الطفل؟
                                  </p>
                                  {hasPolicy === true ? (
                                    <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200 font-bold">
                                      <span className="material-symbols-outlined">
                                        check_circle
                                      </span>
                                      نعم
                                    </div>
                                  ) : hasPolicy === false ? (
                                    <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-200 font-bold">
                                      <span className="material-symbols-outlined">
                                        cancel
                                      </span>
                                      كلا
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center gap-2 bg-gray-50 text-gray-500 px-4 py-2 rounded-lg border border-gray-200 font-bold">
                                      لم يتم تحديد إجابة
                                    </div>
                                  )}
                                </div>

                                {hasPolicy === true && (
                                  <>
                                    <div className="border-t border-[#E5DED0] my-6"></div>

                                    <div>
                                      <p className="font-bold text-[#022C22] mb-4 text-lg">
                                        سياسة حماية الطفل المرفوعة
                                      </p>
                                      {policyFile ? (
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-[#E5DED0]">
                                          <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-[#064E3B]/10 flex items-center justify-center rounded-lg text-[#064E3B]">
                                              <span className="material-symbols-outlined">
                                                description
                                              </span>
                                            </div>
                                            <div>
                                              <h4 className="font-bold text-[#022C22] text-sm">
                                                {policyFile.name}
                                              </h4>
                                              <p className="text-xs text-gray-500">
                                                تم الرفع
                                              </p>
                                            </div>
                                          </div>
                                          <button
                                            onClick={(e) =>
                                              handleFilePreview(
                                                e,
                                                "سياسة حماية الطفل",
                                                academyData?.academyName || "",
                                                policyFile,
                                              )
                                            }
                                            className="px-4 py-2 bg-[#064E3B] text-white rounded-lg text-sm font-bold hover:bg-[#022C22] transition-colors"
                                          >
                                            عرض الملف
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-3 text-red-700 font-bold">
                                          <span className="material-symbols-outlined">
                                            error
                                          </span>
                                          لم يتم رفع الملف
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Decision block */}
                              <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm">
                                <h5 className="font-bold text-[#022C22] text-lg mb-4 border-b border-[#E5DED0] pb-3">
                                  قرار الإدارة
                                </h5>
                                <div className="flex flex-col gap-4">
                                  <div className="flex gap-4">
                                    <button
                                      onClick={() =>
                                        handleStatusChange("مقبول")
                                      }
                                      className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all ${currentReview.status === "مقبول" ? "bg-green-50 border-green-500 text-green-700" : "border-gray-200 text-gray-400 hover:border-green-200 hover:text-green-600"}`}
                                    >
                                      مقبول
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleStatusChange("ملاحظات")
                                      }
                                      className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all ${currentReview.status === "ملاحظات" ? "bg-amber-50 border-amber-500 text-amber-700" : "border-gray-200 text-gray-400 hover:border-amber-200 hover:text-amber-600"}`}
                                    >
                                      طلب تعديل
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleStatusChange("مرفوض")
                                      }
                                      className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all ${currentReview.status === "مرفوض" ? "bg-red-50 border-red-500 text-red-700" : "border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-600"}`}
                                    >
                                      مرفوض
                                    </button>
                                  </div>
                                  <textarea
                                    value={currentReview.note}
                                    onChange={(e) =>
                                      handleNoteChange(e.target.value)
                                    }
                                    placeholder="ملاحظات توضيحية للقرار..."
                                    className="w-full text-sm p-3 border border-gray-200 rounded-lg min-h-[100px] outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227]"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        } else if (
                          activeReviewAxis === "classificationB_facilities"
                        ) {
                          const currentReview = adminReviews[
                            activeReviewAxis
                          ] || { status: "قيد المراجعة", note: "" };
                          const handleStatusChange = (status: string) =>
                            setAdminReviews((prev: any) => ({
                              ...prev,
                              [activeReviewAxis]: { ...currentReview, status },
                            }));
                          const handleNoteChange = (note: string) =>
                            setAdminReviews((prev: any) => ({
                              ...prev,
                              [activeReviewAxis]: { ...currentReview, note },
                            }));

                          const hasLegalPitch = axisAnswerData?.hasLegalPitch;
                          const pitchDepth = axisAnswerData?.pitchDepth || "";
                          const pitchWidth = axisAnswerData?.pitchWidth || "";
                          const pitchSize =
                            pitchDepth && pitchWidth
                              ? `${pitchDepth}x${pitchWidth}`
                              : "";
                          const pitchName = axisAnswerData?.pitchName || "";
                          const pitchLocation =
                            axisAnswerData?.pitchLocation || "";
                          const pitchNotes = axisAnswerData?.pitchNotes || "";
                          const pitchContractFile =
                            axisAnswerData?.pitchContractFile;

                          const hasWaitingAreaOrStand =
                            axisAnswerData?.hasWaitingAreaOrStand;
                          const waitingAreaPhotosFile =
                            axisAnswerData?.waitingAreaPhotosFile;
                          const waitingAreaConfirmed =
                            axisAnswerData?.waitingAreaConfirmed;
                          const waitingAreaDescription =
                            axisAnswerData?.waitingAreaDescription || "";

                          return (
                            <div
                              className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-right"
                              dir="rtl"
                            >
                              <div className="bg-[#022C22] text-white p-6 rounded-2xl flex items-center justify-between">
                                <div>
                                  <h3 className="text-2xl font-bold mb-1">
                                    المحور الخامس: الملعب والمرافق الأخرى (تصنيف
                                    B)
                                  </h3>
                                  <p className="text-white/80 text-sm">
                                    مراجعة الملعب ومرافق التدريب
                                  </p>
                                </div>
                              </div>

                              {/* Section 1: Pitch */}
                              <section className="space-y-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-[#064E3B] text-white rounded-full flex items-center justify-center font-bold font-mono">
                                    1
                                  </div>
                                  <h2 className="text-xl font-bold text-[#022C22]">
                                    الملعب
                                  </h2>
                                </div>

                                <div className="bg-white rounded-[32px] border border-[#E5DED0] p-6 md:p-8 space-y-8 shadow-sm">
                                  <div>
                                    <p className="font-bold text-[#022C22] mb-1">
                                      هل تمتلك الأكاديمية ملعبًا قانونيًا
                                      للمباريات؟
                                    </p>
                                    <p className="text-xs text-[#64748B] mb-4">
                                      يُقبل الملعب إذا كان بقياس 50×30 متر أو
                                      70×45 متر.
                                    </p>
                                    <div className="flex gap-4">
                                      <button
                                        disabled
                                        className={`flex-1 sm:flex-none px-10 py-3.5 rounded-xl font-bold transition-all border-2 ${hasLegalPitch === true ? "bg-[#064E3B] text-white border-[#064E3B] shadow-md shadow-[#064E3B]/20" : "bg-white text-[#64748B] border-[#E5DED0] opacity-50"}`}
                                      >
                                        نعم
                                      </button>
                                      <button
                                        disabled
                                        className={`flex-1 sm:flex-none px-10 py-3.5 rounded-xl font-bold transition-all border-2 ${hasLegalPitch === false ? "bg-red-500 text-white border-red-500 shadow-md shadow-red-200" : "bg-white text-[#64748B] border-[#E5DED0] opacity-50"}`}
                                      >
                                        كلا
                                      </button>
                                    </div>
                                  </div>

                                  {hasLegalPitch === false && (
                                    <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
                                      <span className="material-symbols-outlined text-red-600">
                                        warning
                                      </span>
                                      <p className="text-sm text-red-800 leading-relaxed font-bold">
                                        عدم توفر ملعب قانوني يعني أن محور الملعب
                                        والمرافق غير مكتمل، لأن تصنيف B يتطلب
                                        وجود ملعب مناسب للتدريبات أو المباريات.
                                      </p>
                                    </div>
                                  )}

                                  {hasLegalPitch === true && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                                      <div className="bg-[#F6F1E7]/50 rounded-2xl p-6 border border-[#E5DED0]">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                          <div>
                                            <div className="inline-block px-3 py-1 bg-[#064E3B]/10 text-[#064E3B] rounded-lg text-xs font-bold mb-2">
                                              الشرط
                                            </div>
                                            <p className="font-bold text-[#022C22]">
                                              توفر ملعب قانوني للمباريات بقياس
                                              50×30 أو 70×45
                                            </p>
                                          </div>
                                          <div className="md:text-left">
                                            <div className="inline-block px-3 py-1 bg-[#C9A227]/10 text-[#C9A227] rounded-lg text-xs font-bold mb-2">
                                              الدليل المطلوب
                                            </div>
                                            <p className="font-bold text-[#C9A227]">
                                              عقد ملكية أو إيجار أو استثمار
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                          <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-4">
                                              <div className="space-y-1.5">
                                                <label className="font-bold text-[#022C22] text-sm">
                                                  الطول
                                                </label>
                                                <div className="w-full p-3.5 rounded-xl border border-[#E5DED0] bg-gray-50 text-sm opacity-80 cursor-not-allowed">
                                                  {pitchDepth
                                                    ? `${pitchDepth} متر`
                                                    : "لم يحدد"}
                                                </div>
                                              </div>
                                              <div className="space-y-1.5">
                                                <label className="font-bold text-[#022C22] text-sm">
                                                  العرض
                                                </label>
                                                <div className="w-full p-3.5 rounded-xl border border-[#E5DED0] bg-gray-50 text-sm opacity-80 cursor-not-allowed">
                                                  {pitchWidth
                                                    ? `${pitchWidth} متر`
                                                    : "لم يحدد"}
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="space-y-4">
                                            <div className="space-y-1.5">
                                              <label className="font-bold text-[#022C22] text-sm">
                                                اسم الملعب
                                              </label>
                                              <div className="w-full p-3.5 rounded-xl border border-[#E5DED0] bg-gray-50 text-sm opacity-80 cursor-not-allowed">
                                                {pitchName || "لم يحدد"}
                                              </div>
                                            </div>
                                            <div className="space-y-1.5">
                                              <label className="font-bold text-[#022C22] text-sm">
                                                موقع الملعب
                                              </label>
                                              <div className="w-full p-3.5 rounded-xl border border-[#E5DED0] bg-gray-50 text-sm opacity-80 cursor-not-allowed">
                                                {pitchLocation || "لم يحدد"}
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="space-y-4">
                                          <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-[#022C22]">
                                              رفع عقد الملكية أو الإيجار أو
                                              الاستثمار
                                            </h4>
                                            <div className="text-[10px] font-black text-[#C9A227] bg-[#C9A227]/5 px-3 py-1 rounded-full border border-[#C9A227]/20 uppercase">
                                              PDF, JPG, PNG
                                            </div>
                                          </div>
                                          {!pitchContractFile ? (
                                            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-[#E5DED0] rounded-2xl bg-gray-50/20 h-[200px] opacity-75">
                                              <span className="material-symbols-outlined text-4xl text-[#64748B] mb-2">
                                                upload_file
                                              </span>
                                              <span className="text-sm font-bold text-[#022C22]">
                                                لم يتم الرفع
                                              </span>
                                            </div>
                                          ) : (
                                            <div className="bg-white border border-[#E5DED0] rounded-2xl p-5 flex flex-col justify-between shadow-sm border-r-4 border-r-green-500 h-[200px]">
                                              <div className="flex items-center gap-3 w-full">
                                                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shrink-0">
                                                  <span className="material-symbols-outlined">
                                                    description
                                                  </span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                  <div className="font-bold text-sm text-[#022C22] truncate w-full">
                                                    {pitchContractFile.name}
                                                  </div>
                                                  <div className="text-[10px] text-green-600 font-bold">
                                                    تم الرفع الجاهز
                                                  </div>
                                                </div>
                                              </div>
                                              <button
                                                onClick={(e) =>
                                                  handleFilePreview(
                                                    e,
                                                    "عقد الملعب",
                                                    academyData?.academyName ||
                                                      "",
                                                    pitchContractFile,
                                                  )
                                                }
                                                className="w-full mt-4 p-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-sm text-[#022C22] transition-colors border border-gray-200"
                                              >
                                                عرض الملف
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {pitchNotes && (
                                        <div className="space-y-2">
                                          <label className="font-bold text-[#022C22] text-sm">
                                            ملاحظات حول الملعب
                                          </label>
                                          <div className="w-full p-4 rounded-2xl border border-[#E5DED0] bg-gray-50 text-sm text-[#022C22] h-24 overflow-y-auto">
                                            {pitchNotes}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </section>

                              {/* Section 2: Waiting Area */}
                              <section className="space-y-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-[#064E3B] text-white rounded-full flex items-center justify-center font-bold font-mono">
                                    2
                                  </div>
                                  <h2 className="text-xl font-bold text-[#022C22]">
                                    القاعة أو المدرج
                                  </h2>
                                </div>

                                <div className="bg-white rounded-[32px] border border-[#E5DED0] p-6 md:p-8 space-y-8 shadow-sm">
                                  <div>
                                    <p className="font-bold text-[#022C22] mb-4">
                                      هل يوجد قاعة أو باحة حيث يمكن للأهل
                                      الانتظار أو مدرج لمتابعة المباريات
                                      والتمارين؟
                                    </p>
                                    <div className="flex gap-4">
                                      <button
                                        disabled
                                        className={`flex-1 sm:flex-none px-10 py-3.5 rounded-xl font-bold transition-all border-2 ${hasWaitingAreaOrStand === true ? "bg-[#064E3B] text-white border-[#064E3B] shadow-md shadow-[#064E3B]/20" : "bg-white text-[#64748B] border-[#E5DED0] opacity-50"}`}
                                      >
                                        نعم
                                      </button>
                                      <button
                                        disabled
                                        className={`flex-1 sm:flex-none px-10 py-3.5 rounded-xl font-bold transition-all border-2 ${hasWaitingAreaOrStand === false ? "bg-red-500 text-white border-red-500 shadow-md shadow-red-200" : "bg-white text-[#64748B] border-[#E5DED0] opacity-50"}`}
                                      >
                                        كلا
                                      </button>
                                    </div>
                                  </div>

                                  <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="bg-[#F6F1E7]/50 rounded-2xl p-6 border border-[#E5DED0]">
                                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div>
                                          <div className="inline-block px-3 py-1 bg-[#064E3B]/10 text-[#064E3B] rounded-lg text-xs font-bold mb-2">
                                            الشرط
                                          </div>
                                          <p className="font-bold text-[#022C22]">
                                            وجود قاعة أو باحة انتظار للأهل أو
                                            مدرج لمتابعة المباريات والتمارين
                                          </p>
                                        </div>
                                        <div className="md:text-left">
                                          <div className="inline-block px-3 py-1 bg-[#C9A227]/10 text-[#C9A227] rounded-lg text-xs font-bold mb-2">
                                            الدليل المطلوب
                                          </div>
                                          <p className="font-bold text-[#C9A227]">
                                            صور واضحة – زيارة ميدانية
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                      <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                          <h4 className="font-bold text-[#022C22]">
                                            رفع صور القاعة أو الباحة أو المدرج
                                          </h4>
                                          <div className="text-[10px] font-black text-[#C9A227] bg-[#C9A227]/5 px-3 py-1 rounded-full border border-[#C9A227]/20 uppercase">
                                            JPG, PNG, PDF
                                          </div>
                                        </div>
                                        {!waitingAreaPhotosFile ? (
                                          <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-[#E5DED0] rounded-2xl bg-gray-50/20 h-[200px] opacity-75">
                                            <span className="material-symbols-outlined text-4xl text-[#64748B] mb-2">
                                              add_a_photo
                                            </span>
                                            <span className="text-sm font-bold text-[#022C22]">
                                              لم يتم الرفع
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="bg-white border border-[#E5DED0] rounded-2xl p-5 flex flex-col justify-between shadow-sm border-r-4 border-r-green-500 h-[200px]">
                                            <div className="flex items-center gap-3 w-full">
                                              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shrink-0">
                                                <span className="material-symbols-outlined">
                                                  image
                                                </span>
                                              </div>
                                              <div className="min-w-0 flex-1">
                                                <div className="font-bold text-sm text-[#022C22] truncate w-full">
                                                  {waitingAreaPhotosFile.name}
                                                </div>
                                                <div className="text-[10px] text-green-600 font-bold">
                                                  تم الرفع الجاهز
                                                </div>
                                              </div>
                                            </div>
                                            <button
                                              onClick={(e) =>
                                                handleFilePreview(
                                                  e,
                                                  "صور المدرج",
                                                  academyData?.academyName ||
                                                    "",
                                                  waitingAreaPhotosFile,
                                                )
                                              }
                                              className="w-full mt-4 p-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-sm text-[#022C22] transition-colors border border-gray-200"
                                            >
                                              عرض الملف
                                            </button>
                                          </div>
                                        )}
                                      </div>

                                      <div className="space-y-4">
                                        <h4 className="font-bold text-[#022C22]">
                                          التأكد من توفر القاعة أو المدرج
                                          والمرافق
                                        </h4>
                                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
                                          <label className="flex items-start gap-4">
                                            <input
                                              type="checkbox"
                                              checked={
                                                waitingAreaConfirmed === true
                                              }
                                              disabled
                                              className="w-5 h-5 mt-0.5 rounded text-[#064E3B] bg-white border-2 border-gray-300"
                                            />
                                            <div>
                                              <div className="font-bold text-[#022C22] mb-1">
                                                تم التأكد من توفر القاعة أو
                                                المدرج
                                              </div>
                                              <div className="text-xs text-gray-500 font-medium">
                                                (من خلال الزيارة الميدانية)
                                              </div>
                                            </div>
                                          </label>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </section>

                              {/* Decision block */}
                              <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm mt-8">
                                <h5 className="font-bold text-[#022C22] text-lg mb-4 border-b border-[#E5DED0] pb-3">
                                  قرار الإدارة
                                </h5>
                                <div className="flex flex-col gap-4">
                                  <div className="flex gap-4">
                                    <button
                                      onClick={() =>
                                        handleStatusChange("مقبول")
                                      }
                                      className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all ${currentReview.status === "مقبول" ? "bg-green-50 border-green-500 text-green-700" : "border-gray-200 text-gray-400 hover:border-green-200 hover:text-green-600"}`}
                                    >
                                      مقبول
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleStatusChange("ملاحظات")
                                      }
                                      className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all ${currentReview.status === "ملاحظات" ? "bg-amber-50 border-amber-500 text-amber-700" : "border-gray-200 text-gray-400 hover:border-amber-200 hover:text-amber-600"}`}
                                    >
                                      طلب تعديل
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleStatusChange("مرفوض")
                                      }
                                      className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all ${currentReview.status === "مرفوض" ? "bg-red-50 border-red-500 text-red-700" : "border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-600"}`}
                                    >
                                      مرفوض
                                    </button>
                                  </div>
                                  <textarea
                                    value={currentReview.note}
                                    onChange={(e) =>
                                      handleNoteChange(e.target.value)
                                    }
                                    placeholder="ملاحظات توضيحية للقرار..."
                                    className="w-full text-sm p-3 border border-gray-200 rounded-lg min-h-[100px] outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227]"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        } else if (
                          activeReviewAxis === "classificationB_equipment"
                        ) {
                          const currentReview = adminReviews[
                            activeReviewAxis
                          ] || { status: "قيد المراجعة", note: "" };
                          const handleStatusChange = (status: string) =>
                            setAdminReviews((prev: any) => ({
                              ...prev,
                              [activeReviewAxis]: { ...currentReview, status },
                            }));
                          const handleNoteChange = (note: string) =>
                            setAdminReviews((prev: any) => ({
                              ...prev,
                              [activeReviewAxis]: { ...currentReview, note },
                            }));

                          // Extraction of variables
                          const hasPlayingKit = axisAnswerData?.hasPlayingKit;
                          const playingKitPhotos =
                            axisAnswerData?.playingKitPhotos;

                          const hasNumbering = axisAnswerData?.hasNumbering;
                          const numberingPhotos =
                            axisAnswerData?.numberingPhotos;
                          const numberingConfirmed =
                            axisAnswerData?.numberingConfirmed;

                          const hasShirtLogo = axisAnswerData?.hasShirtLogo;
                          const shirtLogoPhotos =
                            axisAnswerData?.shirtLogoPhotos;

                          const hasGoalkeeperKit =
                            axisAnswerData?.hasGoalkeeperKit;
                          const goalkeeperKitPhotos =
                            axisAnswerData?.goalkeeperKitPhotos;

                          const hasTechnicalStaffKit =
                            axisAnswerData?.hasTechnicalStaffKit;
                          const technicalStaffKitPhotos =
                            axisAnswerData?.technicalStaffKitPhotos;

                          const hasGoalPosts = axisAnswerData?.hasGoalPosts;
                          const goalPostsPhotos =
                            axisAnswerData?.goalPostsPhotos;
                          const twoGoalPostsConfirmed =
                            axisAnswerData?.twoGoalPostsConfirmed;
                          const goalPostSizeConfirmed =
                            axisAnswerData?.goalPostSizeConfirmed;
                          const goalPostSize = axisAnswerData?.goalPostSize;
                          const customGoalPostSize =
                            axisAnswerData?.customGoalPostSize;

                          const renderFileBox = (title: string, file: any) => {
                            return (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-bold text-[#022C22]">
                                    رفع {title}
                                  </h4>
                                  <div className="text-[10px] font-black text-[#C9A227] bg-[#C9A227]/5 px-3 py-1 rounded-full border border-[#C9A227]/20 uppercase">
                                    JPG, PNG, PDF
                                  </div>
                                </div>
                                {!file ? (
                                  <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-[#E5DED0] rounded-2xl bg-gray-50/20 h-[200px] opacity-75">
                                    <span className="material-symbols-outlined text-4xl text-[#64748B] mb-2">
                                      add_a_photo
                                    </span>
                                    <span className="text-sm font-bold text-[#022C22]">
                                      لم يتم الرفع
                                    </span>
                                  </div>
                                ) : (
                                  <div className="bg-white border border-[#E5DED0] rounded-2xl p-5 flex flex-col justify-between shadow-sm border-r-4 border-r-green-500 h-[200px]">
                                    <div className="flex items-center gap-3 w-full">
                                      <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shrink-0">
                                        <span className="material-symbols-outlined">
                                          image
                                        </span>
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="font-bold text-sm text-[#022C22] truncate w-full">
                                          {file.name}
                                        </div>
                                        <div className="text-[10px] text-green-600 font-bold">
                                          تم الرفع الجاهز
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      onClick={(e) =>
                                        handleFilePreview(
                                          e,
                                          title,
                                          academyData?.academyName || "",
                                          file,
                                        )
                                      }
                                      className="w-full mt-4 p-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-sm text-[#022C22] transition-colors border border-gray-200"
                                    >
                                      عرض الملف
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          };

                          return (
                            <div
                              className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-right"
                              dir="rtl"
                            >
                              <div className="bg-[#022C22] text-white p-6 rounded-2xl flex items-center justify-between">
                                <div>
                                  <h3 className="text-2xl font-bold mb-1">
                                    المحور السابع: المعدات والتجهيزات (تصنيف B)
                                  </h3>
                                  <p className="text-white/80 text-sm">
                                    مراجعة طقم اللعب والمعدات
                                  </p>
                                </div>
                              </div>

                              {/* Section 1 */}
                              <section className="space-y-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-[#064E3B] text-white rounded-full flex items-center justify-center font-bold font-mono">
                                    1
                                  </div>
                                  <h2 className="text-xl font-bold text-[#022C22]">
                                    طقم اللعب
                                  </h2>
                                </div>
                                <div className="bg-white rounded-[32px] border border-[#E5DED0] p-6 md:p-8 space-y-8 shadow-sm">
                                  <div>
                                    <p className="font-bold text-[#022C22] mb-1">
                                      هل يوجد طقم لعب للفريق؟
                                    </p>
                                    <div className="flex gap-4 mt-4">
                                      <button
                                        disabled
                                        className={`flex-1 sm:flex-none px-10 py-3.5 rounded-xl font-bold transition-all border-2 ${hasPlayingKit === true ? "bg-[#064E3B] text-white border-[#064E3B] shadow-md shadow-[#064E3B]/20" : "bg-white text-[#64748B] border-[#E5DED0] opacity-50"}`}
                                      >
                                        نعم
                                      </button>
                                      <button
                                        disabled
                                        className={`flex-1 sm:flex-none px-10 py-3.5 rounded-xl font-bold transition-all border-2 ${hasPlayingKit === false ? "bg-red-500 text-white border-red-500 shadow-md shadow-red-200" : "bg-white text-[#64748B] border-[#E5DED0] opacity-50"}`}
                                      >
                                        كلا
                                      </button>
                                    </div>
                                  </div>
                                  {hasPlayingKit === false && (
                                    <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-4">
                                      <span className="material-symbols-outlined text-red-600">
                                        warning
                                      </span>
                                      <p className="text-sm text-red-800 leading-relaxed font-bold">
                                        عدم توفر طقم لعب للفريق يعني أن هذا
                                        المتطلب غير مكتمل.
                                      </p>
                                    </div>
                                  )}
                                  {hasPlayingKit === true && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                                      <div className="bg-[#F6F1E7]/50 rounded-2xl p-6 border border-[#E5DED0]">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                          <div>
                                            <div className="inline-block px-3 py-1 bg-[#064E3B]/10 text-[#064E3B] rounded-lg text-xs font-bold mb-2">
                                              الشرط
                                            </div>
                                            <p className="font-bold text-[#022C22]">
                                              وجود طقم لعب للفريق يتضمن قميص،
                                              شورت، وجوارب
                                            </p>
                                          </div>
                                          <div className="md:text-left">
                                            <div className="inline-block px-3 py-1 bg-[#C9A227]/10 text-[#C9A227] rounded-lg text-xs font-bold mb-2">
                                              الدليل المطلوب
                                            </div>
                                            <p className="font-bold text-[#C9A227]">
                                              تحميل صور الطقم
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                          {renderFileBox(
                                            "صور طقم اللعب",
                                            playingKitPhotos,
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </section>

                              {/* Section 2 */}
                              <section className="space-y-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-[#064E3B] text-white rounded-full flex items-center justify-center font-bold font-mono">
                                    2
                                  </div>
                                  <h2 className="text-xl font-bold text-[#022C22]">
                                    الترقيم
                                  </h2>
                                </div>
                                <div className="bg-white rounded-[32px] border border-[#E5DED0] p-6 md:p-8 space-y-8 shadow-sm">
                                  <div>
                                    <p className="font-bold text-[#022C22] mb-1">
                                      هل يوجد رقم لكل لاعب على القميص من الخلف؟
                                    </p>
                                    <div className="flex gap-4 mt-4">
                                      <button
                                        disabled
                                        className={`flex-1 sm:flex-none px-10 py-3.5 rounded-xl font-bold transition-all border-2 ${hasNumbering === true ? "bg-[#064E3B] text-white border-[#064E3B] shadow-md shadow-[#064E3B]/20" : "bg-white text-[#64748B] border-[#E5DED0] opacity-50"}`}
                                      >
                                        نعم
                                      </button>
                                      <button
                                        disabled
                                        className={`flex-1 sm:flex-none px-10 py-3.5 rounded-xl font-bold transition-all border-2 ${hasNumbering === false ? "bg-red-500 text-white border-red-500 shadow-md shadow-red-200" : "bg-white text-[#64748B] border-[#E5DED0] opacity-50"}`}
                                      >
                                        كلا
                                      </button>
                                    </div>
                                  </div>
                                  {hasNumbering === false && (
                                    <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-4">
                                      <span className="material-symbols-outlined text-red-600">
                                        warning
                                      </span>
                                      <p className="text-sm text-red-800 leading-relaxed font-bold">
                                        عدم وجود أرقام واضحة على القمصان يعني أن
                                        هذا المتطلب غير مكتمل.
                                      </p>
                                    </div>
                                  )}
                                  {hasNumbering === true && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                                      <div className="bg-[#F6F1E7]/50 rounded-2xl p-6 border border-[#E5DED0]">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                          <div>
                                            <div className="inline-block px-3 py-1 bg-[#064E3B]/10 text-[#064E3B] rounded-lg text-xs font-bold mb-2">
                                              الشرط
                                            </div>
                                            <p className="font-bold text-[#022C22]">
                                              وجود رقم لكل لاعب على القميص من
                                              الخلف مع عدم تكرار الأرقام
                                            </p>
                                          </div>
                                          <div className="md:text-left">
                                            <div className="inline-block px-3 py-1 bg-[#C9A227]/10 text-[#C9A227] rounded-lg text-xs font-bold mb-2">
                                              الدليل المطلوب
                                            </div>
                                            <p className="font-bold text-[#C9A227]">
                                              تحميل صور نموذج للقميص من الخلف
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                        <div className="space-y-4">
                                          {renderFileBox(
                                            "صور نموذج الترقيم",
                                            numberingPhotos,
                                          )}
                                        </div>
                                        <div className="space-y-4">
                                          <h4 className="font-bold text-[#022C22]">
                                            التأكيد
                                          </h4>
                                          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
                                            <label className="flex items-start gap-4">
                                              <input
                                                type="checkbox"
                                                checked={
                                                  numberingConfirmed === true
                                                }
                                                disabled
                                                className="w-5 h-5 mt-0.5 rounded text-[#064E3B] bg-white border-2 border-gray-300"
                                              />
                                              <div>
                                                <div className="font-bold text-[#022C22] mb-1 text-sm">
                                                  أؤكد أنه لا يوجد تكرار في
                                                  أرقام اللاعبين داخل الفريق.
                                                </div>
                                              </div>
                                            </label>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </section>

                              {/* Section 3 */}
                              <section className="space-y-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-[#064E3B] text-white rounded-full flex items-center justify-center font-bold font-mono">
                                    3
                                  </div>
                                  <h2 className="text-xl font-bold text-[#022C22]">
                                    الشعار
                                  </h2>
                                </div>
                                <div className="bg-white rounded-[32px] border border-[#E5DED0] p-6 md:p-8 space-y-8 shadow-sm">
                                  <div>
                                    <p className="font-bold text-[#022C22] mb-1">
                                      هل يوجد شعار على القميص جهة اليسار؟
                                    </p>
                                    <div className="flex gap-4 mt-4">
                                      <button
                                        disabled
                                        className={`flex-1 sm:flex-none px-10 py-3.5 rounded-xl font-bold transition-all border-2 ${hasShirtLogo === true ? "bg-[#064E3B] text-white border-[#064E3B] shadow-md shadow-[#064E3B]/20" : "bg-white text-[#64748B] border-[#E5DED0] opacity-50"}`}
                                      >
                                        نعم
                                      </button>
                                      <button
                                        disabled
                                        className={`flex-1 sm:flex-none px-10 py-3.5 rounded-xl font-bold transition-all border-2 ${hasShirtLogo === false ? "bg-red-500 text-white border-red-500 shadow-md shadow-red-200" : "bg-white text-[#64748B] border-[#E5DED0] opacity-50"}`}
                                      >
                                        كلا
                                      </button>
                                    </div>
                                  </div>
                                  {hasShirtLogo === false && (
                                    <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-4">
                                      <span className="material-symbols-outlined text-red-600">
                                        warning
                                      </span>
                                      <p className="text-sm text-red-800 leading-relaxed font-bold">
                                        عدم وجود شعار الأكاديمية على القميص يعني
                                        أن هذا المتطلب غير مكتمل.
                                      </p>
                                    </div>
                                  )}
                                  {hasShirtLogo === true && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                                      <div className="bg-[#F6F1E7]/50 rounded-2xl p-6 border border-[#E5DED0]">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                          <div>
                                            <div className="inline-block px-3 py-1 bg-[#064E3B]/10 text-[#064E3B] rounded-lg text-xs font-bold mb-2">
                                              الشرط
                                            </div>
                                            <p className="font-bold text-[#022C22]">
                                              وجود شعار الأكاديمية على القميص
                                              جهة اليسار
                                            </p>
                                          </div>
                                          <div className="md:text-left">
                                            <div className="inline-block px-3 py-1 bg-[#C9A227]/10 text-[#C9A227] rounded-lg text-xs font-bold mb-2">
                                              الدليل المطلوب
                                            </div>
                                            <p className="font-bold text-[#C9A227]">
                                              تحميل صور نموذج للشعار
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                          {renderFileBox(
                                            "صورة شعار القميص",
                                            shirtLogoPhotos,
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </section>

                              {/* Section 4 */}
                              <section className="space-y-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-[#064E3B] text-white rounded-full flex items-center justify-center font-bold font-mono">
                                    4
                                  </div>
                                  <h2 className="text-xl font-bold text-[#022C22]">
                                    حارس المرمى
                                  </h2>
                                </div>
                                <div className="bg-white rounded-[32px] border border-[#E5DED0] p-6 md:p-8 space-y-8 shadow-sm">
                                  <div>
                                    <p className="font-bold text-[#022C22] mb-1">
                                      هل يوجد لباس خاص بحارس المرمى يميزه عن
                                      باقي اللاعبين؟
                                    </p>
                                    <div className="flex gap-4 mt-4">
                                      <button
                                        disabled
                                        className={`flex-1 sm:flex-none px-10 py-3.5 rounded-xl font-bold transition-all border-2 ${hasGoalkeeperKit === true ? "bg-[#064E3B] text-white border-[#064E3B] shadow-md shadow-[#064E3B]/20" : "bg-white text-[#64748B] border-[#E5DED0] opacity-50"}`}
                                      >
                                        نعم
                                      </button>
                                      <button
                                        disabled
                                        className={`flex-1 sm:flex-none px-10 py-3.5 rounded-xl font-bold transition-all border-2 ${hasGoalkeeperKit === false ? "bg-red-500 text-white border-red-500 shadow-md shadow-red-200" : "bg-white text-[#64748B] border-[#E5DED0] opacity-50"}`}
                                      >
                                        كلا
                                      </button>
                                    </div>
                                  </div>
                                  {hasGoalkeeperKit === false && (
                                    <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-4">
                                      <span className="material-symbols-outlined text-red-600">
                                        warning
                                      </span>
                                      <p className="text-sm text-red-800 leading-relaxed font-bold">
                                        عدم توفر لباس خاص لحارس المرمى يعني أن
                                        هذا المتطلب غير مكتمل.
                                      </p>
                                    </div>
                                  )}
                                  {hasGoalkeeperKit === true && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                                      <div className="bg-[#F6F1E7]/50 rounded-2xl p-6 border border-[#E5DED0]">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                          <div>
                                            <div className="inline-block px-3 py-1 bg-[#064E3B]/10 text-[#064E3B] rounded-lg text-xs font-bold mb-2">
                                              الشرط
                                            </div>
                                            <p className="font-bold text-[#022C22]">
                                              وجود لباس خاص بحارس المرمى يميزه
                                              عن باقي اللاعبين
                                            </p>
                                          </div>
                                          <div className="md:text-left">
                                            <div className="inline-block px-3 py-1 bg-[#C9A227]/10 text-[#C9A227] rounded-lg text-xs font-bold mb-2">
                                              الدليل المطلوب
                                            </div>
                                            <p className="font-bold text-[#C9A227]">
                                              تحميل صورة الطقم
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                          {renderFileBox(
                                            "صورة طقم حارس المرمى",
                                            goalkeeperKitPhotos,
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </section>

                              {/* Section 5 */}
                              <section className="space-y-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-[#064E3B] text-white rounded-full flex items-center justify-center font-bold font-mono">
                                    5
                                  </div>
                                  <h2 className="text-xl font-bold text-[#022C22]">
                                    طقم الجهاز الفني
                                  </h2>
                                </div>
                                <div className="bg-white rounded-[32px] border border-[#E5DED0] p-6 md:p-8 space-y-8 shadow-sm">
                                  <div>
                                    <p className="font-bold text-[#022C22] mb-1">
                                      هل يوجد طقم خاص وموحد للأجهزة الفنية؟
                                    </p>
                                    <div className="flex gap-4 mt-4">
                                      <button
                                        disabled
                                        className={`flex-1 sm:flex-none px-10 py-3.5 rounded-xl font-bold transition-all border-2 ${hasTechnicalStaffKit === true ? "bg-[#064E3B] text-white border-[#064E3B] shadow-md shadow-[#064E3B]/20" : "bg-white text-[#64748B] border-[#E5DED0] opacity-50"}`}
                                      >
                                        نعم
                                      </button>
                                      <button
                                        disabled
                                        className={`flex-1 sm:flex-none px-10 py-3.5 rounded-xl font-bold transition-all border-2 ${hasTechnicalStaffKit === false ? "bg-red-500 text-white border-red-500 shadow-md shadow-red-200" : "bg-white text-[#64748B] border-[#E5DED0] opacity-50"}`}
                                      >
                                        كلا
                                      </button>
                                    </div>
                                  </div>
                                  {hasTechnicalStaffKit === false && (
                                    <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-4">
                                      <span className="material-symbols-outlined text-red-600">
                                        warning
                                      </span>
                                      <p className="text-sm text-red-800 leading-relaxed font-bold">
                                        عدم توفر طقم موحد للجهاز الفني يعني أن
                                        هذا المتطلب غير مكتمل.
                                      </p>
                                    </div>
                                  )}
                                  {hasTechnicalStaffKit === true && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                                      <div className="bg-[#F6F1E7]/50 rounded-2xl p-6 border border-[#E5DED0]">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                          <div>
                                            <div className="inline-block px-3 py-1 bg-[#064E3B]/10 text-[#064E3B] rounded-lg text-xs font-bold mb-2">
                                              الشرط
                                            </div>
                                            <p className="font-bold text-[#022C22]">
                                              وجود طقم خاص وموحد للأجهزة الفنية
                                              يتضمن قميص، شورت، وجوارب
                                            </p>
                                          </div>
                                          <div className="md:text-left">
                                            <div className="inline-block px-3 py-1 bg-[#C9A227]/10 text-[#C9A227] rounded-lg text-xs font-bold mb-2">
                                              الدليل المطلوب
                                            </div>
                                            <p className="font-bold text-[#C9A227]">
                                              تحميل صورة الطقم مع طباعة شعار
                                              الأكاديمية فقط
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                          {renderFileBox(
                                            "صورة طقم الجهاز الفني",
                                            technicalStaffKitPhotos,
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </section>

                              {/* Section 6 */}
                              <section className="space-y-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-[#064E3B] text-white rounded-full flex items-center justify-center font-bold font-mono">
                                    6
                                  </div>
                                  <h2 className="text-xl font-bold text-[#022C22]">
                                    المرمى
                                  </h2>
                                </div>
                                <div className="bg-white rounded-[32px] border border-[#E5DED0] p-6 md:p-8 space-y-8 shadow-sm">
                                  <div>
                                    <p className="font-bold text-[#022C22] mb-1">
                                      هل يوجد مرميان ضمن المواصفات أدناه؟
                                    </p>
                                    <div className="flex gap-4 mt-4">
                                      <button
                                        disabled
                                        className={`flex-1 sm:flex-none px-10 py-3.5 rounded-xl font-bold transition-all border-2 ${hasGoalPosts === true ? "bg-[#064E3B] text-white border-[#064E3B] shadow-md shadow-[#064E3B]/20" : "bg-white text-[#64748B] border-[#E5DED0] opacity-50"}`}
                                      >
                                        نعم
                                      </button>
                                      <button
                                        disabled
                                        className={`flex-1 sm:flex-none px-10 py-3.5 rounded-xl font-bold transition-all border-2 ${hasGoalPosts === false ? "bg-red-500 text-white border-red-500 shadow-md shadow-red-200" : "bg-white text-[#64748B] border-[#E5DED0] opacity-50"}`}
                                      >
                                        كلا
                                      </button>
                                    </div>
                                  </div>
                                  {hasGoalPosts === false && (
                                    <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-4">
                                      <span className="material-symbols-outlined text-red-600">
                                        warning
                                      </span>
                                      <p className="text-sm text-red-800 leading-relaxed font-bold">
                                        عدم توفر مرميين ضمن المواصفات المطلوبة
                                        يعني أن هذا المتطلب غير مكتمل.
                                      </p>
                                    </div>
                                  )}
                                  {hasGoalPosts === true && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                                      <div className="bg-[#F6F1E7]/50 rounded-2xl p-6 border border-[#E5DED0]">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                          <div>
                                            <div className="inline-block px-3 py-1 bg-[#064E3B]/10 text-[#064E3B] rounded-lg text-xs font-bold mb-2">
                                              الشرط
                                            </div>
                                            <p className="font-bold text-[#022C22]">
                                              وجود مرميين ضمن المواصفات المطلوبة
                                            </p>
                                          </div>
                                          <div className="md:text-left">
                                            <div className="inline-block px-3 py-1 bg-[#C9A227]/10 text-[#C9A227] rounded-lg text-xs font-bold mb-2">
                                              الدليل المطلوب
                                            </div>
                                            <p className="font-bold text-[#C9A227]">
                                              تحميل صور واضحة للمرميين
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="overflow-x-auto rounded-2xl border border-[#E5DED0]">
                                        <table className="w-full text-right bg-white">
                                          <thead className="bg-[#022C22] text-white">
                                            <tr>
                                              <th className="py-3 px-6 text-sm font-bold">
                                                الفئة
                                              </th>
                                              <th className="py-3 px-6 text-sm font-bold border-r border-white/10 text-center">
                                                قياس العرض
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {[
                                              {
                                                age: "دون 10",
                                                size: "4.5 – 5 أمتار",
                                              },
                                              {
                                                age: "دون 11",
                                                size: "4.5 – 5 أمتار",
                                              },
                                              {
                                                age: "دون 12",
                                                size: "5 – 6 أمتار",
                                              },
                                              {
                                                age: "دون 13",
                                                size: "5 – 6 أمتار",
                                              },
                                            ].map((std, i) => (
                                              <tr
                                                key={i}
                                                className="border-t border-[#E5DED0]"
                                              >
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

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                        <div className="space-y-4">
                                          {renderFileBox(
                                            "صور المرميين",
                                            goalPostsPhotos,
                                          )}
                                        </div>
                                        <div className="space-y-4 pt-4">
                                          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 mb-4">
                                            <label className="flex items-start gap-4">
                                              <input
                                                type="checkbox"
                                                checked={
                                                  twoGoalPostsConfirmed === true
                                                }
                                                disabled
                                                className="w-5 h-5 mt-0.5 rounded text-[#064E3B] bg-white border-2 border-gray-300"
                                              />
                                              <div>
                                                <div className="font-bold text-[#022C22] mb-1 text-sm">
                                                  أؤكد أن عدد المرميين لا يقل عن
                                                  اثنين.
                                                </div>
                                              </div>
                                            </label>
                                          </div>
                                          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
                                            <label className="flex items-start gap-4">
                                              <input
                                                type="checkbox"
                                                checked={
                                                  goalPostSizeConfirmed === true
                                                }
                                                disabled
                                                className="w-5 h-5 mt-0.5 rounded text-[#064E3B] bg-white border-2 border-gray-300"
                                              />
                                              <div>
                                                <div className="font-bold text-[#022C22] mb-1 text-sm">
                                                  أؤكد أن قياس المرمى مناسب
                                                  للفئات العمرية المطلوبة.
                                                </div>
                                              </div>
                                            </label>
                                          </div>
                                          <div className="space-y-2 mt-4">
                                            <label className="font-bold text-[#022C22] text-sm">
                                              قياس المرمى المتوفر
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                              {[
                                                "4.5 – 5 أمتار",
                                                "5 – 6 أمتار",
                                                "قياس آخر",
                                              ].map((size) => (
                                                <button
                                                  key={size}
                                                  disabled
                                                  className={`px-3 py-2 rounded-lg text-xs font-bold border-2 transition-all ${goalPostSize === size ? "bg-[#064E3B] text-white border-[#064E3B]" : "bg-gray-50 text-[#64748B] border-gray-100 opacity-50"}`}
                                                >
                                                  {size}
                                                </button>
                                              ))}
                                            </div>
                                            {goalPostSize === "قياس آخر" && (
                                              <input
                                                type="text"
                                                value={customGoalPostSize || ""}
                                                disabled
                                                className="w-full p-3.5 mt-2 rounded-xl border border-[#E5DED0] outline-none bg-gray-50 text-sm font-bold text-gray-500"
                                              />
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </section>

                              {/* Decision block */}
                              <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm mt-8">
                                <h5 className="font-bold text-[#022C22] text-lg mb-4 border-b border-[#E5DED0] pb-3">
                                  قرار الإدارة
                                </h5>
                                <div className="flex flex-col gap-4">
                                  <div className="flex gap-4">
                                    <button
                                      onClick={() =>
                                        handleStatusChange("مقبول")
                                      }
                                      className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all ${currentReview.status === "مقبول" ? "bg-green-50 border-green-500 text-green-700" : "border-gray-200 text-gray-400 hover:border-green-200 hover:text-green-600"}`}
                                    >
                                      مقبول
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleStatusChange("ملاحظات")
                                      }
                                      className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all ${currentReview.status === "ملاحظات" ? "bg-amber-50 border-amber-500 text-amber-700" : "border-gray-200 text-gray-400 hover:border-amber-200 hover:text-amber-600"}`}
                                    >
                                      طلب تعديل
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleStatusChange("مرفوض")
                                      }
                                      className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all ${currentReview.status === "مرفوض" ? "bg-red-50 border-red-500 text-red-700" : "border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-600"}`}
                                    >
                                      مرفوض
                                    </button>
                                  </div>
                                  <textarea
                                    value={currentReview.note}
                                    onChange={(e) =>
                                      handleNoteChange(e.target.value)
                                    }
                                    placeholder="ملاحظات توضيحية للقرار..."
                                    className="w-full text-sm p-3 border border-gray-200 rounded-lg min-h-[100px] outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227]"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        } else if (activeReviewAxis === "classificationA_technical") {
                          const tData = axisAnswerData || {};
                          const currentReview = adminReviews[activeReviewAxis] || { status: "قيد المراجعة", note: "" };
                          const handleStatusChange = (status: string) => setAdminReviews((prev: any) => ({ ...prev, [activeReviewAxis]: { ...currentReview, status } }));
                          const handleNoteChange = (note: string) => setAdminReviews((prev: any) => ({ ...prev, [activeReviewAxis]: { ...currentReview, note } }));

                          const certLevels: Record<string, number> = {
                            "C Diploma": 1,
                            "Youth Level 1 Diploma": 2,
                            "Youth Level 2 Diploma": 3,
                            "B Diploma": 4,
                            "A Diploma": 5,
                            "Pro Diploma": 6,
                          };

                          const isCertValid = (coach: any, minCert: string) => {
                            if (!coach || !coach.certificateType) return false;
                            const currentLevel = certLevels[coach.certificateType] || 0;
                            const requiredLevel = certLevels[minCert] || 0;
                            return currentLevel >= requiredLevel;
                          };

                          const categoriesInfo = [
                            { id: "u10", name: "فئة دون 10", minCertificate: "C Diploma", minCertLabel: "C Diploma أو أعلى", minPlayers: 14, fieldSize: "50×30", ballSize: 4, roleKey: "coachU10" },
                            { id: "u11", name: "فئة دون 11", minCertificate: "C Diploma", minCertLabel: "C Diploma أو أعلى", minPlayers: 14, fieldSize: "50×30", ballSize: 4, roleKey: "coachU11" },
                            { id: "u12", name: "فئة دون 12", minCertificate: "Youth Level 1 Diploma", minCertLabel: "Youth Level 1 Diploma أو أعلى", minPlayers: 18, fieldSize: "65×45", ballSize: 5, roleKey: "coachU12" },
                            { id: "u13", name: "فئة دون 13", minCertificate: "Youth Level 1 Diploma", minCertLabel: "Youth Level 1 Diploma أو أعلى", minPlayers: 18, fieldSize: "65×45", ballSize: 5, roleKey: "coachU13" },
                          ];

                          return (
                            <div className="space-y-6">
                              <div className="flex items-center justify-between border-b border-[#E5DED0] pb-4">
                                <h4 className="font-black text-xl text-[#022C22]">{activeAxisDef?.name}</h4>
                                <span className="px-3 py-1 bg-white border border-[#E5DED0] rounded-full text-xs font-bold">
                                  استكمال: {tData.completionPercentage || 0}%
                                </span>
                              </div>

                              <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm mb-6">
                                <h5 className="font-bold text-[#064E3B] text-lg bg-[#064E3B]/5 px-4 py-2 rounded-lg mb-4">
                                  الفئات العمرية والمتطلبات
                                </h5>
                                <div className="space-y-6">
                                  {categoriesInfo.map((cat) => {
                                    const coach = registryPeople.find((p: any) => p.roleKey === cat.roleKey);
                                    const isValidCoach = isCertValid(coach, cat.minCertificate);
                                    const catData = tData[cat.id] || {};
                                    const hasPlayers = (catData.playersCount || 0) >= cat.minPlayers;
                                    
                                    return (
                                      <div key={cat.id} className="border border-[#E5DED0] rounded-xl p-4 bg-[#F6F1E7]/20">
                                        <h4 className="font-bold text-[#022C22] text-lg mb-3 border-b border-gray-200 pb-2">{cat.name}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {/* Coach box */}
                                          <div className={`p-4 rounded-lg flex flex-col justify-center border ${coach ? (isValidCoach ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200") : "bg-red-50 border-red-200"}`}>
                                            <div className="flex items-center gap-2 font-bold mb-1">
                                              <span className="material-symbols-outlined text-[18px]">person</span>
                                              المدرب ({cat.minCertLabel})
                                            </div>
                                            {coach ? (
                                              <>
                                                <div className="text-sm font-bold text-[#022C22]">{coach.fullName || coach.name}</div>
                                                <div className="flex flex-col gap-2 mt-2">
                                                  <div className="flex items-center gap-1.5 text-xs font-bold w-fit">
                                                    <span className={isValidCoach ? "text-green-700 bg-green-100 px-2 py-1 rounded" : "text-amber-700 bg-amber-100 px-2 py-1 rounded"}>
                                                      {coach.certificateType || "لا يوجد شهادة"}
                                                    </span>
                                                    {!isValidCoach && (
                                                      <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[14px]">warning</span>
                                                        لا تلبي الحد الأدنى
                                                      </span>
                                                    )}
                                                  </div>
                                                  {coach.files?.certificate?.uploaded && (
                                                    <button 
                                                      onClick={(e) => handleFilePreview(e, `شهادة المدرب - ${cat.name}`, coach.files.certificate.name || "", coach.files.certificate)}
                                                      className="mt-1 w-full text-xs bg-white text-[#064E3B] border border-[#064E3B]/20 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 hover:bg-[#064E3B] hover:text-white transition-all font-bold shadow-sm"
                                                    >
                                                      <span className="material-symbols-outlined text-[14px]">visibility</span>
                                                      عرض الشهادة
                                                    </button>
                                                  )}
                                                </div>
                                              </>
                                            ) : (
                                              <div className="text-red-600 text-xs font-bold mt-1">غير مسجل في السجل</div>
                                            )}
                                          </div>
                                          
                                          {/* Options box */}
                                          <div className="bg-white border border-[#E5DED0] rounded-lg p-3 space-y-2">
                                            <div className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                                                <span className="font-bold text-[#64748B]">عدد اللاعبين ({cat.minPlayers} أدنى):</span>
                                                <div className={`font-bold px-2 py-0.5 rounded ${hasPlayers ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                  {catData.playersCount || 0}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                                                <span className="font-bold text-[#64748B]">توفر مساحة {cat.fieldSize}:</span>
                                                <span className={`material-symbols-outlined text-[18px] ${catData.fieldConfirmed ? 'text-green-500' : 'text-red-500'}`}>
                                                  {catData.fieldConfirmed ? 'check_circle' : 'cancel'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                                                <span className="font-bold text-[#64748B]">توفر كرات بحجم {cat.ballSize}:</span>
                                                <span className={`material-symbols-outlined text-[18px] ${catData.ballConfirmed ? 'text-green-500' : 'text-red-500'}`}>
                                                  {catData.ballConfirmed ? 'check_circle' : 'cancel'}
                                                </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              
                              <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm mb-6">
                                <h5 className="font-bold text-[#064E3B] text-lg bg-[#064E3B]/5 px-4 py-2 rounded-lg mb-4">
                                  البطولات
                                </h5>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between p-4 border border-[#E5DED0] rounded-xl bg-[#F6F1E7]/30">
                                    <span className="font-bold text-[#022C22]">جاهزية فريق U12 للمشاركة في المسابقات</span>
                                    <span className={`px-3 py-1 rounded-lg text-sm font-bold ${tData.readyU12 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                      {tData.readyU12 ? 'جاهز' : 'غير جاهز'}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between p-4 border border-[#E5DED0] rounded-xl bg-[#F6F1E7]/30">
                                    <span className="font-bold text-[#022C22]">جاهزية فريق U13 للمشاركة في المسابقات</span>
                                    <span className={`px-3 py-1 rounded-lg text-sm font-bold ${tData.readyU13 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                      {tData.readyU13 ? 'جاهز' : 'غير جاهز'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm space-y-4">
                                <h4 className="font-bold text-[#022C22] text-lg border-b border-gray-100 pb-2">قرار المراجعة</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div className="md:col-span-1 border-l border-gray-100 pl-6">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">حالة المحور</label>
                                    <select
                                      value={currentReview.status}
                                      onChange={(e) => handleStatusChange(e.target.value)}
                                      className="w-full p-3 border border-gray-200 rounded-lg text-sm font-bold cursor-pointer focus:border-[#C9A227] outline-none"
                                    >
                                      <option>قيد المراجعة</option>
                                      <option>مقبول</option>
                                      <option>مرفوض</option>
                                      <option>بحاجة استكمال</option>
                                    </select>
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">ملاحظات وسبب القرار</label>
                                    <textarea
                                      value={currentReview.note}
                                      onChange={(e) => handleNoteChange(e.target.value)}
                                      placeholder="ملاحظات توضيحية للقرار..."
                                      className="w-full text-sm p-3 border border-gray-200 rounded-lg min-h-[100px] outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227]"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        } else if (
                          activeReviewAxis === "classificationA_budget"
                        ) {
                          const bData = axisAnswerData || {};
                          const currentReview = adminReviews[
                            activeReviewAxis
                          ] || { status: "قيد المراجعة", note: "" };

                          const handleStatusChange = (status: string) => {
                            setAdminReviews((prev: any) => ({
                              ...prev,
                              [activeReviewAxis]: { ...currentReview, status },
                            }));
                          };
                          const handleNoteChange = (note: string) => {
                            setAdminReviews((prev: any) => ({
                              ...prev,
                              [activeReviewAxis]: { ...currentReview, note },
                            }));
                          };

                          const expenses: [string, string][] = [];
                          const income: [string, string][] = [];

                          if (bData.generalInfo) {
                            expenses.push([
                              "الموسم الرياضي",
                              bData.generalInfo.season || "-",
                            ]);
                            expenses.push([
                              "عدد اللاعبين المسجلين",
                              String(bData.generalInfo.playersCount || 0),
                            ]);
                          }
                          if (bData.baseExpenses) {
                            Object.entries(bData.baseExpenses).forEach(
                              ([k, v]: [string, any]) => {
                                const label = ARABIC_MAPPING[k] || k;
                                if (v.covered || v.value) {
                                  expenses.push([
                                    `${label} - ${v.covered ? "مغطاة" : "غير مغطاة"}`,
                                    `${v.value || 0} ${v.notes ? "- " + v.notes : ""}`,
                                  ]);
                                }
                              },
                            );
                          }
                          if (Array.isArray(bData.extraExpenses)) {
                            bData.extraExpenses.forEach((e: any) => {
                              if (e.name)
                                expenses.push([
                                  `بند إضافي: ${e.name}`,
                                  `${e.value || 0} ${e.notes ? "- " + e.notes : ""}`,
                                ]);
                            });
                          }

                          if (bData.baseIncomeSources) {
                            Object.entries(bData.baseIncomeSources).forEach(
                              ([k, v]: [string, any]) => {
                                const label = ARABIC_MAPPING[k] || k;
                                if (v.value)
                                  income.push([
                                    label,
                                    `${v.value || 0} ${v.notes ? "- " + v.notes : ""}`,
                                  ]);
                              },
                            );
                          }
                          if (Array.isArray(bData.extraIncomeSources)) {
                            bData.extraIncomeSources.forEach((e: any) => {
                              if (e.name)
                                income.push([
                                  `بند إضافي: ${e.name}`,
                                  `${e.value || 0} ${e.notes ? "- " + e.notes : ""}`,
                                ]);
                            });
                          }

                          // Find all files in bData
                          const filesFound: any[] = [];
                          const findFiles = (obj: any) => {
                            if (!obj) return;
                            if (typeof obj === "object") {
                              if (
                                obj.fileUrl ||
                                obj.downloadURL ||
                                obj.storagePath ||
                                obj.preview ||
                                (obj.name && obj.uploaded)
                              ) {
                                filesFound.push(obj);
                                return;
                              }
                              Object.values(obj).forEach(findFiles);
                            }
                          };
                          findFiles(bData);

                          return (
                            <div className="space-y-6">
                              <div className="flex items-center justify-between border-b border-[#E5DED0] pb-4">
                                <h4 className="font-black text-xl text-[#022C22]">
                                  {activeAxisDef?.name}
                                </h4>
                                <span className="px-3 py-1 bg-white border border-[#E5DED0] rounded-full text-xs font-bold">
                                  استكمال المتقدم:{" "}
                                  {bData.completionPercentage || 0}%
                                </span>
                              </div>

                              <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm">
                                <h5 className="font-bold text-[#064E3B] text-lg bg-[#064E3B]/5 px-4 py-2 rounded-lg mb-4">
                                  معلومات عامة للموسم
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-[#022C22]">
                                    اللاعبين المسجلين: <span className="text-[#C9A227]">{bData.generalInfo?.playersCount || "-"}</span>
                                  </div>
                                  <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold text-[#022C22]">
                                    الموسم الرياضي: <span className="text-[#C9A227]">{bData.generalInfo?.season || "-"}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm">
                                <h5 className="font-bold text-[#064E3B] text-lg bg-[#064E3B]/5 px-4 py-2 rounded-lg mb-4">
                                  المصاريف والتكاليف المباشرة
                                </h5>
                                <div className="space-y-4">
                                  {expenses.length > 0 ? (
                                    <table className="w-full text-sm text-right">
                                      <tbody>
                                        {expenses.map((e, idx) => (
                                          <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                                            <td className="py-3 px-2 font-bold text-gray-700 w-1/2">
                                              {e[0]}
                                            </td>
                                            <td className="py-3 px-2 text-[#022C22] font-mono font-bold" dir="ltr">
                                              <span className="text-red-600 mr-1">-</span>
                                              ${e[1]}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  ) : (
                                    <p className="text-center text-gray-400 py-4 font-bold text-sm">لم يتم إدخال مصاريف</p>
                                  )}
                                </div>
                              </div>

                              <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm">
                                <h5 className="font-bold text-[#064E3B] text-lg bg-[#064E3B]/5 px-4 py-2 rounded-lg mb-4">
                                  الإيرادات ومصادر الدخل
                                </h5>
                                <div className="space-y-4">
                                  {income.length > 0 ? (
                                    <table className="w-full text-sm text-right">
                                      <tbody>
                                        {income.map((e, idx) => (
                                          <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                                            <td className="py-3 px-2 font-bold text-gray-700 w-1/2">
                                              {e[0]}
                                            </td>
                                            <td className="py-3 px-2 text-[#022C22] font-mono font-bold" dir="ltr">
                                              <span className="text-green-600 mr-1">+</span>
                                              ${e[1]}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  ) : (
                                    <p className="text-center text-gray-400 py-4 font-bold text-sm">لم يتم إدخال إيرادات</p>
                                  )}
                                </div>
                              </div>

                              <div className="bg-[#022C22] p-6 rounded-xl text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex-1 text-center md:text-right border-b md:border-b-0 md:border-l border-white/10 pb-4 md:pb-0 md:pl-6">
                                  <p className="text-sm text-gray-400 font-bold mb-1">إجمالي المصاريف</p>
                                  <p className="text-2xl font-black text-red-400 font-mono" dir="ltr">
                                    ${bData.totalExpenses || 0}
                                  </p>
                                </div>
                                <div className="flex-1 text-center md:text-right border-b md:border-b-0 md:border-l border-white/10 pb-4 md:pb-0 md:pl-6">
                                  <p className="text-sm text-gray-400 font-bold mb-1">إجمالي الإيرادات</p>
                                  <p className="text-2xl font-black text-green-400 font-mono" dir="ltr">
                                    ${bData.totalIncome || 0}
                                  </p>
                                </div>
                                <div className="flex-1 text-center md:text-right">
                                  <p className="text-sm text-gray-400 font-bold mb-1">الرصيد الصافي</p>
                                  <p className={`text-3xl font-black font-mono ${Number(bData.balance) < 0 ? 'text-red-400' : 'text-[#C9A227]'}`} dir="ltr">
                                    ${bData.balance || 0}
                                  </p>
                                </div>
                              </div>

                              {bData.notes && (
                                <div className="bg-[#FFFDF7] p-6 rounded-xl border border-[#C9A227]/30 shadow-sm">
                                  <h4 className="font-bold text-[#022C22] mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#C9A227]">note</span>
                                    ملاحظات الأكاديمية التوضيحية
                                  </h4>
                                  <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                    {bData.notes}
                                  </p>
                                </div>
                              )}

                              {filesFound.length > 0 && (
                                <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm mb-6">
                                  <h5 className="font-bold text-[#064E3B] text-lg bg-[#064E3B]/5 px-4 py-2 rounded-lg mb-4">
                                    المستندات المالية المرفوعة
                                  </h5>
                                  <div className="flex flex-wrap gap-4">
                                    {filesFound.map((f, i) => (
                                      <div key={i} className="flex flex-col border border-gray-200 rounded-xl p-3 bg-gray-50 max-w-[280px] min-w-[200px]">
                                        <div className="flex items-center justify-between gap-3 mb-2">
                                          <span className="material-symbols-outlined text-gray-400 text-xl">description</span>
                                          <span className="text-sm font-bold text-[#022C22] flex-1 truncate text-right">
                                            {f.name || "مستند مالي"}
                                          </span>
                                        </div>
                                        <button
                                          onClick={(e) => handleFilePreview(e, "الميزانية - مستند إضافي", f.name || "مستند مالي", f)}
                                          className="text-xs w-full bg-white text-[#064E3B] border border-[#064E3B]/20 pt-2 pb-1.5 rounded-lg flex items-center justify-center gap-1 hover:bg-[#064E3B] hover:text-white transition-all font-bold shadow-sm h-8"
                                        >
                                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                                          عرض الملف
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm space-y-4">
                                <h4 className="font-bold text-[#022C22] text-lg border-b border-gray-100 pb-2">قرار المراجعة</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div className="md:col-span-1 border-l border-gray-100 pl-6">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">حالة المحور</label>
                                    <select
                                      value={currentReview.status}
                                      onChange={(e) => handleStatusChange(e.target.value)}
                                      className="w-full p-3 border border-gray-200 rounded-lg text-sm font-bold cursor-pointer focus:border-[#C9A227] outline-none"
                                    >
                                      <option>قيد المراجعة</option>
                                      <option>مقبول</option>
                                      <option>مرفوض</option>
                                      <option>بحاجة استكمال</option>
                                    </select>
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">ملاحظات وسبب القرار</label>
                                    <textarea
                                      value={currentReview.note}
                                      onChange={(e) => handleNoteChange(e.target.value)}
                                      placeholder="ملاحظات توضيحية للقرار..."
                                      className="w-full text-sm p-3 border border-gray-200 rounded-lg min-h-[100px] outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227]"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        } else if (
                          activeReviewAxis === "classificationA_facilities"
                        ) {
                          const fData = axisAnswerData || {};
                          const currentReview = adminReviews[
                            activeReviewAxis
                          ] || { status: "قيد المراجعة", note: "" };

                          const handleStatusChange = (status: string) => {
                            setAdminReviews((prev: any) => ({
                              ...prev,
                              [activeReviewAxis]: { ...currentReview, status },
                            }));
                          };
                          const handleNoteChange = (note: string) => {
                            setAdminReviews((prev: any) => ({
                              ...prev,
                              [activeReviewAxis]: { ...currentReview, note },
                            }));
                          };

                          const renderBox = (
                            label: string,
                            value: any,
                            type: "boolean" | "text" = "text",
                            fileObj?: any,
                            fileLabel?: string,
                            extraNotes?: string,
                          ) => {
                            return (
                              <div className="flex flex-col gap-3 p-4 border border-[#E5DED0] rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                <span className="font-bold text-[#022C22] text-sm leading-relaxed">
                                  {label}
                                </span>
                                {type === "boolean" ? (
                                  <span
                                    className={`px-3 py-1.5 rounded-lg text-sm font-bold w-fit border ${
                                      value === "نعم"
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : value === "كلا"
                                          ? "bg-red-50 text-red-700 border-red-200"
                                          : "bg-gray-100 text-gray-500 border-gray-200"
                                    }`}
                                  >
                                    {value || "غير محدد"}
                                  </span>
                                ) : (
                                  <div className="flex flex-col gap-1">
                                    <span className="text-gray-800 text-sm font-bold min-h-[28px] flex items-center">
                                      {value || "-"}
                                    </span>
                                  </div>
                                )}
                                {fileObj?.uploaded && (
                                  <button
                                    onClick={(e) =>
                                      handleFilePreview(
                                        e,
                                        fileLabel || label,
                                        academyData?.academyName || "",
                                        fileObj,
                                      )
                                    }
                                    className="mt-1 text-xs w-fit bg-white text-[#064E3B] border border-[#064E3B]/20 py-2 px-4 rounded-lg flex items-center justify-center gap-1 hover:bg-[#064E3B] hover:text-white transition-all font-bold shadow-sm"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">
                                      visibility
                                    </span>
                                    {fileObj.name || "عرض الملف المرفق"}
                                  </button>
                                )}
                              </div>
                            );
                          };

                          const ps = fData.pitchSpecifications || {};
                          const pcf = fData.playerCoachFacilities || {};
                          const sf = fData.supportingFacilities || {};
                          const pur = fData.pitchUsageRight || {};

                          return (
                            <div className="space-y-6">
                              <div className="flex items-center justify-between border-b border-[#E5DED0] pb-4">
                                <h4 className="font-black text-xl text-[#022C22]">
                                  {activeAxisDef?.name}
                                </h4>
                                <span className="px-3 py-1 bg-white border border-[#E5DED0] rounded-full text-xs font-bold shadow-sm">
                                  استكمال المتقدم:{" "}
                                  {fData.completionPercentage || 0}%
                                </span>
                              </div>

                              <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm">
                                <h5 className="font-bold text-[#064E3B] text-lg bg-[#064E3B]/5 px-4 py-2 rounded-lg mb-6 border-r-4 border-[#064E3B]">
                                  1. مواصفات الملعب
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {renderBox(
                                    "هل مساحة الملعب تلبي الحد الأدنى المطلوب أدناه (70×45 متر)؟",
                                    ps.hasMinimumPitchSize,
                                    "boolean",
                                  )}
                                  {ps.hasMinimumPitchSize === "نعم" &&
                                    renderBox(
                                      "المقاسات الفعلية للملعب",
                                      ps.actualPitchSize,
                                      "text",
                                    )}
                                  {renderBox(
                                    "ما هي جودة أرضية الملعب؟",
                                    ps.pitchSurfaceQuality,
                                    "text",
                                    ps.pitchSurfacePhoto,
                                    "صورة أرضية الملعب",
                                  )}
                                  {renderBox(
                                    "هل يوجد للملعب إضاءة صالحة للاستخدام لإقامة التدريبات والأنشطة ليلاً؟",
                                    ps.hasLighting,
                                    "boolean",
                                  )}
                                </div>
                              </div>

                              <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm">
                                <h5 className="font-bold text-[#064E3B] text-lg bg-[#064E3B]/5 px-4 py-2 rounded-lg mb-6 border-r-4 border-[#064E3B]">
                                  2. مرافق اللاعبين والأجهزة الفنية
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {renderBox(
                                    "هل توفر الأكاديمية غرف تبديل ملابس للاعبين مناسبة ونظيفة؟",
                                    pcf.hasChangingRooms,
                                    "boolean",
                                    pcf.changingRoomsPhotos,
                                    "صور غرف تبديل الملابس",
                                  )}
                                  {renderBox(
                                    "هل تتوفر دكك بدلاء للاعبين وللأجهزة الفنية مناسبة؟",
                                    pcf.hasTechnicalBenches,
                                    "boolean",
                                    pcf.technicalBenchesPhotos,
                                    "صور دكك البدلاء",
                                  )}
                                  {renderBox(
                                    "هل تتوفر نقطة إسعاف أولي مجهزة في المنشأة مع وجود خطة واضحة للإخلاء الطبي؟",
                                    pcf.hasFirstAidPoint,
                                    "boolean",
                                    pcf.firstAidPointPhotos,
                                    "صور نقطة الإسعاف",
                                  )}
                                </div>
                              </div>

                              <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm">
                                <h5 className="font-bold text-[#064E3B] text-lg bg-[#064E3B]/5 px-4 py-2 rounded-lg mb-6 border-r-4 border-[#064E3B]">
                                  3. التجهيزات والمرافق المساندة
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {renderBox(
                                    "هل يوجد مداخل مجهزة ومواقف سيارات آمنة؟",
                                    sf.hasParkingAccess,
                                    "boolean",
                                    sf.parkingAccessPhotos,
                                    "صور المداخل والمواقف",
                                  )}
                                  {renderBox(
                                    "هل تتوفر منطقة انتظار لأولياء الأمور مناسبة والخدمات المساندة (دورات مياه للمشاهدين)؟",
                                    sf.hasParentsWaitingArea,
                                    "boolean",
                                    sf.parentsWaitingAreaPhotos,
                                    "صور منطقة الانتظار",
                                  )}
                                  {renderBox(
                                    "هل تتوفر منطقة آمنة بفاصل بين الملعب والمشاهدين؟",
                                    sf.hasSafeViewingArea,
                                    "boolean",
                                    sf.safeViewingAreaPhotos,
                                    "صور منطقة المشاهدين الآمنة",
                                  )}
                                  {renderBox(
                                    "هل تتوفر نقطة إدارية لمكتب التسجيل وإدارة العمليات؟",
                                    sf.hasAdministrativePoint,
                                    "boolean",
                                    sf.administrativePointPhotos,
                                    "صور النقطة الإدارية",
                                  )}
                                </div>
                              </div>

                              <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm">
                                <h5 className="font-bold text-[#064E3B] text-lg bg-[#064E3B]/5 px-4 py-2 rounded-lg mb-6 border-r-4 border-[#064E3B]">
                                  4. حق استخدام الملاعب المطابقة للمواصفات
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {renderBox(
                                    "هل يُمنَح للموقع/أو يملك حق الاستخدام القانوني؟",
                                    pur.hasLegalUsageRight,
                                    "boolean",
                                  )}
                                  {pur.hasLegalUsageRight === "نعم" &&
                                    renderBox(
                                      "اسم ملعب التدريب والمباريات",
                                      pur.pitchName,
                                      "text",
                                    )}
                                  {pur.hasLegalUsageRight === "نعم" &&
                                    renderBox(
                                      "مدة حق استخدام الملعب بالأشهر",
                                      pur.pitchUsageDuration,
                                      "text",
                                    )}
                                  {renderBox(
                                    "هل تتوفر لديك 3 حصص تدريبية أسبوعياً كحد أدنى لكل فئة؟",
                                    pur.hasEnoughWeeklySessions,
                                    "boolean",
                                  )}
                                  {pur.hasEnoughWeeklySessions === "نعم" &&
                                    renderBox(
                                      "عدد الحصص المقررة لكل فئة في الأسبوع",
                                      pur.weeklySessionsPerAgeGroup,
                                      "text",
                                    )}
                                  {renderBox(
                                    "هل يمكن للملعب استضافة أو استقبال مباريات رسمية وفق الفئات السنية؟",
                                    pur.canHostOfficialMatches,
                                    "boolean",
                                  )}
                                  {renderBox(
                                    "نوع حق استخدام الملعب",
                                    pur.usageRightType,
                                    "text",
                                    pur.pitchUsageRightDocument,
                                    "وثيقة حق الاستخدام/الملكية",
                                  )}
                                </div>
                              </div>

                              <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm space-y-4">
                                <h4 className="font-bold text-[#022C22] text-lg border-b border-gray-100 pb-2">
                                  قرار المراجعة
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div className="md:col-span-1 border-l border-gray-100 pl-6">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                      حالة المحور
                                    </label>
                                    <select
                                      value={currentReview.status}
                                      onChange={(e) =>
                                        handleStatusChange(e.target.value)
                                      }
                                      className="w-full p-3 border border-gray-200 rounded-lg text-sm font-bold cursor-pointer focus:border-[#C9A227] outline-none"
                                    >
                                      <option>قيد المراجعة</option>
                                      <option>مقبول</option>
                                      <option>مرفوض</option>
                                      <option>بحاجة استكمال</option>
                                    </select>
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                      ملاحظات وسبب القرار
                                    </label>
                                    <textarea
                                      value={currentReview.note}
                                      onChange={(e) =>
                                        handleNoteChange(e.target.value)
                                      }
                                      placeholder="ملاحظات توضيحية للقرار..."
                                      className="w-full text-sm p-3 border border-gray-200 rounded-lg min-h-[100px] outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227]"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        } else if (
                          activeReviewAxis === "classificationA_safeguarding" ||
                          activeReviewAxis === "classificationA_health" ||
                          activeReviewAxis === "classificationA_equipment" ||
                          activeReviewAxis === "classificationA_social_media"
                        ) {
                          const axisData = axisAnswerData || {};
                          const currentReview = adminReviews[
                            activeReviewAxis
                          ] || { status: "قيد المراجعة", note: "" };

                          const handleStatusChange = (status: string) => {
                            setAdminReviews((prev: any) => ({
                              ...prev,
                              [activeReviewAxis]: { ...currentReview, status },
                            }));
                          };
                          const handleNoteChange = (note: string) => {
                            setAdminReviews((prev: any) => ({
                              ...prev,
                              [activeReviewAxis]: { ...currentReview, note },
                            }));
                          };

                          const renderBox = (
                            label: string,
                            valueObj: any,
                            fileObj?: any,
                            fileLabel?: string,
                          ) => {
                            if (!valueObj && !fileObj) return null;
                            const isBoolean =
                              valueObj?.type === "radio" ||
                              valueObj?.type === "checkbox" ||
                              valueObj?.type === "yes_no" ||
                              valueObj?.value === "نعم" ||
                              valueObj?.value === "كلا" ||
                              valueObj?.value === "yes" ||
                              valueObj?.value === "no";
                            
                            let valStr = valueObj?.value;
                            if (valueObj?.type === "checkbox") {
                              valStr = valueObj?.checked ? "نعم" : "كلا";
                            } else if (valueObj?.value === "yes") {
                              valStr = "نعم";
                            } else if (valueObj?.value === "no") {
                              valStr = "كلا";
                            }

                            return (
                              <div className="flex flex-col gap-3 p-4 border border-[#E5DED0] rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                <span className="font-bold text-[#022C22] text-sm leading-relaxed">
                                  {label}
                                </span>
                                {isBoolean ? (
                                  <span
                                    className={`px-3 py-1.5 rounded-lg text-sm font-bold w-fit border ${
                                      valStr === "نعم"
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : valStr === "كلا"
                                          ? "bg-red-50 text-red-700 border-red-200"
                                          : "bg-gray-100 text-gray-500 border-gray-200"
                                    }`}
                                  >
                                    {valStr || "غير محدد"}
                                  </span>
                                ) : (
                                  <div className="flex flex-col gap-1">
                                    <span className="text-gray-800 text-sm font-bold min-h-[28px] flex items-center break-all">
                                      {valStr || "-"}
                                    </span>
                                  </div>
                                )}
                                {fileObj?.uploaded && (
                                  <button
                                    onClick={(e) =>
                                      handleFilePreview(
                                        e,
                                        fileLabel || label,
                                        academyData?.academyName || "",
                                        fileObj,
                                      )
                                    }
                                    className="mt-1 text-xs w-fit bg-white text-[#064E3B] border border-[#064E3B]/20 py-2 px-4 rounded-lg flex items-center justify-center gap-1 hover:bg-[#064E3B] hover:text-white transition-all font-bold shadow-sm"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">
                                      visibility
                                    </span>
                                    {fileObj.name || "عرض الملف المرفق"}
                                  </button>
                                )}
                              </div>
                            );
                          };

                          let specificContent = null;
                          if (activeReviewAxis === "classificationA_safeguarding") {
                            specificContent = (
                              <>
                                <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm mb-6">
                                  <h5 className="font-bold text-[#064E3B] text-lg bg-[#064E3B]/5 px-4 py-2 rounded-lg mb-6 border-r-4 border-[#064E3B]">
                                    ميثاق السلوك وحماية الطفل
                                  </h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {renderBox("هل يوجد ميثاق سلوك مكتوب ومعتمد؟", axisData.behavior_charter_status, axisData.behavior_charter_doc, "ميثاق السلوك")}
                                    {renderBox("هل يشمل الميثاق اللاعبين؟", axisData.charter_includes_players)}
                                    {renderBox("هل يشمل الميثاق المدربين؟", axisData.charter_includes_coaches)}
                                    {renderBox("هل يشمل الميثاق الأهالي؟", axisData.charter_includes_parents)}
                                    {renderBox("هل تم التوقيع والاعتماد؟", null, axisData.charter_signed, "نسخة موقعة")}
                                    {renderBox("هل يتم شرح الميثاق قبل بداية الموسم؟", axisData.charter_explained)}
                                    {renderBox("هل توجد سياسة مكتوبة لحماية الطفل؟", axisData.cp_policy_status, axisData.cp_policy_doc, "سياسة حماية الطفل")}
                                    {renderBox("منع العنف والتنمر", axisData.cp_no_violence_status)}
                                    {renderBox("آلية وشخص مسؤول للإبلاغ", axisData.cp_reporting_mechanism_status, axisData.cp_reporting_mechanism_doc, "آلية الإبلاغ")}
                                  </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm mb-6">
                                  <h5 className="font-bold text-[#064E3B] text-lg bg-[#064E3B]/5 px-4 py-2 rounded-lg mb-6 border-r-4 border-[#064E3B]">
                                    التوعية والتواصل مع الأهالي
                                  </h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {renderBox("خطة ورش عمل للتوعية", axisData.workshop_plan_status)}
                                    {renderBox("سجلات حضور الورش", axisData.ws_attendance_doc_status, axisData.ws_attendance_doc, "سجل الحضور")}
                                    {renderBox("آلية تواصل وقنوات معتمدة", axisData.parent_comm_doc_status, axisData.parent_comm_doc, "نموذج التواصل")}
                                    {renderBox("التعامل مع شكاوى الأهالي", axisData.parent_complaints_confirm_status, axisData.parent_complaints_doc, "آلية الشكاوى")}
                                  </div>
                                </div>
                              </>
                            );
                          } else if (activeReviewAxis === "classificationA_health") {
                             specificContent = (
                              <>
                                <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm mb-6">
                                  <h5 className="font-bold text-[#064E3B] text-lg bg-[#064E3B]/5 px-4 py-2 rounded-lg mb-6 border-r-4 border-[#064E3B]">
                                    الجاهزية الطبية والسلامة
                                  </h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {renderBox("حقيبة إسعافات", axisData.first_aid_kit_status, axisData.first_aid_kit_file, "محتويات الحقيبة")}
                                    {renderBox("تواجد طبيب أو معالج", axisData.on_site_medic_status)}
                                    {renderBox("بروتوكول الإصابات", axisData.injury_protocol_status, axisData.injury_protocol_file, "البروتوكول")}
                                    {renderBox("خطة النقل الإسعافي للطوارئ", axisData.emergency_transport_status)}
                                    {renderBox("خطة التنظيف ونظافة المرافق", axisData.facility_cleaning_status, axisData.facility_cleaning_file, "خطة المنشأة")}
                                    {renderBox("تأمين صحي وبوليصة تأمين للاعبين", axisData.insurance_policy_status, axisData.insurance_policy, "وثيقة التأمين")}
                                    {renderBox("لائحة أسماء المشمولين بالتغطية", axisData.insured_players_list_status, axisData.insured_players_list, "لائحة اللاعبين")}
                                  </div>
                                </div>
                              </>
                            );
                          } else if (activeReviewAxis === "classificationA_equipment") {
                             specificContent = (
                              <>
                                <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm mb-6">
                                  <h5 className="font-bold text-[#064E3B] text-lg bg-[#064E3B]/5 px-4 py-2 rounded-lg mb-6 border-r-4 border-[#064E3B]">
                                    التجهيزات والمعدات
                                  </h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {renderBox("قميص موحد وأرقام", axisData.team_jersey_status, axisData.team_jersey_photo, "الطقم الموحد")}
                                    {renderBox("طقم حارس المرمى", axisData.goalkeeper_kit_status, axisData.goalkeeper_kit_photo, "طقم الحارس")}
                                    {renderBox("شعار الأكاديمية على القميص", axisData.jersey_logo_status, axisData.jersey_logo_photo, "الشعار")}
                                    {renderBox("كرات", axisData.balls_stock_status, axisData.balls_stock_photo, "صور الكرات")}
                                    {renderBox("أقماع وملحقات", axisData.cones_stock_status, axisData.cones_stock_photo, "صور الأقماع")}
                                    {renderBox("قمصان التدريب Bibs", axisData.bibs_stock_status, axisData.bibs_stock_photo, "صور قمصان التدريب")}
                                    {renderBox("مرمى وشباك صالحة مطابقة للمواصفات", axisData.goals_status, axisData.goals_photo, "المرمى والشباك")}
                                  </div>
                                </div>
                              </>
                            );
                          } else if (activeReviewAxis === "classificationA_social_media") {
                             specificContent = (
                              <>
                                <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm mb-6">
                                  <h5 className="font-bold text-[#064E3B] text-lg bg-[#064E3B]/5 px-4 py-2 rounded-lg mb-6 border-r-4 border-[#064E3B]">
                                    تواجد الأكاديمية الإعلامي والرقمي
                                  </h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {renderBox("وجود صفحة أو قناة تواصل معتمدة", axisData.has_official_page)}
                                    {axisData.has_official_page?.value === "yes" && (
                                       <div className="col-span-1 md:col-span-2">
                                          <p className="font-bold text-[#022C22] mb-2 text-sm">المنصات والروابط:</p>
                                          <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-xl border border-[#E5DED0]">
                                              {axisData.platforms && axisData.platforms.map((p: string) => (
                                                  <p key={p} className="text-sm border-b pb-2 mb-2 text-[#064E3B] font-medium last:border-0" dir="ltr text-left">
                                                    <span className="font-bold text-gray-500 mr-2">{p}:</span> 
                                                    {axisData.platformData && axisData.platformData[p] ? axisData.platformData[p] : "-"}
                                                  </p>
                                              ))}
                                          </div>
                                       </div>
                                    )}
                                    {renderBox("سياسة لإنشاء المحتوى خطة واضحة", axisData.content_plan_policy)}
                                    {renderBox("محتوى عن أنشطة الأكاديمية والمباريات", axisData.training_content_yesno)}
                                    {renderBox("التزام بالمحتوى التفاعلي وعدم إساءة", axisData.non_offensive_yesno)}
                                    {renderBox("مراجعة المحتوى قبل النشر", axisData.review_mechanism_yesno)}
                                    {renderBox("مراعاة حقوق الأطفال قانونيًا والتزام القواعد", axisData.legal_children_confirm)}
                                  </div>
                                </div>
                              </>
                            );
                          }

                          return (
                            <div className="space-y-6">
                              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                                <h4 className="font-black text-xl text-[#022C22]">
                                  {activeAxisDef?.name}
                                </h4>
                                <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-bold">
                                  استكمال المتقدم:{" "}
                                  {axisAnswerData.completionPercentage || 0}%
                                </span>
                              </div>

                              {specificContent}

                              <div className="bg-white p-6 rounded-xl border border-[#E5DED0] shadow-sm space-y-4">
                                <h4 className="font-bold text-[#022C22] text-lg border-b border-gray-100 pb-2">
                                  قرار المراجعة
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div className="md:col-span-1 border-l border-gray-100 pl-6">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                      حالة المحور
                                    </label>
                                    <select
                                      value={currentReview.status}
                                      onChange={(e) =>
                                        handleStatusChange(e.target.value)
                                      }
                                      className="w-full p-3 border border-gray-200 rounded-lg text-sm font-bold cursor-pointer focus:border-[#C9A227] outline-none"
                                    >
                                      <option>قيد المراجعة</option>
                                      <option>مقبول</option>
                                      <option>مرفوض</option>
                                      <option>بحاجة استكمال</option>
                                    </select>
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                      ملاحظات وسبب القرار
                                    </label>
                                    <textarea
                                      value={currentReview.note}
                                      onChange={(e) =>
                                        handleNoteChange(e.target.value)
                                      }
                                      placeholder="ملاحظات توضيحية للقرار..."
                                      className="w-full text-sm p-3 border border-gray-200 rounded-lg min-h-[100px] outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227]"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        const groupedKeys = rawKeys.reduce(
                          (acc, key) => {
                            const section = getSectionTitle(key);
                            if (!acc[section]) acc[section] = [];
                            acc[section].push(key);
                            return acc;
                          },
                          {} as Record<string, string[]>,
                        );

                        return (
                          <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                              <h4 className="font-black text-xl text-[#022C22]">
                                {activeAxisDef?.name}
                              </h4>
                              <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-bold">
                                استكمال المتقدم:{" "}
                                {axisAnswerData.completionPercentage || 0}%
                              </span>
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-gray-200">
                              <h5 className="font-bold text-[#022C22] text-lg mb-6 tracking-tight">
                                إجابات وتفاصيل المحور:
                              </h5>
                              <div className="flex flex-col gap-8">
                                {Object.entries(groupedKeys).map(
                                  ([sectionTitle, keysInSection]) => {
                                    let personSubtitle = null;
                                    if (
                                      activeReviewAxis ===
                                        "classificationA_leadership" ||
                                      activeReviewAxis ===
                                        "classificationB_leadership"
                                    ) {
                                      let matchingRole = "";
                                      if (sectionTitle === "مالك الأكاديمية")
                                        matchingRole = "owner";
                                      if (sectionTitle === "المدير الإداري")
                                        matchingRole = "administrativeManager";
                                      if (sectionTitle === "المشرف الفني")
                                        matchingRole = "technicalSupervisor";
                                      if (sectionTitle === "المشرف العام")
                                        matchingRole = "bGeneralSupervisor";

                                      if (matchingRole) {
                                        const matchingPerson =
                                          registryPeople.find(
                                            (p: any) =>
                                              p.roleKey === matchingRole ||
                                              (matchingRole === "owner" &&
                                                p.roleKey === "bOwner"),
                                          );
                                        if (matchingPerson) {
                                          personSubtitle = (
                                            <div className="flex items-center gap-2 text-sm text-gray-500 font-normal mt-1">
                                              <span>
                                                {matchingPerson.fullName}
                                              </span>
                                              {matchingPerson.nationality && (
                                                <span>
                                                  • {matchingPerson.nationality}
                                                </span>
                                              )}
                                            </div>
                                          );
                                        }
                                      }
                                    }

                                    return (
                                      <div key={sectionTitle}>
                                        <div className="mb-4 border-b border-[#E5DED0] pb-2">
                                          <h6 className="font-black text-[#022C22] text-md">
                                            {sectionTitle}
                                          </h6>
                                          {personSubtitle}
                                        </div>
                                        <div className="flex flex-col w-full border border-[#E5DED0] rounded-xl overflow-hidden bg-white shadow-sm">
                                          {keysInSection.map((k) => {
                                            const itemStatus =
                                              reviewData.itemStatuses?.[k] ||
                                              null;
                                            const val =
                                              axisAnswerData.files &&
                                              axisAnswerData.files[k]
                                                ? axisAnswerData.files[k]
                                                : axisAnswerData[k];
                                            const title = getFieldLabel(k);

                                            let answerBadge: React.ReactNode = (
                                              <span className="text-gray-500 text-xs">
                                                لم يتم تقديم هذا المتطلب
                                              </span>
                                            );
                                            let fileBtn: React.ReactNode = (
                                              <span className="text-gray-400 text-xs">
                                                —
                                              </span>
                                            );

                                            if (
                                              val !== undefined &&
                                              val !== null
                                            ) {
                                              const TECH_KEYS = [
                                                "type",
                                                "uploaded",
                                                "checked",
                                                "fileUrl",
                                                "downloadURL",
                                                "storagePath",
                                                "mimeType",
                                                "createdAt",
                                                "updatedAt",
                                                "id",
                                                "uid",
                                                "ownerId",
                                                "preview",
                                                "empty",
                                                "fromRegistry",
                                                "name",
                                                "fileName",
                                                "roleKey",
                                                "axisKey",
                                                "files",
                                                "fileObj",
                                                "completed",
                                              ];

                                              let fileRefs: any[] = [];
                                              let dataEntries: [
                                                string,
                                                string,
                                              ][] = [];

                                              const extract = (v: any) => {
                                                if (!v) return;
                                                if (
                                                  typeof v === "string" ||
                                                  typeof v === "number"
                                                ) {
                                                  dataEntries.push([
                                                    "القيمة",
                                                    String(v),
                                                  ]);
                                                  return;
                                                }
                                                if (typeof v === "boolean") {
                                                  dataEntries.push([
                                                    "القيمة",
                                                    v ? "نعم" : "لا",
                                                  ]);
                                                  return;
                                                }
                                                if (Array.isArray(v)) {
                                                  v.forEach((item, idx) => {
                                                    if (
                                                      typeof item ===
                                                        "object" &&
                                                      item !== null
                                                    ) {
                                                      if (
                                                        item.fileUrl ||
                                                        item.downloadURL ||
                                                        item.storagePath ||
                                                        item.preview ||
                                                        item.name
                                                      ) {
                                                        fileRefs.push(item);
                                                      } else {
                                                        Object.entries(
                                                          item,
                                                        ).forEach(
                                                          ([ik, iv]) => {
                                                            if (
                                                              TECH_KEYS.includes(
                                                                ik,
                                                              )
                                                            )
                                                              return;
                                                            dataEntries.push([
                                                              `${ARABIC_MAPPING[ik] || ik} (${idx + 1})`,
                                                              String(iv),
                                                            ]);
                                                          },
                                                        );
                                                      }
                                                    } else {
                                                      dataEntries.push([
                                                        `عنصر ${idx + 1}`,
                                                        String(item),
                                                      ]);
                                                    }
                                                  });
                                                  return;
                                                }
                                                if (
                                                  typeof v === "object" &&
                                                  v !== null
                                                ) {
                                                  if (
                                                    v.fileUrl ||
                                                    v.downloadURL ||
                                                    v.storagePath ||
                                                    v.preview ||
                                                    v.name ||
                                                    v.uploaded === true
                                                  ) {
                                                    if (
                                                      v.fileUrl ||
                                                      v.downloadURL ||
                                                      v.storagePath ||
                                                      v.preview ||
                                                      v.name
                                                    )
                                                      fileRefs.push(v);
                                                  }
                                                  Object.entries(v).forEach(
                                                    ([ik, iv]) => {
                                                      if (
                                                        TECH_KEYS.includes(ik)
                                                      )
                                                        return;
                                                      if (
                                                        ik === "file" ||
                                                        ik === "files" ||
                                                        ik === "photos" ||
                                                        ik === "documents" ||
                                                        ik ===
                                                          "uploadedFiles" ||
                                                        ik === "attachments"
                                                      ) {
                                                        if (Array.isArray(iv)) {
                                                          iv.forEach(
                                                            (f: any) => {
                                                              if (f)
                                                                fileRefs.push(
                                                                  f,
                                                                );
                                                            },
                                                          );
                                                        } else if (
                                                          typeof iv ===
                                                            "object" &&
                                                          iv !== null
                                                        ) {
                                                          if (
                                                            (iv as any)
                                                              .fileUrl ||
                                                            (iv as any)
                                                              .downloadURL ||
                                                            (iv as any)
                                                              .storagePath ||
                                                            (iv as any)
                                                              .preview ||
                                                            (iv as any).name
                                                          )
                                                            fileRefs.push(iv);
                                                          else
                                                            Object.values(
                                                              iv,
                                                            ).forEach(
                                                              (f: any) => {
                                                                if (
                                                                  f &&
                                                                  typeof f ===
                                                                    "object" &&
                                                                  (f.fileUrl ||
                                                                    f.downloadURL ||
                                                                    f.storagePath ||
                                                                    f.preview ||
                                                                    f.data ||
                                                                    f.name)
                                                                )
                                                                  fileRefs.push(
                                                                    f,
                                                                  );
                                                              },
                                                            );
                                                        }
                                                      } else if (
                                                        typeof iv ===
                                                          "object" &&
                                                        iv !== null
                                                      ) {
                                                        if (Array.isArray(iv)) {
                                                          iv.forEach((sub) =>
                                                            extract(sub),
                                                          );
                                                        } else {
                                                          extract(iv);
                                                        }
                                                      } else {
                                                        if (
                                                          iv !== "" &&
                                                          iv !== null &&
                                                          iv !== undefined
                                                        ) {
                                                          dataEntries.push([
                                                            ARABIC_MAPPING[
                                                              ik
                                                            ] || ik,
                                                            String(iv),
                                                          ]);
                                                        }
                                                      }
                                                    },
                                                  );
                                                }
                                              };

                                              extract(val);

                                              if (
                                                val.type === "checkbox" ||
                                                val === true ||
                                                val === false
                                              ) {
                                                const isChecked =
                                                  val.type === "checkbox"
                                                    ? val.checked
                                                    : val === true;
                                                const isEmpty =
                                                  val.type === "checkbox"
                                                    ? val.empty
                                                    : false;
                                                if (isEmpty) {
                                                  answerBadge = (
                                                    <span className="text-gray-500 text-xs">
                                                      لم يتم تقديم هذا المتطلب
                                                    </span>
                                                  );
                                                } else {
                                                  answerBadge = isChecked ? (
                                                    <span className="text-[#064E3B] bg-[#064E3B]/10 px-2 py-1 rounded inline-block border border-[#064E3B]/20 text-xs whitespace-nowrap">
                                                      نعم / تم التأكيد
                                                    </span>
                                                  ) : (
                                                    <span className="text-red-500 whitespace-nowrap text-xs">
                                                      لا / غير مكتمل
                                                    </span>
                                                  );
                                                }
                                              } else if (
                                                val.fromRegistry &&
                                                val.data
                                              ) {
                                                answerBadge = (
                                                  <span className="text-sm text-gray-800">
                                                    <span
                                                      dir="ltr"
                                                      className="ml-1 inline-block"
                                                    >
                                                      {val.data}
                                                    </span>{" "}
                                                    <span className="text-[#C9A227] bg-[#C9A227]/10 px-2 py-1 rounded inline-block border border-[#C9A227]/20 text-xs whitespace-nowrap font-bold">
                                                      مستخرج من السجل
                                                    </span>
                                                  </span>
                                                );
                                              } else if (val.fromRegistry) {
                                                answerBadge = (
                                                  <span className="text-[#C9A227] bg-[#C9A227]/10 px-2 py-1 rounded inline-block border border-[#C9A227]/20 text-xs font-bold whitespace-nowrap shrink-0">
                                                    مستخرج من السجل
                                                  </span>
                                                );
                                              } else if (
                                                dataEntries.length === 0 &&
                                                fileRefs.length > 0
                                              ) {
                                                answerBadge = (
                                                  <span className="text-[#064E3B] bg-[#064E3B]/10 px-2 py-1 rounded inline-block border border-[#064E3B]/20 text-xs font-bold whitespace-nowrap shrink-0">
                                                    مكتمل / تم الرفع
                                                  </span>
                                                );
                                              } else if (
                                                dataEntries.length === 0 &&
                                                !val.empty &&
                                                fileRefs.length === 0
                                              ) {
                                                answerBadge = (
                                                  <span className="text-gray-500 text-xs">
                                                    لم يتم تقديم هذا المتطلب
                                                  </span>
                                                );
                                              }

                                              if (
                                                dataEntries.length > 0 &&
                                                !(
                                                  val.type === "checkbox" &&
                                                  dataEntries.length === 1
                                                )
                                              ) {
                                                let filteredEntries =
                                                  dataEntries;
                                                if (dataEntries.length > 1) {
                                                  filteredEntries =
                                                    dataEntries.filter(
                                                      (e) => e[0] !== "القيمة",
                                                    );
                                                }
                                                const visibleEntries =
                                                  filteredEntries.slice(0, 20);
                                                answerBadge = (
                                                  <div className="flex flex-col gap-1 text-xs text-gray-800">
                                                    {visibleEntries.map(
                                                      (e, idx) => (
                                                        <div key={idx}>
                                                          <span className="text-gray-500 font-bold">
                                                            {e[0]}:
                                                          </span>{" "}
                                                          {e[1]}
                                                        </div>
                                                      ),
                                                    )}
                                                    {filteredEntries.length >
                                                      20 && (
                                                      <details className="mt-1 group">
                                                        <summary className="text-[#064E3B] font-bold text-[10px] underline cursor-pointer w-fit hover:text-[#C9A227] list-none">
                                                          عرض التفاصيل (
                                                          {filteredEntries.length -
                                                            20}
                                                          +)
                                                        </summary>
                                                        <div className="flex flex-col gap-1 bg-gray-50 p-2 rounded border border-gray-100 mt-2">
                                                          {filteredEntries
                                                            .slice(5)
                                                            .map((e, idx) => (
                                                              <div
                                                                key={idx + 5}
                                                              >
                                                                <span className="text-gray-500 font-bold">
                                                                  {e[0]}:
                                                                </span>{" "}
                                                                {e[1]}
                                                              </div>
                                                            ))}
                                                        </div>
                                                      </details>
                                                    )}
                                                  </div>
                                                );
                                              }

                                              if (fileRefs.length > 0) {
                                                fileBtn = (
                                                  <div className="flex flex-col gap-2 mx-auto justify-center">
                                                    {fileRefs.map((f, i) => (
                                                      <button
                                                        key={i}
                                                        onClick={(e) =>
                                                          handleFilePreview(
                                                            e,
                                                            title,
                                                            academyData?.academyName ||
                                                              "",
                                                            f,
                                                          )
                                                        }
                                                        className="inline-flex w-fit items-center gap-1.5 bg-white border border-[#E5DED0] hover:border-[#064E3B] text-[#064E3B] px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shadow-sm"
                                                      >
                                                        <span className="material-symbols-outlined text-[14px]">
                                                          visibility
                                                        </span>
                                                        {fileRefs.length > 1
                                                          ? `عرض الملف ${i + 1}`
                                                          : "عرض الملف"}
                                                      </button>
                                                    ))}
                                                  </div>
                                                );
                                              }
                                            }

                                            const statusIcon =
                                              itemStatus === "approved"
                                                ? "✅"
                                                : itemStatus === "declined"
                                                  ? "❌"
                                                  : "⏳";

                                            return (
                                              <div
                                                key={k}
                                                className={`py-4 md:py-5 px-4 md:px-5 border-b border-[#E5DED0] last:border-0 flex flex-col md:flex-row gap-4 md:gap-6 justify-between items-start transition-all ${itemStatus === "approved" ? "bg-green-50/40" : itemStatus === "declined" ? "bg-red-50/40" : "hover:bg-[#F6F1E7]/30"}`}
                                              >
                                                <div className="flex-1 flex flex-col gap-2">
                                                  <p className="font-bold text-[#022C22] text-sm leading-relaxed">
                                                    {title}
                                                  </p>
                                                  <div className="flex flex-wrap items-center gap-2 text-sm text-[#64748B]">
                                                    {answerBadge}
                                                  </div>
                                                </div>

                                                <div className="w-full md:w-auto shrink-0 flex flex-col items-end gap-3 min-w-[260px]">
                                                  <div className="flex items-center justify-end w-full">
                                                    {fileBtn}
                                                  </div>

                                                  <div className="flex flex-col gap-2 w-full pt-3 mt-1 border-t border-[#E5DED0]/50">
                                                    <div className="flex items-center justify-between">
                                                      <span className="text-xs font-bold text-gray-400">
                                                        قرار الإدارة:
                                                      </span>
                                                      <div className="flex items-center gap-1">
                                                        <button
                                                          onClick={() =>
                                                            setAdminReviews(
                                                              (r) => {
                                                                const currentAct =
                                                                  r[
                                                                    activeReviewAxis
                                                                  ] || {
                                                                    status:
                                                                      "قيد المراجعة",
                                                                    note: "",
                                                                  };
                                                                return {
                                                                  ...r,
                                                                  [activeReviewAxis]:
                                                                    {
                                                                      ...currentAct,
                                                                      itemStatuses:
                                                                        {
                                                                          ...(currentAct.itemStatuses ||
                                                                            {}),
                                                                          [k]:
                                                                            itemStatus ===
                                                                            "approved"
                                                                              ? null
                                                                              : "approved",
                                                                        },
                                                                    },
                                                                };
                                                              },
                                                            )
                                                          }
                                                          className={`px-2 py-1.5 flex items-center gap-1 text-xs font-bold rounded transition-colors ${itemStatus === "approved" ? "bg-green-100 text-green-700 shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600"}`}
                                                          title="قبول"
                                                        >
                                                          قبول
                                                        </button>
                                                        <button
                                                          onClick={() =>
                                                            setAdminReviews(
                                                              (r) => {
                                                                const currentAct =
                                                                  r[
                                                                    activeReviewAxis
                                                                  ] || {
                                                                    status:
                                                                      "قيد المراجعة",
                                                                    note: "",
                                                                  };
                                                                return {
                                                                  ...r,
                                                                  [activeReviewAxis]:
                                                                    {
                                                                      ...currentAct,
                                                                      itemStatuses:
                                                                        {
                                                                          ...(currentAct.itemStatuses ||
                                                                            {}),
                                                                          [k]:
                                                                            itemStatus ===
                                                                            "declined"
                                                                              ? null
                                                                              : "declined",
                                                                        },
                                                                    },
                                                                };
                                                              },
                                                            )
                                                          }
                                                          className={`px-2 py-1.5 flex items-center gap-1 text-xs font-bold rounded transition-colors ${itemStatus === "declined" ? "bg-red-100 text-red-700 shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600"}`}
                                                          title="رفض"
                                                        >
                                                          رفض
                                                        </button>
                                                      </div>
                                                    </div>
                                                    <input
                                                      type="text"
                                                      placeholder="ملاحظات..."
                                                      className="w-full text-xs p-2 rounded-lg bg-white border border-gray-200 outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227]/30 transition-all mt-2"
                                                      value={
                                                        (reviewData as any)
                                                          .itemNotes?.[k] || ""
                                                      }
                                                      onChange={(e) =>
                                                        setAdminReviews((r) => {
                                                          const currentAct = r[
                                                            activeReviewAxis
                                                          ] || {
                                                            status:
                                                              "قيد المراجعة",
                                                            note: "",
                                                          };
                                                          return {
                                                            ...r,
                                                            [activeReviewAxis]:
                                                              {
                                                                ...currentAct,
                                                                itemNotes: {
                                                                  ...(currentAct.itemNotes ||
                                                                    {}),
                                                                  [k]: e.target
                                                                    .value,
                                                                },
                                                              },
                                                          };
                                                        })
                                                      }
                                                    />
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  },
                                )}
                                {rawKeys.length === 0 && (
                                  <div className="text-center p-4 text-gray-400 text-sm">
                                    لا توجد إجابات مسجلة.
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                              <label className="text-sm font-bold text-gray-500 mb-2 block">
                                حالة المراجعة الإدارية (للمحور)
                              </label>
                              <select
                                id="review-status-select"
                                className="w-full p-3 rounded-xl border border-gray-200 font-bold outline-none focus:border-[#C9A227] bg-white transition-shadow shadow-sm"
                                value={reviewData.status}
                                onChange={(e) =>
                                  setAdminReviews((r) => ({
                                    ...r,
                                    [activeReviewAxis]: {
                                      ...reviewData,
                                      status: e.target.value,
                                    },
                                  }))
                                }
                              >
                                <option>قيد المراجعة</option>
                                <option>مقبول</option>
                                <option>مرفوض</option>
                                <option>بحاجة استكمال</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-sm font-bold text-gray-500 mb-2 block">
                                ملاحظات الإدارة المركزية على المحور (سيراها
                                المتقدم)
                              </label>
                              <textarea
                                id="review-note-input"
                                className="w-full p-4 rounded-xl border border-gray-200 font-bold outline-none focus:border-[#C9A227] h-32 bg-white transition-shadow shadow-sm"
                                placeholder="اكتب ملاحظاتك بشأن نقص المستندات في هذا المحور لتوجيه الأكاديمية..."
                                value={reviewData.note}
                                onChange={(e) =>
                                  setAdminReviews((r) => ({
                                    ...r,
                                    [activeReviewAxis]: {
                                      ...reviewData,
                                      note: e.target.value,
                                    },
                                  }))
                                }
                              ></textarea>
                            </div>
                            <div className="flex justify-end pt-4">
                              <button
                                onClick={() =>
                                  handleSaveAxisReview(
                                    activeReviewAxis,
                                    reviewData.status,
                                    reviewData.note,
                                    reviewData.itemStatuses,
                                    (reviewData as any).itemNotes,
                                  )
                                }
                                disabled={savingReview}
                                className="px-6 py-3 bg-[#064E3B] text-white font-black rounded-xl hover:bg-[#022C22] shadow-md transition-all flex items-center gap-2 group"
                              >
                                {savingReview ? (
                                  <span className="animate-pulse">
                                    جاري الحفظ...
                                  </span>
                                ) : (
                                  <>
                                    <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">
                                      save
                                    </span>
                                    حفظ التقييم للمحور
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "decision" && (
          <div className="space-y-6">
            <h3 className="text-xl font-black text-[#022C22] mb-4">
              القرار النهائي لملف الأكاديمية
            </h3>
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-sm font-bold text-gray-500 mb-2 block">
                    القرار الإداري للملف بالكامل
                  </label>
                  <select
                    className="w-full p-4 rounded-xl border border-gray-200 font-bold text-lg outline-none focus:border-[#064E3B] bg-white shadow-sm"
                    value={finalDecision}
                    onChange={(e) => setFinalDecision(e.target.value)}
                  >
                    <option>قيد المراجعة</option>
                    <option>بحاجة استكمال ملفات/تعليقات</option>
                    <option>مقبول (نموذج معتمد)</option>
                    <option>مرفوض</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-500 mb-2 block">
                    ملاحظات الإدارة للقرار النهائي (توجيه عام)
                  </label>
                  <textarea
                    className="w-full p-4 rounded-xl border border-gray-200 font-bold outline-none focus:border-[#064E3B] h-32 bg-white shadow-sm"
                    placeholder="هذا التعليق سيظهر كرسالة نهائية لممثل الأكاديمية..."
                    value={finalDecisionNote}
                    onChange={(e) => setFinalDecisionNote(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="mt-8 flex justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={handleFinalDecision}
                  disabled={savingReview}
                  className="px-8 py-4 bg-[#C9A227] text-[#022C22] font-black rounded-xl hover:bg-[#D4B145] hover:scale-105 shadow-xl shadow-[#C9A227]/20 transition-all flex items-center gap-2"
                >
                  {savingReview ? (
                    <div className="w-6 h-6 border-2 border-[#022C22] border-t-transparent rounded-full animate-spin mx-4"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">
                        gavel
                      </span>
                      اعتماد وتحديث قرار الاتحاد
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in duration-300">
            <button
              onClick={() => setSelectedPerson(null)}
              className="absolute top-6 left-6 p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="p-8">
              <div className="flex flex-col md:flex-row gap-8 items-start border-b border-gray-100 pb-8 mb-8">
                {selectedPerson.files?.profilePhoto?.downloadURL ||
                selectedPerson.files?.profilePhoto?.downloadUrl ||
                selectedPerson.files?.profilePhoto?.url ||
                selectedPerson.files?.profilePhoto?.data ||
                selectedPerson.files?.profilePhoto?.preview ? (
                  <div className="w-40 h-40 rounded-2xl overflow-hidden shadow-md shrink-0 border border-gray-200 bg-gray-50 flex items-center justify-center">
                    <img
                      src={
                        selectedPerson.files.profilePhoto.downloadURL ||
                        selectedPerson.files.profilePhoto.downloadUrl ||
                        selectedPerson.files.profilePhoto.url ||
                        selectedPerson.files.profilePhoto.data ||
                        selectedPerson.files.profilePhoto.preview
                      }
                      alt={selectedPerson.fullName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.parentElement!.innerHTML =
                          '<span class="material-symbols-outlined text-6xl text-gray-300">person</span>';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-40 h-40 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
                    <span className="material-symbols-outlined text-6xl text-gray-300">
                      person
                    </span>
                  </div>
                )}

                <div className="flex-1 w-full">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#064E3B]/10 text-[#064E3B] rounded-lg text-sm font-bold mb-4">
                    <span className="material-symbols-outlined text-[16px]">
                      badge
                    </span>
                    {selectedPerson.roleLabel || selectedPerson.roleKey}
                  </div>
                  <h2 className="text-3xl font-black text-[#022C22] mb-6">
                    {selectedPerson.fullName || "الاسم غير متوفر"}
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                    {selectedPerson.dateOfBirth && (
                      <div>
                        <span className="block text-xs font-bold text-gray-400 mb-1">
                          تاريخ الميلاد
                        </span>
                        <span className="font-bold text-gray-800">
                          {selectedPerson.dateOfBirth}
                        </span>
                      </div>
                    )}
                    {selectedPerson.nationality && (
                      <div>
                        <span className="block text-xs font-bold text-gray-400 mb-1">
                          الجنسية
                        </span>
                        <span className="font-bold text-gray-800">
                          {selectedPerson.nationality}
                        </span>
                      </div>
                    )}
                    {(selectedPerson.phone || selectedPerson.phoneNum) && (
                      <div>
                        <span className="block text-xs font-bold text-gray-400 mb-1">
                          الهاتف
                        </span>
                        <span className="font-bold text-gray-800 dir-ltr">
                          {selectedPerson.phoneCode}{" "}
                          {selectedPerson.phone || selectedPerson.phoneNum}
                        </span>
                      </div>
                    )}
                    {selectedPerson.email && (
                      <div>
                        <span className="block text-xs font-bold text-gray-400 mb-1">
                          الإيميل
                        </span>
                        <span className="font-bold text-gray-800">
                          {selectedPerson.email}
                        </span>
                      </div>
                    )}
                    {selectedPerson.certificateType && (
                      <div>
                        <span className="block text-xs font-bold text-gray-400 mb-1">
                          مستوى الشهادة
                        </span>
                        <span className="font-bold text-gray-800">
                          {selectedPerson.certificateType}
                        </span>
                      </div>
                    )}
                    {selectedPerson.ageCategory && (
                      <div>
                        <span className="block text-xs font-bold text-gray-400 mb-1">
                          الفئة العمرية التدريبية
                        </span>
                        <span className="font-bold text-gray-800 font-mono">
                          {selectedPerson.ageCategory}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black text-[#022C22] mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#C9A227]">
                    folder_open
                  </span>
                  المرفقات والملفات
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(FILE_KEYS).map(([key, label]) => {
                    const fileObj = selectedPerson.files?.[key];
                    if (!fileObj?.uploaded) return null;
                    const href =
                      fileObj.downloadURL ||
                      fileObj.fileUrl ||
                      fileObj.data ||
                      fileObj.preview;
                    const displayHref =
                      href || (fileObj.storagePath ? "missing" : "missing");
                    const pReview =
                      adminReviews[`registry_${selectedPerson.id}`] || {};
                    const fileStatus = pReview.fileStatuses?.[key] || null;

                    return (
                      <div
                        key={key}
                        className={`flex flex-col p-4 rounded-xl border transition-colors ${fileStatus === "approved" ? "bg-green-50 border-green-200" : fileStatus === "declined" ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-100 hover:bg-gray-100"}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span
                              className={`material-symbols-outlined ${fileStatus === "approved" ? "text-green-500" : fileStatus === "declined" ? "text-red-500" : "text-gray-400"}`}
                            >
                              description
                            </span>
                            <span className="font-bold text-sm text-gray-700">
                              {label}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) =>
                                handleFilePreview(
                                  e,
                                  label,
                                  selectedPerson.fullName || "",
                                  fileObj,
                                )
                              }
                              className="w-8 h-8 rounded-lg bg-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-300 transition-colors shrink-0"
                              title={`عرض ${label}`}
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                visibility
                              </span>
                            </button>
                            {href && (
                              <a
                                href={href}
                                download={`${label}_${selectedPerson.fullName}`}
                                className="w-8 h-8 rounded-lg bg-[#064E3B] text-white flex items-center justify-center hover:bg-[#022C22] transition-colors shrink-0"
                                title={`تحميل ${label}`}
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  download
                                </span>
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-auto">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveFileReview(
                                selectedPerson.id,
                                key,
                                "approved",
                              );
                            }}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold font-sans flex items-center justify-center gap-1 transition-colors ${fileStatus === "approved" ? "bg-green-600 text-white" : "bg-white border text-green-700 hover:bg-green-50"}`}
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              check
                            </span>{" "}
                            قبول
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveFileReview(
                                selectedPerson.id,
                                key,
                                "declined",
                              );
                            }}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold font-sans flex items-center justify-center gap-1 transition-colors ${fileStatus === "declined" ? "bg-red-600 text-white" : "bg-white border text-red-700 hover:bg-red-50"}`}
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              close
                            </span>{" "}
                            رفض
                          </button>
                          {fileStatus && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveFileReview(
                                  selectedPerson.id,
                                  key,
                                  null,
                                );
                              }}
                              className="p-1.5 rounded-lg border bg-white text-gray-500 hover:bg-gray-100 flex items-center justify-center"
                              title="إلغاء المراجعة"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                remove
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {!selectedPerson.files ||
                  Object.keys(selectedPerson.files).filter(
                    (k) => selectedPerson.files[k]?.uploaded,
                  ).length === 0 ? (
                    <div className="col-span-full p-6 text-center text-gray-400 font-bold bg-gray-50 rounded-xl border border-gray-100 line-dashed">
                      لا يوجد ملفات مرفوعة
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 shrink-0">
              <h3 className="font-black text-[#022C22] text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-[#C9A227]">
                  visibility
                </span>
                {previewFile.title}
              </h3>
              <div className="flex items-center gap-2">
                {previewFile.url !== "missing" && previewFile.url !== "loading" && (
                  <button
                    onClick={() => triggerBlobDownload(
                      previewFile.url,
                      previewFile.downloadUrl || previewFile.url,
                      previewFile.fileObj?.name || previewFile.fileObj?.originalName || previewFile.title || "file"
                    )}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 text-gray-700 hover:bg-[#064E3B] hover:text-white transition-colors"
                    title="تحميل"
                  >
                    <span className="material-symbols-outlined">download</span>
                  </button>
                )}
                <button
                  onClick={() => setPreviewFile(null)}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 text-gray-500 hover:bg-red-500 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            <div className="p-4 overflow-auto flex-1 flex flex-col items-center justify-center bg-gray-100/50 min-h-[300px]">
              {previewFile.url === "loading" ? (
                <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100 max-w-sm w-full min-w-[280px] sm:min-w-[320px] mx-auto">
                  <div className="w-12 h-12 border-4 border-[#064E3B] border-t-transparent rounded-full animate-spin mb-4"></div>
                  <h4 className="font-bold text-gray-800">
                    جاري تحميل الملف...
                  </h4>
                  <p className="text-sm text-gray-500 mt-2">
                    يرجى الانتظار قليلاً
                  </p>
                </div>
              ) : previewFile.url === "missing" ? (
                <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100 max-w-sm w-full min-w-[280px] sm:min-w-[320px] mx-auto">
                  <h4 className="font-bold text-gray-800 mb-2">
                    تعذر معاينة هذا الملف لأن رابط الملف غير محفوظ. يرجى إعادة
                    رفع الملف.
                  </h4>
                </div>
              ) : (
                (() => {
                  const url = previewFile.url || "";
                  const finalKind = previewFile.detectedKind || "unknown";

                  const isImage = finalKind === "image";
                  const isPdf = finalKind === "pdf";

                  const isVideo =
                    url.startsWith("data:video/") ||
                    url.match(/\.(mp4|webm|ogg)(\?.*)?$/i);

                  const isOffice = url.match(
                    /\.(doc|docx|xls|xlsx|ppt|pptx)(\?.*)?$/i,
                  );

                  if (isImage) {
                    return (
                      <img
                        src={url}
                        alt={previewFile.title}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          if (e.currentTarget.parentElement) {
                            e.currentTarget.parentElement.innerHTML =
                              '<div class="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100 max-w-sm w-full min-w-[280px] sm:min-w-[320px] mx-auto"><h4 class="font-bold text-gray-800 mb-2">تعذر تحميل الصورة. يرجى فتح الملف في نافذة جديدة أو إعادة رفعه.</h4></div>';
                          }
                        }}
                      />
                    );
                  }

                  if (isPdf) {
                    const filename = previewFile.fileObj?.name || previewFile.fileObj?.originalName || previewFile.title || "file.pdf";
                    return (
                      <div className="w-full h-full flex flex-col gap-3" dir="rtl">
                        {/* Action buttons */}
                        <div className="flex items-center justify-center gap-3 shrink-0">
                          <button
                            onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                            className="inline-flex items-center gap-2 bg-[#064E3B] text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-[#022C22] transition-colors shadow"
                          >
                            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                            فتح في نافذة جديدة
                          </button>
                          <button
                            onClick={() => triggerBlobDownload(url, previewFile.downloadUrl || url, filename)}
                            className="inline-flex items-center gap-2 bg-gray-200 text-gray-700 px-5 py-2 rounded-lg font-bold text-sm hover:bg-gray-300 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">download</span>
                            تحميل
                          </button>
                        </div>
                        {/*
                          PDF.js renders each page to <canvas>.
                          This bypasses Chrome's PDF plugin which refuses
                          to render inside <iframe> (any URL type).
                        */}
                        <div className="flex-1 overflow-y-auto">
                          <PdfViewer src={url} />
                        </div>
                      </div>
                    );
                  }

                  const isDoc = finalKind === "doc";
                  if (isDoc) {
                    const docFilename = previewFile.fileObj?.name || previewFile.fileObj?.originalName || previewFile.title || "file.docx";
                    const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(previewFile.downloadUrl || url)}&embedded=true`;
                    return (
                      <div className="w-full h-full flex flex-col gap-3" dir="rtl">
                        <div className="flex items-center justify-center gap-3 shrink-0">
                          <button
                            onClick={() => triggerBlobDownload(url, previewFile.downloadUrl || url, docFilename)}
                            className="inline-flex items-center gap-2 bg-[#064E3B] text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-[#022C22] transition-colors shadow"
                          >
                            <span className="material-symbols-outlined text-[18px]">download</span>
                            تحميل الملف
                          </button>
                        </div>
                        <iframe
                          src={viewerUrl}
                          className="w-full flex-1 min-h-[480px] border-0 rounded-lg shadow-sm"
                          title={previewFile.title}
                        />
                      </div>
                    );
                  }

                  if (isVideo) {
                    return (
                      <video
                        src={url}
                        controls
                        className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                      />
                    );
                  }

                  if (
                    isOffice &&
                    !url.startsWith("data:") &&
                    !url.startsWith("blob:")
                  ) {
                    const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(previewFile.downloadUrl || url)}&embedded=true`;
                    return (
                      <iframe
                        src={viewerUrl}
                        className="w-full h-full min-h-[500px] border-0 rounded-lg shadow-sm"
                        title={previewFile.title}
                      />
                    );
                  }

                  // Unknown type but we have a URL — offer open/download
                  const hasValidUrl = url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:');
                  return (
                    <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100 max-w-sm w-full min-w-[280px] sm:min-w-[320px] mx-auto" dir="rtl">
                      <span className="material-symbols-outlined text-[48px] text-[#C9A227] mb-4 block">
                        description
                      </span>
                      <h4 className="font-bold text-gray-800 mb-2">
                        {hasValidUrl ? 'الملف جاهز للفتح أو التحميل' : 'تعذر معاينة الملف — رابط الملف غير متوفر'}
                      </h4>
                      {hasValidUrl && (
                        <p className="text-sm text-gray-500 mb-6">
                          اضغط على الزر أدناه لفتح الملف في نافذة جديدة
                        </p>
                      )}
                      <a
                        href={previewFile.downloadUrl || url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#064E3B] text-white px-6 py-2.5 rounded-lg hover:bg-[#022C22] transition-colors font-bold"
                      >
                        <span className="material-symbols-outlined">
                          open_in_new
                        </span>
                        فتح / تحميل الملف
                      </a>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-4xl text-red-600">warning</span>
              </div>
              <h3 className="text-xl font-bold text-center text-[#022C22] mb-2">تأكيد حذف الحساب</h3>
              <p className="text-center text-[#64748B] mb-6">
                هل أنت متأكد من حذف أكاديمية <span className="font-bold text-red-600">"{academyData?.academyName}"</span> نهائياً؟ 
                سيؤدي هذا إلى مسح جميع البيانات المتعلقة بالأكاديمية ولا يمكن التراجع عنه.
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleDeleteAcademy}
                  disabled={isDeleting}
                  className="w-full py-3.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isDeleting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">sync</span>
                      جاري الحذف...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                      نعم، احذف الحساب نهائياً
                    </>
                  )}
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="w-full py-3.5 bg-gray-100 text-[#022C22] rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-70"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
