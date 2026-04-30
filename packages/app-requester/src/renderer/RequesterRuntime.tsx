import { useEffect } from 'react';
import { requesterTnetApi } from './requesterTnetApi';

export const RequesterRuntime = (): null => {
  useEffect(() => {
    requesterTnetApi.requester.config.loadGlobal().catch((error: unknown) => {
      console.error('Failed to restore requester config', error);
    });
  }, []);

  return null;
};
