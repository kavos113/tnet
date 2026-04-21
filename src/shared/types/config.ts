export interface GlobalConfig {
  lastOpenedDirectory?: string;
}

export interface ProjectConfig {
  editorFontFamily: string;
  editorFontSize: number;
  previewFontFamily: string;
  previewFontSize: number;
}

export const defaultGlobalConfig = (): GlobalConfig => ({});

export const defaultProjectConfig = (): ProjectConfig => ({
  editorFontFamily: 'monospace',
  editorFontSize: 16,
  previewFontFamily: 'sans-serif',
  previewFontSize: 16
});
