import { session } from 'electron';
import { is } from '@electron-toolkit/utils';
import installExtension, {
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS
} from 'electron-devtools-installer';

const devtoolExtensions = [REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS];

export const installDevtools = async (): Promise<void> => {
  if (!is.dev) return;

  try {
    const extensions = await installExtension(devtoolExtensions, {
      session: session.defaultSession,
      loadExtensionOptions: {
        allowFileAccess: true
      }
    });
    console.info(
      `Installed Electron DevTools extensions: ${extensions
        .map((extension) => extension.name)
        .join(', ')}`
    );
  } catch (error: unknown) {
    console.warn('Failed to install Electron DevTools extensions', error);
  }
};
