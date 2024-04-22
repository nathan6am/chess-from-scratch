import useSettings from "@/hooks/useSettings";
import { FaPaintBrush } from "react-icons/fa";
import BoardSelect from "../BoardSelect";
import PieceSetSelect from "../PieceSetSelect";

export default function ThemePanel() {
  const { settings, updateSettings } = useSettings();
  return (
    <div className="">
      <h2 className="text-lg mb-4 text-gold-100">
        <FaPaintBrush className="inline mr-1 mb-0.5" /> Theme Settings
      </h2>
      <BoardSelect
        value={settings.display.boardTheme}
        onChange={(value) => {
          updateSettings({
            display: {
              ...settings.display,
              boardTheme: value,
            },
          });
        }}
      />
      <PieceSetSelect
        value={settings.display.pieceTheme}
        onChange={(value) => {
          updateSettings({
            display: {
              ...settings.display,
              pieceTheme: value,
            },
          });
        }}
      />
    </div>
  );
}
