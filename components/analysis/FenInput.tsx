import { Input, Button } from "@/components/base";
import * as Chess from "@/lib/chess";
import { useState } from "react";

interface FenInputProps {
  onEnter: (fen: string) => void;
  buttonLabel?: string;
}
export default function FenInput({ buttonLabel, onEnter }: FenInputProps) {
  const [fen, setFen] = useState("");
  const [valid, setValid] = useState(true);

  return (
    <>
      <Input
        label="Paste or enter FEN"
        value={fen}
        onChange={(e) => {
          setFen(e.target.value);
          try {
            const state = Chess.fenToGameState(e.target.value);
            if (state) setValid(true);
            else setValid(false);
          } catch (e) {
            setValid(false);
          }
        }}
        error={valid ? undefined : "Invalid FEN"}
      />
      <Button
        onClick={() => {
          if (fen && valid) onEnter(fen);
        }}
        variant="neutral"
        width="sm"
        label={buttonLabel}
        disabled={!fen || !valid}
      />
    </>
  );
}
