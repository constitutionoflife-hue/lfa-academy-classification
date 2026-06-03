
import { appStorage } from "./appStorage";

export const isApplicationStarted = (): boolean => {
  const manualStarted = appStorage.getItem("applicationStarted") === "true";
  if (manualStarted) return true;

  const axisKeys = [
    "classificationA_leadership",
    "classificationA_planning",
    "classificationA_organization",
    "classificationA_technical",
    "classificationA_budget",
    "classificationA_facilities",
    "classificationA_health",
    "classificationA_safeguarding",
    "classificationA_equipment",
    "classificationA_social_media",
    "classificationB_leadership",
    "classificationB_planning",
    "classificationB_organization",
    "classificationB_technical",
    "classificationB_facilities",
    "classificationB_care",
    "classificationB_equipment"
  ];

  for (const key of axisKeys) {
    const data = appStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) return true;
      } catch (e) {
        // Fallback for non-JSON or corrupted
        if (data.length > 2) return true;
      }
    }
  }

  return false;
};

export const setApplicationStarted = (status: boolean = true) => {
  appStorage.setItem("applicationStarted", status ? "true" : "false");
};

export const updateLastAxis = (route: string) => {
  appStorage.setItem("lastOpenedAxis", route);
  setApplicationStarted(true);
};
