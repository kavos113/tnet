import { useCallback, useState } from 'react';
import { getEditorPanePercent } from './splitPaneResize';

export interface SplitPaneResize {
  editorWidthPercent: number;
  previewWidthPercent: number;
  startResize: (event: React.MouseEvent<HTMLElement>) => void;
}

export const useSplitPaneResize = (): SplitPaneResize => {
  const [editorWidthPercent, setEditorWidthPercent] = useState(50);

  const startResize = useCallback((event: React.MouseEvent<HTMLElement>): void => {
    event.preventDefault();

    const container = event.currentTarget.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();

    const handleMouseMove = (moveEvent: MouseEvent): void => {
      setEditorWidthPercent(
        getEditorPanePercent({
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
    editorWidthPercent,
    previewWidthPercent: 100 - editorWidthPercent,
    startResize
  };
};
