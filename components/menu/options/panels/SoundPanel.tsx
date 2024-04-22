import { PanelHeader, Label } from "@/components/base/Typography";
import useSettings from "@/hooks/useSettings";
import { BsVolumeUpFill } from "react-icons/bs";
import { RangeSlider, Toggle } from "@/components/base";
export default function SoundPanel() {
  const { settings, updateSettings } = useSettings();
  return (
    <div>
      <PanelHeader className="mb-4">
        <BsVolumeUpFill className="inline mr-1 mb-0.5" /> Sound Settings
      </PanelHeader>
      <Label>Volume</Label>
      <div className="max-w-xs ml-[-8px]">
        <RangeSlider
          min={0}
          max={100}
          step={5}
          minThumbClassName="hidden"
          lock={new Set(["min"])}
          onChange={([_min, max]) => {
            updateSettings({
              sound: {
                ...settings.sound,
                volume: max,
              },
            });
          }}
          value={[0, settings.sound.volume]}
        />
      </div>
      <Toggle
        className="my-2"
        labelClasses="ml-2 "
        reverse
        checked={settings.sound.moveSounds}
        label="Move Sounds"
        onChange={(enabled) => {
          updateSettings({
            sound: {
              ...settings.sound,
              moveSounds: enabled,
            },
          });
        }}
      />
      <Toggle
        className="my-2"
        labelClasses="ml-2 "
        reverse
        checked={settings.sound.invalidMoveSounds}
        label="Invalid Move Warning"
        onChange={(enabled) => {
          updateSettings({
            sound: {
              ...settings.sound,
              invalidMoveSounds: enabled,
            },
          });
        }}
      />
      <Toggle
        className="my-2"
        labelClasses="ml-2 "
        reverse
        checked={settings.sound.lowTimeWarning}
        label="Low Time Warning"
        onChange={(enabled) => {
          updateSettings({
            sound: {
              ...settings.sound,
              lowTimeWarning: enabled,
            },
          });
        }}
      />
      <Toggle
        className="my-2"
        labelClasses="ml-2 "
        reverse
        checked={settings.sound.notifcationSounds}
        label="Notication Sounds"
        onChange={(enabled) => {
          updateSettings({
            sound: {
              ...settings.sound,
              notifcationSounds: enabled,
            },
          });
        }}
      />
    </div>
  );
}
