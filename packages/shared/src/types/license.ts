export enum LicenseTier {
  Essential = "Essential",
  Advanced = "Advanced",
  UltimateIQ = "UltimateIQ",
}

export type UpgradePath =
  | "Essential→Advanced"
  | "Essential→UltimateIQ"
  | "Advanced→UltimateIQ";

export const UPGRADE_PATHS: UpgradePath[] = [
  "Essential→Advanced",
  "Essential→UltimateIQ",
  "Advanced→UltimateIQ",
];
