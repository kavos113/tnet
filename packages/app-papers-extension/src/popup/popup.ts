import { PapersExtensionServerClient } from '../papersServerClient';
import { loadPopupState } from './popupStore';

const render = (message: string): void => {
  const root = document.getElementById('root');
  if (root) root.textContent = message;
};

const bootstrap = async (): Promise<void> => {
  const [tab] = (await chrome?.tabs?.query?.({ active: true, currentWindow: true })) ?? [];
  const source = {
    sourceUrl: tab?.url ?? '',
    pageTitle: tab?.title ?? ''
  };

  const state = await loadPopupState(new PapersExtensionServerClient(), source);
  if (state.status === 'server-unavailable') {
    render('TNet desktop app is not running.');
    return;
  }
  if (state.status !== 'ready') {
    render(state.errorMessage ?? 'Failed to load paper import state.');
    return;
  }

  render(state.candidate?.title ?? source.pageTitle ?? source.sourceUrl);
};

void bootstrap();
