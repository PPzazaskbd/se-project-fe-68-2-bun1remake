import type { HotelItem } from "@/interface";

export type HotelImageStatus = "idle" | "loading" | "loaded" | "error";
export type HotelFormTab = "image" | "info" | "tag";

export type HotelValidationField =
  | "imgSrc"
  | "name"
  | "address"
  | "district"
  | "province"
  | "postalcode"
  | "region"
  | "tel"
  | "description"
  | "price";

type HotelFormValue = Partial<
  Pick<HotelItem, HotelValidationField>
>;

interface HotelValidationIssue {
  field: HotelValidationField;
  kind: "missing" | "invalid" | "waiting";
  message: string;
  tab: HotelFormTab;
}

export interface HotelValidationResult {
  isValid: boolean;
  issues: HotelValidationIssue[];
  invalidFields: HotelValidationField[];
  firstInvalidTab: HotelFormTab | null;
}

export const HOTEL_FIELD_LABELS: Record<HotelValidationField, string> = {
  imgSrc: "Hotel Photo",
  name: "Hotel Name",
  address: "Address",
  district: "District",
  province: "Province",
  postalcode: "Postal Code",
  region: "Region",
  tel: "Telephone",
  description: "Description",
  price: "Price/night",
};

const REQUIRED_TEXT_FIELDS: HotelValidationField[] = [
  "name",
  "address",
  "district",
  "province",
  "postalcode",
  "region",
  "tel",
  "description",
];

function hasText(value: unknown) {
  return String(value ?? "").trim().length > 0;
}

export function validateHotelForm(
  form: HotelFormValue,
  imageStatus: HotelImageStatus,
): HotelValidationResult {
  const issues: HotelValidationIssue[] = [];
  const imgSrc = String(form.imgSrc ?? "").trim();

  if (!imgSrc) {
    issues.push({
      field: "imgSrc",
      kind: "missing",
      message: "Hotel Photo is required.",
      tab: "image",
    });
  } else if (imageStatus === "loading") {
    issues.push({
      field: "imgSrc",
      kind: "waiting",
      message: "Please wait for the hotel photo to finish loading.",
      tab: "image",
    });
  } else if (imageStatus !== "loaded") {
    issues.push({
      field: "imgSrc",
      kind: "invalid",
      message: "Hotel Photo must be a valid image URL.",
      tab: "image",
    });
  }

  REQUIRED_TEXT_FIELDS.forEach((field) => {
    if (!hasText(form[field])) {
      issues.push({
        field,
        kind: "missing",
        message: `${HOTEL_FIELD_LABELS[field]} is required.`,
        tab: "info",
      });
    }
  });

  if (Number(form.price ?? 0) <= 0) {
    issues.push({
      field: "price",
      kind: "invalid",
      message: "Price/night must be greater than 0.",
      tab: "info",
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
    invalidFields: issues.map((issue) => issue.field),
    firstInvalidTab: issues[0]?.tab ?? null,
  };
}

export function formatHotelValidationMessages(result: HotelValidationResult) {
  const waitIssue = result.issues.find((issue) => issue.kind === "waiting");

  if (waitIssue) {
    return [waitIssue.message];
  }

  return result.issues.map((issue) => issue.message);
}
