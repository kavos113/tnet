import { useCallback, useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export interface UseSettingsDraftOptions<TDraft> {
  initialDraft: TDraft;
  load: () => Promise<TDraft>;
  normalize?: (draft: TDraft) => TDraft;
  onLoadError?: (error: unknown) => void;
}

export interface UseSettingsDraftResult<TDraft> {
  draft: TDraft;
  setDraft: Dispatch<SetStateAction<TDraft>>;
  updateDraft: <Key extends keyof TDraft>(key: Key, value: TDraft[Key]) => void;
}

export const useSettingsDraft = <TDraft>({
  initialDraft,
  load,
  normalize,
  onLoadError
}: UseSettingsDraftOptions<TDraft>): UseSettingsDraftResult<TDraft> => {
  const [draft, setDraft] = useState<TDraft>(initialDraft);

  useEffect(() => {
    let canceled = false;
    load()
      .then((loadedDraft) => {
        if (!canceled) setDraft(normalize ? normalize(loadedDraft) : loadedDraft);
      })
      .catch((error: unknown) => {
        onLoadError?.(error);
        if (!canceled) setDraft(initialDraft);
      });

    return () => {
      canceled = true;
    };
  }, [initialDraft, load, normalize, onLoadError]);

  const updateDraft = useCallback(
    <Key extends keyof TDraft>(key: Key, value: TDraft[Key]): void => {
      setDraft((current) => {
        const nextDraft = { ...current, [key]: value };
        return normalize ? normalize(nextDraft) : nextDraft;
      });
    },
    [normalize]
  );

  return {
    draft,
    setDraft,
    updateDraft
  };
};
