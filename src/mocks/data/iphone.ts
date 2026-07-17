export interface IphoneModelOption {
  id: string;
  label: string;
  /** Sensible marketplace floor for this model (USD). */
  defaultMinPrice: number;
  /** Sensible marketplace ceiling for this model (USD). */
  defaultMaxPrice: number;
}

export interface IphoneSeries {
  id: string;
  title: string;
  models: IphoneModelOption[];
}

/** Sample catalog for UI work — replace with API later. */
export const MOCK_IPHONE_SERIES: IphoneSeries[] = [
  {
    id: "x",
    title: "iPhone X",
    models: [
      { id: "IphoneX", label: "X", defaultMinPrice: 80, defaultMaxPrice: 220 },
      {
        id: "IphoneXMax",
        label: "X Max",
        defaultMinPrice: 100,
        defaultMaxPrice: 260,
      },
    ],
  },
  {
    id: "11",
    title: "iPhone 11",
    models: [
      { id: "Iphone11", label: "11", defaultMinPrice: 120, defaultMaxPrice: 280 },
      {
        id: "Iphone11Pro",
        label: "11 Pro",
        defaultMinPrice: 160,
        defaultMaxPrice: 340,
      },
      {
        id: "Iphone11ProMax",
        label: "11 Pro Max",
        defaultMinPrice: 180,
        defaultMaxPrice: 380,
      },
    ],
  },
  {
    id: "12",
    title: "iPhone 12",
    models: [
      { id: "Iphone12", label: "12", defaultMinPrice: 160, defaultMaxPrice: 350 },
      {
        id: "Iphone12Mini",
        label: "12 Mini",
        defaultMinPrice: 140,
        defaultMaxPrice: 300,
      },
      {
        id: "Iphone12Pro",
        label: "12 Pro",
        defaultMinPrice: 220,
        defaultMaxPrice: 450,
      },
      {
        id: "Iphone12ProMax",
        label: "12 Pro Max",
        defaultMinPrice: 250,
        defaultMaxPrice: 500,
      },
    ],
  },
  {
    id: "13",
    title: "iPhone 13",
    models: [
      { id: "Iphone13", label: "13", defaultMinPrice: 220, defaultMaxPrice: 420 },
      {
        id: "Iphone13Mini",
        label: "13 Mini",
        defaultMinPrice: 180,
        defaultMaxPrice: 360,
      },
      {
        id: "Iphone13Pro",
        label: "13 Pro",
        defaultMinPrice: 300,
        defaultMaxPrice: 550,
      },
      {
        id: "Iphone13ProMax",
        label: "13 Pro Max",
        defaultMinPrice: 340,
        defaultMaxPrice: 620,
      },
    ],
  },
  {
    id: "14",
    title: "iPhone 14",
    models: [
      { id: "Iphone14", label: "14", defaultMinPrice: 280, defaultMaxPrice: 520 },
      {
        id: "Iphone14Plus",
        label: "14 Plus",
        defaultMinPrice: 300,
        defaultMaxPrice: 560,
      },
      {
        id: "Iphone14Pro",
        label: "14 Pro",
        defaultMinPrice: 380,
        defaultMaxPrice: 700,
      },
      {
        id: "Iphone14ProMax",
        label: "14 Pro Max",
        defaultMinPrice: 420,
        defaultMaxPrice: 780,
      },
    ],
  },
];

export function getIphoneModelDefaults(
  id: string,
): { min: string; max: string } | null {
  for (const series of MOCK_IPHONE_SERIES) {
    const model = series.models.find((item) => item.id === id);
    if (model) {
      return {
        min: String(model.defaultMinPrice),
        max: String(model.defaultMaxPrice),
      };
    }
  }
  return null;
}
