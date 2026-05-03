import { useCallback, useState } from 'react';

export const useVerticalResize = (
  defaultHeight: number,
  minHeight: number,
  maxHeight: number
): {
  height: number;
  startResize: (event: React.MouseEvent<HTMLElement>) => void;
} => {
  const [height, setHeight] = useState(defaultHeight);

  const startResize = useCallback(
    (event: React.MouseEvent<HTMLElement>): void => {
      event.preventDefault();
      const startY = event.clientY;
      const startHeight = height;

      const handleMouseMove = (moveEvent: MouseEvent): void => {
        setHeight(clamp(startHeight + moveEvent.clientY - startY, minHeight, maxHeight));
      };

      const handleMouseUp = (): void => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [height, maxHeight, minHeight]
  );

  return { height, startResize };
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));
