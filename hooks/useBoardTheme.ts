import { useLayoutEffect } from "react";

export default function useBoardTheme(theme: string, override?: boolean) {
  useLayoutEffect(() => {
    if (override) return;
    var head = document.head;
    var link = document.createElement("link");

    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = `/assets/boards/${theme}.css`;

    head.appendChild(link);

    return () => {
      head.removeChild(link);
    };
  }, [theme]);
}
