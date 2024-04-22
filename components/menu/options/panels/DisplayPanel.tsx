import useSettings from "@/hooks/useSettings";
import { BsDisplay } from "react-icons/bs";
import { RadioButton, Toggle } from "@/components/base";
import { RadioGroup } from "@headlessui/react";

export default function DisplayPanel() {
  const { settings, updateSettings } = useSettings();
  return (
    <div className="">
      <h2 className="text-lg mb-4 text-gold-100">
        <BsDisplay className="inline mr-1 mb-0.5" /> Display Settings
      </h2>
      <RadioGroup
        className="mb-3"
        value={settings.display.animationSpeed}
        onChange={(value: "slow" | "fast" | "normal" | "disabled") => {
          updateSettings({
            display: {
              ...settings.display,
              animationSpeed: value,
            },
          });
        }}
      >
        <RadioGroup.Label className="text-lg">Animation Speed</RadioGroup.Label>
        <RadioButton value="slow" label="Slow" />
        <RadioButton value="normal" label="Normal" />
        <RadioButton value="fast" label="Fast" />
        <RadioButton value="disabled" label="Disabled" />
      </RadioGroup>
      <p className="opacity-50 mt-4"> Board Settings</p>
      <RadioGroup
        className="mb-4"
        value={settings.display.showCoordinates}
        onChange={(value: "inside" | "outside" | "hidden") => {
          updateSettings({
            display: {
              ...settings.display,
              showCoordinates: value,
            },
          });
        }}
      >
        <RadioGroup.Label className="text-lg">Show Coordinates</RadioGroup.Label>
        <RadioButton value="inside" label="Inside Board" />
        <RadioButton value="outside" label="Outside Board" />
        <RadioButton value="hidden" label="Hidden" />
      </RadioGroup>
      <Toggle
        className="my-2"
        labelClasses="ml-2 "
        reverse
        checked={settings.display.showHighlights}
        label="Show Board Highlights"
        onChange={(enabled) => {
          updateSettings({
            display: {
              ...settings.display,
              showHighlights: enabled,
            },
          });
        }}
      />
      <Toggle
        className="my-2"
        labelClasses="ml-2 "
        reverse
        checked={settings.display.showValidMoves}
        label="Show Move Targets"
        onChange={(enabled) => {
          updateSettings({
            display: {
              ...settings.display,
              showValidMoves: enabled,
            },
          });
        }}
      />
      <p className="opacity-50 mt-4"> Move Notation</p>
      <Toggle
        className="my-2"
        labelClasses="ml-2 "
        reverse
        checked={settings.display.usePieceIcons}
        label="Use Piece Icons"
        onChange={(enabled) => {
          updateSettings({
            display: {
              ...settings.display,
              usePieceIcons: enabled,
            },
          });
        }}
      />
    </div>
  );
}
