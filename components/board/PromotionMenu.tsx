import * as Chess from "@/lib/chess";
import styles from "@/styles/Board.module.scss";
interface PromotionProps {
  promotionMove: { start: Chess.Square; end: Chess.Square } | null;
  orientation: Chess.Color;
  activeColor: Chess.Color;
  onSelect: (type: Chess.PieceType) => void;
  cancel?: () => void;
}
export default function PromotionMenu({
  promotionMove,
  orientation,
  activeColor,
  onSelect,
  cancel,
}: PromotionProps) {
  if (!promotionMove) return <></>;
  const [file] = Chess.squareToCoordinates(promotionMove.end);
  const col = orientation === "w" ? 1 + file : 8 - file;
  const rowMult = orientation === activeColor ? 1 : -1;
  return (
    <>
      {promotionMove && (
        <div
          onClick={cancel}
          className={`${styles.promotionMenu} absolute top-0 bottom-0 left-0 right-0 bg-black/[0.5]`}
          style={{ zIndex: 300 }}
        >
          <PromotionRow
            position={col}
            pieceType="q"
            color={activeColor}
            row={1 * rowMult}
            col={col}
            onSelect={onSelect}
          />
          <PromotionRow
            position={col}
            pieceType="r"
            color={activeColor}
            row={2 * rowMult}
            col={col}
            onSelect={onSelect}
          />
          <PromotionRow
            position={col}
            pieceType="b"
            color={activeColor}
            row={3 * rowMult}
            col={col}
            onSelect={onSelect}
          />
          <PromotionRow
            position={col}
            pieceType="n"
            color={activeColor}
            row={4 * rowMult}
            col={col}
            onSelect={onSelect}
          />
        </div>
      )}
    </>
  );
}
interface PromotionRowProps {
  position: number;
  pieceType: Chess.PieceType;
  color: Chess.Color;
  row: number;
  col: number;
  onSelect: (type: Chess.PieceType) => void;
}
function PromotionRow({ position, pieceType, color, row, onSelect }: PromotionRowProps) {
  return (
    <>
      <div
        onClick={() => {
          onSelect(pieceType);
        }}
        style={{ gridColumnStart: position, gridRowStart: row }}
        className={`${styles.square} box-border border-4 cursor-pointer  border-[#cfcfcf]/[0.8] hover:border-white rounded-full bg-[#505050]/[0.5] backdrop-blur-lg group flex justify-center items-center`}
      >
        <div
          className={`${styles.piece} ${color}${pieceType} bg-cover group-hover:scale-110 ease-in-out duration-200`}
          style={{
            pointerEvents: "none",
            width: `90%`,
            height: `90%`,
          }}
        />
      </div>
    </>
  );
}
