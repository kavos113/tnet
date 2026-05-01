import { useEffect, useState } from 'react';
import type { PapersLibraryConfig } from '@tnet/app-papers/shared/config';
import {
  defaultPapersLibraryConfig,
  normalizePapersLibraryConfig
} from '@tnet/app-papers/shared/config';
import { setPapersLibrarySettings } from '../library/librarySlice';
import { papersTnetApi } from '../papersTnetApi';
import sharedStyles from '../PapersShared.module.css';
import { usePapersDispatch, usePapersSelector } from '../storeHooks';

interface PapersSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PapersSettingsDialog = ({
  isOpen,
  onClose
}: PapersSettingsDialogProps): React.JSX.Element | null => {
  const dispatch = usePapersDispatch();
  const activeLibraryRoot = usePapersSelector((state) => state.papersLibrary.activeLibraryRoot);
  const settings = usePapersSelector((state) => state.papersLibrary.settings);
  const [draft, setDraft] = useState<PapersLibraryConfig>(settings);

  useEffect(() => {
    if (!isOpen) return;
    if (!activeLibraryRoot) {
      setDraft(defaultPapersLibraryConfig());
      return;
    }

    let canceled = false;
    papersTnetApi.papers.config
      .loadLibrary(activeLibraryRoot)
      .then((loadedSettings) => {
        if (!canceled) setDraft(normalizePapersLibraryConfig(loadedSettings));
      })
      .catch((error: unknown) => {
        console.error('Failed to load paper settings', error);
        if (!canceled) setDraft(settings);
      });

    return () => {
      canceled = true;
    };
  }, [activeLibraryRoot, isOpen, settings]);

  if (!isOpen) return null;

  const updateDraft = <Key extends keyof PapersLibraryConfig>(
    key: Key,
    value: PapersLibraryConfig[Key]
  ): void => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const saveSettings = async (): Promise<void> => {
    if (!activeLibraryRoot) return;
    await papersTnetApi.papers.config.saveLibrary(activeLibraryRoot, draft);
    dispatch(setPapersLibrarySettings(draft));
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <section
        className="modal-content"
        aria-label="Papers settings"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2>Papers Settings</h2>

        {!activeLibraryRoot ? (
          <div className={sharedStyles.emptyState}>
            Open a paper library before editing settings.
          </div>
        ) : (
          <>
            <div className="settings-group">
              <h3>List</h3>
              <label className="form-item" htmlFor="papers-list-density">
                <span>Density</span>
                <select
                  id="papers-list-density"
                  value={draft.listDensity}
                  onChange={(event) =>
                    updateDraft(
                      'listDensity',
                      event.target.value as PapersLibraryConfig['listDensity']
                    )
                  }
                >
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                </select>
              </label>
            </div>

            <div className="settings-group">
              <h3>PDF</h3>
              <label className="form-item" htmlFor="papers-pdf-zoom">
                <span>Default zoom</span>
                <select
                  id="papers-pdf-zoom"
                  value={draft.pdfZoomMode}
                  onChange={(event) =>
                    updateDraft(
                      'pdfZoomMode',
                      event.target.value as PapersLibraryConfig['pdfZoomMode']
                    )
                  }
                >
                  <option value="page-width">Fit width</option>
                  <option value="page-fit">Fit page</option>
                  <option value="actual-size">100%</option>
                </select>
              </label>
            </div>

            <div className="settings-group">
              <h3>Notes</h3>
              <label className="form-item" htmlFor="papers-note-mode">
                <span>Mode</span>
                <select
                  id="papers-note-mode"
                  value={draft.noteEditorMode}
                  onChange={(event) =>
                    updateDraft(
                      'noteEditorMode',
                      event.target.value as PapersLibraryConfig['noteEditorMode']
                    )
                  }
                >
                  <option value="editor">Editor</option>
                  <option value="preview">Preview</option>
                  <option value="split">Split</option>
                </select>
              </label>
              <label className="form-item" htmlFor="papers-note-debounce">
                <span>Auto save delay (ms)</span>
                <input
                  id="papers-note-debounce"
                  type="number"
                  min={100}
                  step={100}
                  value={draft.noteAutoSaveDebounceMs}
                  onChange={(event) =>
                    updateDraft('noteAutoSaveDebounceMs', Number(event.target.value))
                  }
                />
              </label>
              <label className="form-item" htmlFor="papers-note-editor-font-family">
                <span>Editor font family</span>
                <input
                  id="papers-note-editor-font-family"
                  value={draft.noteEditorFontFamily}
                  onChange={(event) => updateDraft('noteEditorFontFamily', event.target.value)}
                />
              </label>
              <label className="form-item" htmlFor="papers-note-editor-font-size">
                <span>Editor font size (px)</span>
                <input
                  id="papers-note-editor-font-size"
                  type="number"
                  min={10}
                  max={32}
                  value={draft.noteEditorFontSize}
                  onChange={(event) =>
                    updateDraft('noteEditorFontSize', Number(event.target.value))
                  }
                />
              </label>
              <label className="form-item" htmlFor="papers-note-preview-font-family">
                <span>Preview font family</span>
                <input
                  id="papers-note-preview-font-family"
                  value={draft.notePreviewFontFamily}
                  onChange={(event) => updateDraft('notePreviewFontFamily', event.target.value)}
                />
              </label>
              <label className="form-item" htmlFor="papers-note-preview-font-size">
                <span>Preview font size (px)</span>
                <input
                  id="papers-note-preview-font-size"
                  type="number"
                  min={10}
                  max={32}
                  value={draft.notePreviewFontSize}
                  onChange={(event) =>
                    updateDraft('notePreviewFontSize', Number(event.target.value))
                  }
                />
              </label>
            </div>
          </>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={!activeLibraryRoot}
            onClick={() => {
              saveSettings()
                .then(onClose)
                .catch((error: unknown) => {
                  console.error('Failed to save paper settings', error);
                });
            }}
          >
            Save
          </button>
        </div>
      </section>
    </div>
  );
};
