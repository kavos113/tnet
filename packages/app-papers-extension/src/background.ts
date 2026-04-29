const browserApi = chrome;

browserApi?.runtime?.onInstalled?.addListener(() => {
  browserApi.contextMenus?.create({
    id: 'tnet-import-paper',
    title: 'Import to TNet Papers',
    contexts: ['page', 'link', 'selection']
  });
});

browserApi?.contextMenus?.onClicked?.addListener((info, tab) => {
  void browserApi.storage?.session?.set({
    pendingPaperImport: {
      sourceUrl: info.linkUrl ?? tab?.url ?? '',
      pageTitle: tab?.title ?? ''
    }
  });
});
