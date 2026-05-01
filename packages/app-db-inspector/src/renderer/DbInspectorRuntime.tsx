import { useEffect } from 'react';
import { getTnetApi } from '@tnet/renderer-core/tnetApi';
import type { TnetApi } from '@tnet/shared/ipc/contracts';
import { getDbInspectorGlobalSettings } from '@tnet/app-db-inspector/shared/config';
import { dbInspectorTnetApi } from './dbInspectorTnetApi';
import { restoreDbInspector, setDbInspectorError } from './dbInspectorSlice';
import { useDbInspectorDispatch } from './storeHooks';

export const DbInspectorRuntime = (): null => {
  const dispatch = useDbInspectorDispatch();

  useEffect(() => {
    let cancelled = false;

    const restore = async (): Promise<void> => {
      try {
        const [rootConfig, dbInspectorConfig, workspaces] = await Promise.all([
          getTnetApi<TnetApi>().config.loadGlobal(),
          dbInspectorTnetApi.dbInspector.config.loadGlobal(),
          dbInspectorTnetApi.dbInspector.workspaces.list()
        ]);
        const activeWorkspaceId =
          dbInspectorConfig.activeWorkspaceId ??
          dbInspectorConfig.lastOpenedWorkspaceId ??
          workspaces[0]?.id;
        const [schema, settings] = activeWorkspaceId
          ? await Promise.all([
              dbInspectorTnetApi.dbInspector.schema.getTree({ workspaceId: activeWorkspaceId }),
              dbInspectorTnetApi.dbInspector.workspaces.getSettings({
                workspaceId: activeWorkspaceId
              })
            ])
          : [undefined, undefined];
        const [queryTabs, queryHistory] = activeWorkspaceId
          ? await Promise.all([
              dbInspectorTnetApi.dbInspector.query.listTabs({ workspaceId: activeWorkspaceId }),
              dbInspectorTnetApi.dbInspector.query.listHistory({ workspaceId: activeWorkspaceId })
            ])
          : [[], []];

        if (!cancelled) {
          dispatch(
            restoreDbInspector({
              activeWorkspaceId,
              workspaces,
              schema: schema ?? undefined,
              queryTabs,
              queryHistory,
              settings,
              globalSettings: getDbInspectorGlobalSettings(rootConfig)
            })
          );
        }
      } catch (error) {
        if (!cancelled) {
          dispatch(setDbInspectorError(error instanceof Error ? error.message : String(error)));
        }
      }
    };

    void restore();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return null;
};
