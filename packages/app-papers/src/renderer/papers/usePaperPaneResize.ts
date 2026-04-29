import { useCallback, useState } from 'react';
import { getPaperListPanePercent } from './paperPaneResize';

export interface PaperPaneResize {
  listWidthPercent: number;
  detailWidthPercent: number;
  startPaneResize: (event: React.MouseEvent<HTMLElement>) => void;
}

export const usePaperPaneResize = (): PaperPaneResize => {
  const [listWidthPercent, setListWidthPercent] = useState(40);

  const startPaneResize = useCallback((event: React.MouseEvent<HTMLElement>): void => {
    event.preventDefault();

    const container = event.currentTarget.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const handleMouseMove = (moveEvent: MouseEvent): void => {
      setListWidthPercent(
        getPaperListPanePercent({
          clientX: moveEvent.clientX,
          containerLeft: containerRect.left,
          containerWidth: containerRect.width
        })
      );
    };
    const handleMouseUp = (): void => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  return {
    listWidthPercent,
    detailWidthPercent: 100 - listWidthPercent,
    startPaneResize
  };
};
