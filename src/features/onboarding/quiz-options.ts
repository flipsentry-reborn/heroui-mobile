import type { SearchType } from "@/mocks/data/home";

export const ONBOARDING_TOTAL_STEPS = 5;

export type QuizOption = {
  id: string;
  label: string;
};

/** Dummy survey options keyed by search type (not persisted). */
export const VOLUME_OPTIONS: Record<SearchType, QuizOption[]> = {
  car: [
    { id: "1-3", label: "1-3 cars" },
    { id: "4-10", label: "4-10 cars" },
    { id: "11-25", label: "11-25 cars" },
    { id: "25+", label: "25+ cars" },
  ],
  iphone: [
    { id: "1-5", label: "1-5 iPhones" },
    { id: "6-15", label: "6-15 iPhones" },
    { id: "16-30", label: "16-30 iPhones" },
    { id: "30+", label: "30+ iPhones" },
  ],
  custom: [
    { id: "1-5", label: "1-5 items" },
    { id: "6-15", label: "6-15 items" },
    { id: "16-30", label: "16-30 items" },
    { id: "30+", label: "30+ items" },
  ],
};

export const MARGIN_OPTIONS: Record<SearchType, QuizOption[]> = {
  car: [
    { id: "<500", label: "Under $500" },
    { id: "500-1000", label: "$500 to $1,000" },
    { id: "1000-2500", label: "$1,000 to $2,500" },
    { id: "2500-5000", label: "$2,500 to $5,000" },
    { id: "5000+", label: "$5,000+" },
  ],
  iphone: [
    { id: "<25", label: "Under $25" },
    { id: "25-50", label: "$25 to $50" },
    { id: "50-100", label: "$50 to $100" },
    { id: "100-200", label: "$100 to $200" },
    { id: "200+", label: "$200+" },
  ],
  custom: [
    { id: "<50", label: "Under $50" },
    { id: "50-150", label: "$50 to $150" },
    { id: "150-500", label: "$150 to $500" },
    { id: "500-1000", label: "$500 to $1,000" },
    { id: "1000+", label: "$1,000+" },
  ],
};

export const TRIED_OTHER_OPTIONS: QuizOption[] = [
  { id: "yes", label: "Yes" },
  { id: "no", label: "No" },
];
