import { useEffect } from 'react';
import { restoreRequester } from './requesterSlice';
import { requesterTnetApi } from './requesterTnetApi';
import { useRequesterDispatch } from './storeHooks';

export const useRestoreRequester = (): void => {
  const dispatch = useRequesterDispatch();

  useEffect(() => {
    let canceled = false;

    const restore = async (): Promise<void> => {
      const [config, workspaces] = await Promise.all([
        requesterTnetApi.requester.config.loadGlobal(),
        requesterTnetApi.requester.workspaces.list()
      ]);
      const activeWorkspaceId =
        config.activeWorkspaceId ?? config.lastOpenedWorkspaceId ?? workspaces[0]?.id;
      const [requests, settings, history] = activeWorkspaceId
        ? await Promise.all([
            requesterTnetApi.requester.requests.list({ workspaceId: activeWorkspaceId }),
            requesterTnetApi.requester.workspaces.getSettings({ workspaceId: activeWorkspaceId }),
            requesterTnetApi.requester.history.list({ workspaceId: activeWorkspaceId })
          ])
        : [[], undefined, []];

      if (canceled) return;
      dispatch(
        restoreRequester({
          activeWorkspaceId,
          workspaces,
          requests,
          history,
          settings
        })
      );
    };

    restore().catch((error: unknown) => {
      console.error('Failed to restore requester workspace', error);
      if (!canceled) {
        dispatch(
          restoreRequester({
            workspaces: []
          })
        );
      }
    });

    return () => {
      canceled = true;
    };
  }, [dispatch]);
};
