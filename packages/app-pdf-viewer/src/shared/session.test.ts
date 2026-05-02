import { describe, expect, it } from 'vitest';
import { normalizePdfViewerSessionData } from './session';

describe('PDF viewer session', () => {
  it('keeps opened files and normalizes view states', () => {
    expect(
      normalizePdfViewerSessionData({
        explorer: {
          expandedFolders: ['slides'],
          selectedPath: 'slides/a.pdf'
        },
        apps: {
          pdfViewer: {
            openedFiles: ['slides/a.pdf', 1],
            activeIndex: 5,
            viewStateByPath: {
              'slides/a.pdf': {
                zoomMode: 'custom',
                customScale: 1.5,
                columns: 4,
                scrollTop: 120
              }
            }
          }
        }
      })
    ).toEqual({
      explorer: {
        expandedFolders: ['slides'],
        selectedPath: 'slides/a.pdf'
      },
      apps: {
        pdfViewer: {
          openedFiles: ['slides/a.pdf'],
          activeIndex: 0,
          viewStateByPath: {
            'slides/a.pdf': {
              zoomMode: 'custom',
              customScale: 1.5,
              columns: 4,
              scrollTop: 120
            }
          }
        }
      }
    });
  });
});
