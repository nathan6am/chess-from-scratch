import { useState, useEffect, useRef } from "react";
import { throttle } from "lodash";

const useCursorPosition = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = throttle((event: PointerEvent) => {
      setPosition({
        x: event.clientX,
        y: event.clientY,
      });
    }, 16);

    window.addEventListener("pointermove", handleMouseMove);

    return () => {
      window.removeEventListener("pointermove", handleMouseMove);
    };
  }, []);

  return position;
};

export default useCursorPosition;
