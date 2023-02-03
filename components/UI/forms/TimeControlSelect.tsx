import React from "react";
import { TimeControl } from "@/lib/chess";
interface Category {
  label: string;
  options?: TimeControl[];
}
const CATEGORIES: Category[] = [
  {
    label: "Bullet",
    options: [
      { timeSeconds: 60, incrementSeconds: 0 },
      { timeSeconds: 60, incrementSeconds: 1 },
      { timeSeconds: 120, incrementSeconds: 0 },
      { timeSeconds: 120, incrementSeconds: 1 },
    ],
  },
];
export default function TimeControlSelect() {
  return <div>TimeControlSelect</div>;
}
