export interface IphoneModelOption {
  id: string;
  label: string;
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
      { id: "IphoneX", label: "X" },
      { id: "IphoneXMax", label: "X Max" },
    ],
  },
  {
    id: "11",
    title: "iPhone 11",
    models: [
      { id: "Iphone11", label: "11" },
      { id: "Iphone11Pro", label: "11 Pro" },
      { id: "Iphone11ProMax", label: "11 Pro Max" },
    ],
  },
  {
    id: "12",
    title: "iPhone 12",
    models: [
      { id: "Iphone12", label: "12" },
      { id: "Iphone12Mini", label: "12 Mini" },
      { id: "Iphone12Pro", label: "12 Pro" },
      { id: "Iphone12ProMax", label: "12 Pro Max" },
    ],
  },
  {
    id: "13",
    title: "iPhone 13",
    models: [
      { id: "Iphone13", label: "13" },
      { id: "Iphone13Mini", label: "13 Mini" },
      { id: "Iphone13Pro", label: "13 Pro" },
      { id: "Iphone13ProMax", label: "13 Pro Max" },
    ],
  },
  {
    id: "14",
    title: "iPhone 14",
    models: [
      { id: "Iphone14", label: "14" },
      { id: "Iphone14Plus", label: "14 Plus" },
      { id: "Iphone14Pro", label: "14 Pro" },
      { id: "Iphone14ProMax", label: "14 Pro Max" },
    ],
  },
];
