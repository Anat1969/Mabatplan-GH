// MABAT standard defaults by land use zone type
export const ZONE_DEFAULTS = {
  residential_a: {
    label: "מגורים א׳ (צמודי קרקע)",
    building_rights_percent: 60,
    max_floors: 2,
    max_height: 9,
    front_setback: 4,
    side_setback: 3,
    rear_setback: 3,
    parking_ratio: 1,
    green_area_percent: 30,
  },
  residential_b: {
    label: "מגורים ב׳ (בנייה רוויה)",
    building_rights_percent: 120,
    max_floors: 8,
    max_height: 25,
    front_setback: 5,
    side_setback: 4,
    rear_setback: 4,
    parking_ratio: 1.5,
    green_area_percent: 25,
  },
  residential_c: {
    label: "מגורים ג׳ (מגדלים)",
    building_rights_percent: 200,
    max_floors: 20,
    max_height: 65,
    front_setback: 8,
    side_setback: 6,
    rear_setback: 6,
    parking_ratio: 1.8,
    green_area_percent: 30,
  },
  commercial: {
    label: "מסחרי",
    building_rights_percent: 150,
    max_floors: 4,
    max_height: 16,
    front_setback: 0,
    side_setback: 0,
    rear_setback: 4,
    parking_ratio: 2.5,
    green_area_percent: 10,
  },
  office: {
    label: "משרדים",
    building_rights_percent: 180,
    max_floors: 12,
    max_height: 42,
    front_setback: 5,
    side_setback: 4,
    rear_setback: 4,
    parking_ratio: 2,
    green_area_percent: 15,
  },
  industrial: {
    label: "תעשייה",
    building_rights_percent: 80,
    max_floors: 3,
    max_height: 15,
    front_setback: 6,
    side_setback: 4,
    rear_setback: 4,
    parking_ratio: 1.5,
    green_area_percent: 10,
  },
  public_building: {
    label: "מבנה ציבורי",
    building_rights_percent: 100,
    max_floors: 4,
    max_height: 16,
    front_setback: 5,
    side_setback: 4,
    rear_setback: 4,
    parking_ratio: 1,
    green_area_percent: 25,
  },
  open_space: {
    label: "שטח ציבורי פתוח",
    building_rights_percent: 5,
    max_floors: 1,
    max_height: 4,
    front_setback: 0,
    side_setback: 0,
    rear_setback: 0,
    parking_ratio: 0,
    green_area_percent: 80,
  },
  mixed_use: {
    label: "שימוש מעורב",
    building_rights_percent: 160,
    max_floors: 10,
    max_height: 35,
    front_setback: 0,
    side_setback: 3,
    rear_setback: 4,
    parking_ratio: 1.8,
    green_area_percent: 20,
  },
  tourism: {
    label: "תיירות ומלונאות",
    building_rights_percent: 140,
    max_floors: 8,
    max_height: 28,
    front_setback: 6,
    side_setback: 5,
    rear_setback: 5,
    parking_ratio: 0.8,
    green_area_percent: 25,
  },
};

export const ZONE_TYPES = Object.entries(ZONE_DEFAULTS).map(([key, val]) => ({
  value: key,
  label: val.label,
}));

export const STANDARD_ATTACHMENTS = [
  { name: "תשריט תוכנית", type: "plan_drawing", required: true },
  { name: "נספח בינוי", type: "building_appendix", required: true },
  { name: "נספח תנועה וחניה", type: "traffic", required: true },
  { name: "נספח תשתיות", type: "infrastructure", required: true },
  { name: "נספח נוף", type: "landscape", required: false },
  { name: "סקר סביבתי", type: "environmental", required: false },
  { name: "חוות דעת אקוסטית", type: "acoustic", required: false },
  { name: "נספח ניקוז", type: "drainage", required: true },
  { name: "סקר עצים", type: "tree_survey", required: false },
  { name: "תסקיר השפעה על הסביבה", type: "eia", required: false },
];

export function calculateCompletionScore(project, regulation) {
  const fields = [];

  // Project fields
  fields.push(!!project?.plan_name);
  fields.push(!!project?.plan_number);
  fields.push(!!project?.block);
  fields.push(!!project?.parcel);
  fields.push(!!project?.plan_type);

  // Regulation fields
  fields.push(regulation?.land_use?.length > 0);
  fields.push(regulation?.building_rights_percent > 0);
  fields.push(regulation?.max_floors > 0);
  fields.push(regulation?.max_height > 0);
  fields.push(regulation?.front_setback != null && regulation?.front_setback !== "");
  fields.push(regulation?.side_setback != null && regulation?.side_setback !== "");
  fields.push(regulation?.rear_setback != null && regulation?.rear_setback !== "");
  fields.push(regulation?.parking_ratio != null && regulation?.parking_ratio !== "");
  fields.push(regulation?.green_area_percent != null && regulation?.green_area_percent !== "");
  fields.push(!!regulation?.special_instructions);

  // Attachments
  const requiredAttachments = STANDARD_ATTACHMENTS.filter((a) => a.required);
  const includedRequired = (regulation?.attachments || []).filter(
    (a) => a.included && requiredAttachments.some((ra) => ra.type === a.type)
  );
  fields.push(includedRequired.length >= requiredAttachments.length);

  const completed = fields.filter(Boolean).length;
  return Math.round((completed / fields.length) * 100);
}

export function getMissingFields(project, regulation) {
  const missing = [];

  if (!project?.plan_name) missing.push({ field: "plan_name", label: "שם התוכנית", severity: "error" });
  if (!project?.plan_number) missing.push({ field: "plan_number", label: "מספר תוכנית", severity: "error" });
  if (!project?.block) missing.push({ field: "block", label: "גוש", severity: "error" });
  if (!project?.parcel) missing.push({ field: "parcel", label: "חלקה", severity: "error" });
  if (!project?.plan_type) missing.push({ field: "plan_type", label: "סוג תוכנית", severity: "error" });
  if (!regulation?.land_use?.length) missing.push({ field: "land_use", label: "ייעודי קרקע", severity: "error" });
  if (!regulation?.building_rights_percent) missing.push({ field: "building_rights_percent", label: "אחוזי בנייה", severity: "error" });
  if (!regulation?.max_floors) missing.push({ field: "max_floors", label: "מספר קומות", severity: "error" });
  if (!regulation?.max_height) missing.push({ field: "max_height", label: "גובה מרבי", severity: "error" });
  if (regulation?.front_setback == null) missing.push({ field: "front_setback", label: "קו בניין קדמי", severity: "warning" });
  if (regulation?.side_setback == null) missing.push({ field: "side_setback", label: "קו בניין צידי", severity: "warning" });
  if (regulation?.rear_setback == null) missing.push({ field: "rear_setback", label: "קו בניין אחורי", severity: "warning" });
  if (!regulation?.special_instructions) missing.push({ field: "special_instructions", label: "הוראות מיוחדות", severity: "warning" });

  const requiredAttachments = STANDARD_ATTACHMENTS.filter((a) => a.required);
  const included = (regulation?.attachments || []).filter((a) => a.included).map((a) => a.type);
  requiredAttachments.forEach((att) => {
    if (!included.includes(att.type)) {
      missing.push({ field: att.type, label: `נספח: ${att.name}`, severity: "warning" });
    }
  });

  return missing;
}