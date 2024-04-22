import useSettings from "@/hooks/useSettings";
import { IoGameController } from "react-icons/io5";
import { RadioGroup } from "@headlessui/react";
import { Toggle, RadioButton } from "@/components/base";
export default function GameBehaviorPanel() {
  const { settings, updateSettings } = useSettings();
  return (
    <div className="">
      <h2 className="text-lg mb-4 text-gold-100">
        <IoGameController className="inline mr-1 mb-0.5" /> Game Behavior
      </h2>
      <RadioGroup
        className="py-2"
        value={settings.gameBehavior.movementType}
        onChange={(value: "click" | "drag" | "both") => {
          updateSettings({
            gameBehavior: {
              ...settings.gameBehavior,
              movementType: value,
            },
          });
        }}
      >
        <RadioGroup.Label className="text-lg">Piece Movement Type</RadioGroup.Label>
        <RadioButton value="click" label="Click Squares" />
        <RadioButton value="drag" label="Drag and Drop" />
        <RadioButton value="both" label="Both" />
      </RadioGroup>
      <Toggle
        className="my-4"
        labelClasses="ml-2 "
        reverse
        checked={settings.gameBehavior.allowPremoves}
        label="Enable Premoves"
        onChange={(enabled) => {
          updateSettings({
            gameBehavior: {
              ...settings.gameBehavior,
              allowPremoves: enabled,
            },
          });
        }}
      />
      <Toggle
        className="my-4"
        labelClasses="ml-2 "
        reverse
        checked={settings.gameBehavior.autoQueen}
        label="Auto-Promote to Queen"
        onChange={(enabled) => {
          updateSettings({
            gameBehavior: {
              ...settings.gameBehavior,
              autoQueen: enabled,
            },
          });
        }}
      />
    </div>
  );
}
