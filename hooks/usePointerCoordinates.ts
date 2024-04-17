import { useState, useEffect, RefObject } from "react";
import { throttle } from "lodash";

const usePointerCoordinates = (gridSize: number, ref: RefObject<HTMLDivElement>, disabled?: boolean) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = throttle((event: PointerEvent) => {
      setPosition({
        x: Math.floor(
          (event.clientX - (ref?.current ? ref.current?.getBoundingClientRect().x : 0)) /
            (ref.current ? ref.current.getBoundingClientRect()?.width / gridSize : 1)
        ),
        y: Math.floor(
          (event.clientY - (ref?.current ? ref.current?.getBoundingClientRect().y : 0)) /
            (ref.current ? ref.current.getBoundingClientRect()?.height / gridSize : 1)
        ),
      });
    }, 16);
    if (disabled) {
      window.removeEventListener("pointermove", handleMouseMove);
      return;
    }

    window.addEventListener("pointermove", handleMouseMove);

    return () => {
      window.removeEventListener("pointermove", handleMouseMove);
    };
  }, [disabled]);

  return position;
};

export default usePointerCoordinates;
