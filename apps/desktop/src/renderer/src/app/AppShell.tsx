import { Suspense, useEffect, useState } from 'react';
import {
  defaultGlobalFontSettings,
  getGlobalFontSettings,
  normalizeGlobalConfig,
  type GlobalFontSettings
} from '@tnet/shared/types/config';
import type { MarkdownAppProps } from '@tnet/app-markdown/renderer';
import type { TasksAppProps, TasksSidebarProps } from '@tnet/app-tasks/renderer';
import { useAppDispatch, useAppSelector } from '@renderer/app/hooks';
import { AppRail } from '@tnet/ui/AppRail';
import { useShortcut } from '@tnet/renderer-core/shortcuts/useShortcut';
import { tnetApi } from '@tnet/renderer-core/tnetApi';
import { appRegistry, getAppModule } from './appRegistry';
import { AppSettingsCenter } from './AppSettingsCenter';
import { restoreActiveApp, setActiveApp } from './appSlice';
import { useOpenPdfLink } from './useOpenPdfLink';
import styles from './AppShell.module.css';

export const AppShell = (): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const activeAppId = useAppSelector((state) => state.app.activeAppId);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAppRestored, setIsAppRestored] = useState(false);
  const [fontSettings, setFontSettings] = useState<GlobalFontSettings>(defaultGlobalFontSettings());
  const openPdfLink = useOpenPdfLink();
  const activeModule = getAppModule(activeAppId);
  const ActiveApp = activeModule.Main;
  const TasksMain = ActiveApp as React.ComponentType<TasksAppProps>;
  const MarkdownMain = ActiveApp as React.ComponentType<MarkdownAppProps>;
  const ActiveSidebar = activeModule.Sidebar;
  const TasksSidebar = ActiveSidebar as React.ComponentType<TasksSidebarProps>;
  const ActiveRuntime = activeModule.Runtime;
  const portalShortcuts = appRegistry
    .filter((app) => app.id !== 'tasks')
    .map((app) => ({
      id: app.id,
      label: app.label,
      icon: app.icon
    }));

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
      setFontSettings(getGlobalFontSettings(config));
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
    <div
      className={styles.root}
      style={
        {
          '--tnet-font-family': fontSettings.standardFontFamily,
          '--tnet-font-size': `${fontSettings.standardFontSize}px`,
          '--tnet-monospace-font-family': fontSettings.monospaceFontFamily,
          '--tnet-monospace-font-size': `${fontSettings.monospaceFontSize}px`
        } as React.CSSProperties
      }
    >
      <AppRail
        apps={appRegistry}
        activeAppId={activeAppId}
        onSelect={(appId) => dispatch(setActiveApp(appId))}
      />
      <Suspense fallback={<main aria-label={activeModule.label} className={styles.loading} />}>
        {isAppRestored && ActiveRuntime ? <ActiveRuntime /> : null}
        {isAppRestored && ActiveSidebar ? (
          activeAppId === 'tasks' ? (
            <TasksSidebar onOpenTasksSettings={() => setIsSettingsOpen(true)} />
          ) : (
            <ActiveSidebar />
          )
        ) : null}
        {isAppRestored ? (
          activeAppId === 'tasks' ? (
            <TasksMain
              portalShortcuts={portalShortcuts}
              onSelectPortalApp={(appId) => dispatch(setActiveApp(appId))}
            />
          ) : activeAppId === 'markdown' ? (
            <MarkdownMain onOpenPdfLink={openPdfLink} />
          ) : (
            <ActiveApp />
          )
        ) : null}
      </Suspense>
      <AppSettingsCenter
        isOpen={isSettingsOpen}
        activeAppId={activeAppId}
        onClose={() => setIsSettingsOpen(false)}
        onFontSettingsChange={setFontSettings}
      />
    </div>
  );
};
