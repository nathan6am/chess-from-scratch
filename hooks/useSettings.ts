import { SettingsContext } from "@/context/settings";
import { useContext } from "react";
export default function useSettings() {
  const settings = useContext(SettingsContext);
  return settings;
}
