import { useLayoutEffect } from "react";

export default function useBoardTheme(theme: string) {
  useLayoutEffect(() => {
    var head = document.head;
    var link = document.createElement("link");

    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = `/assets/boardcss/${theme}.css`;

    head.appendChild(link);

    return () => {
      head.removeChild(link);
    };
  }, [theme]);
}
