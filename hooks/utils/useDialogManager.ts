import { useState } from "react";

interface Params {
  mutuallyExclusive?: boolean; // Whether the dialogs are mutually exclusive
  keys: string[]; // Dialog keys
  initialKeys?: string[]; // Initial keys to set as visible
}
export default function useDialogManager({ keys, mutuallyExclusive }: Params) {}
