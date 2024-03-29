import React from "react";
interface Props extends React.HTMLAttributes<HTMLInputElement> {
  placeholder?: string;
  value: string;
  showClearButton?: boolean;
  onClear: () => void;
}
