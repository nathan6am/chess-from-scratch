import React, { useState, useEffect, useRef } from "react";
import { throttle } from "lodash";

const useRelativeMousePosition = (ref: React.RefObject<HTMLDivElement>) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = throttle((event: PointerEvent) => {
      setPosition({
        x: Math.floor(
          event.clientX -
            (ref?.current ? ref.current?.getBoundingClientRect().x : 0)
        ),
        y: Math.floor(
          event.clientY -
            (ref?.current ? ref.current?.getBoundingClientRect().y : 0)
        ),
      });
    }, 16);

    window.addEventListener("pointermove", handleMouseMove);

    return () => {
      window.removeEventListener("pointermove", handleMouseMove);
    };
  }, []);

  return position;
};

export default useRelativeMousePosition;
