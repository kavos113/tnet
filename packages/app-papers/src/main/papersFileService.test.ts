import { beforeEach, describe, expect, it, vi } from 'vitest';

const electronMock = vi.hoisted(() => ({
  dialog: {
    showOpenDialog: vi.fn()
  },
  shell: {
    openPath: vi.fn()
  },
  clipboard: {
    readText: vi.fn()
  }
}));

vi.mock('electron', () => ({
  dialog: electronMock.dialog,
  clipboard: electronMock.clipboard,
  shell: electronMock.shell
}));

describe('papersFileService', () => {
  beforeEach(() => {
    electronMock.dialog.showOpenDialog.mockReset();
    electronMock.shell.openPath.mockReset();
    electronMock.clipboard.readText.mockReset();
  });

  it('selects a pdf import candidate without touching the database', async () => {
    const { selectPdfForImport } = await import('./papersFileService');
    electronMock.dialog.showOpenDialog.mockResolvedValue({
      canceled: false,
      filePaths: ['C:\\outside\\paper.pdf']
    });
    electronMock.clipboard.readText.mockReturnValue('@article{paper,title={Paper}}');

    await expect(
      selectPdfForImport({ libraryRoot: 'C:\\library', directoryPath: 'articles' })
    ).resolves.toEqual({
      sourcePath: 'C:\\outside\\paper.pdf',
      suggestedTitle: 'paper',
      clipboardBibtex: '@article{paper,title={Paper}}',
      sourceRelativePath: undefined,
      willCopy: true,
      targetDirectoryPath: 'articles'
    });
  });

  it('opens a pdf with the OS-associated application', async () => {
    const { openPdfExternal } = await import('./papersFileService');

    await openPdfExternal('C:\\library', 'papers/paper.pdf');

    expect(electronMock.shell.openPath).toHaveBeenCalledWith('C:\\library\\papers\\paper.pdf');
  });
});
