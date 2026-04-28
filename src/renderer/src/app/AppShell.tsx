import { useEffect, useState } from 'react';
import { normalizeGlobalConfig } from '@shared/types/config';
import { useAppDispatch, useAppSelector } from '@renderer/app/hooks';
import { AppRail } from '@renderer/components/AppRail/AppRail';
import { SettingsDialog } from '@renderer/features/settings/SettingsDialog';
import { useShortcut } from '@renderer/features/shortcuts/useShortcut';
import { tnetApi } from '@renderer/lib/tnetApi';
import { appRegistry, getAppModule } from './appRegistry';
import { restoreActiveApp, setActiveApp } from './appSlice';

export const AppShell = (): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const activeAppId = useAppSelector((state) => state.app.activeAppId);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAppRestored, setIsAppRestored] = useState(false);
  const activeModule = getAppModule(activeAppId);
  const ActiveApp = activeModule.Main;
  const ActiveSidebar = activeModule.Sidebar;
  const ActiveRuntime = activeModule.Runtime;

  useShortcut({
    key: ',',
    ctrlOrMeta: true,
    target: 'document',
    allowInEditable: true,
    onTrigger: () => setIsSettingsOpen(true)
  });

  useEffect(() => {
    let canceled = false;

    const restoreApp = async (): Promise<void> => {
      const config = normalizeGlobalConfig(await tnetApi.config.loadGlobal());
      if (canceled) return;
      dispatch(restoreActiveApp(config.activeAppId));
    };

    restoreApp()
      .catch((error: unknown) => {
        console.error('Failed to restore active app', error);
      })
      .finally(() => {
        if (!canceled) setIsAppRestored(true);
      });

    return () => {
      canceled = true;
    };
  }, [dispatch]);

  useEffect(() => {
    if (!isAppRestored) return;

    const persistActiveApp = async (): Promise<void> => {
      const config = normalizeGlobalConfig(await tnetApi.config.loadGlobal());
      await tnetApi.config.saveGlobal({
        ...config,
        activeAppId
      });
    };

    persistActiveApp().catch((error: unknown) => {
      console.error('Failed to save active app', error);
    });
  }, [activeAppId, isAppRestored]);

  return (
    <div className="app-shell">
      <AppRail
        apps={appRegistry}
        activeAppId={activeAppId}
        onSelect={(appId) => dispatch(setActiveApp(appId))}
      />
      {isAppRestored && ActiveRuntime ? <ActiveRuntime /> : null}
      {isAppRestored && ActiveSidebar ? <ActiveSidebar /> : null}
      {isAppRestored ? <ActiveApp /> : null}
      <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};
