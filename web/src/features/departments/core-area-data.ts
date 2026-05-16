import {
  canonicalAssetsPath,
  canonicalGeneralDashboardPath,
  canonicalOperationsPath
} from "../../app-route-registry";
import { CoreArea } from "../../types";

export const coreAreas: CoreArea[] = [
  {
    key: "00-ogolny",
    labelKey: "areas.00.label",
    eyebrowKey: "areas.00.eyebrow",
    href: canonicalGeneralDashboardPath,
    descriptionKey: "areas.00.description",
    icon: "ph-map-trifold"
  },
  {
    key: "04-operacje",
    labelKey: "areas.04.label",
    eyebrowKey: "areas.04.eyebrow",
    href: canonicalOperationsPath,
    descriptionKey: "areas.04.description",
    icon: "ph-list-checks"
  },
  {
    key: "08-zasoby",
    labelKey: "areas.08.label",
    eyebrowKey: "areas.08.eyebrow",
    href: canonicalAssetsPath,
    descriptionKey: "areas.08.description",
    icon: "ph-folder-open"
  }
];

export const plannedDepartments = [
  "departments.01",
  "departments.02",
  "departments.03",
  "departments.05",
  "departments.06",
  "departments.07",
  "departments.09",
  "departments.10",
  "departments.11",
  "departments.12"
] as const;
