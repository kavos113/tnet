import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceFileTree } from './WorkspaceFileTree';

describe('WorkspaceFileTree', () => {
  afterEach(() => cleanup());

  it('renders expanded directories and activates enabled files', () => {
    const onActivateItem = vi.fn();

    render(
      <ul>
        <WorkspaceFileTree
          items={[
            {
              name: 'docs',
              path: '/workspace/docs',
              isDirectory: true,
              children: [
                { name: 'guide.pdf', path: '/workspace/docs/guide.pdf', isDirectory: false }
              ]
            },
            { name: 'notes.txt', path: '/workspace/notes.txt', isDirectory: false }
          ]}
          expandedPaths={['/workspace/docs']}
          selectedPath="/workspace/docs/guide.pdf"
          onActivateItem={onActivateItem}
          isItemDisabled={(item) => !item.isDirectory && !item.name.endsWith('.pdf')}
          getItemIcon={(item) => (item.name.endsWith('.pdf') ? 'picture_as_pdf' : 'description')}
        />
      </ul>
    );

    fireEvent.click(screen.getByText('guide.pdf'));
    expect(onActivateItem).toHaveBeenCalledWith({
      name: 'guide.pdf',
      path: '/workspace/docs/guide.pdf',
      isDirectory: false
    });

    fireEvent.click(screen.getByText('notes.txt'));
    expect(onActivateItem).toHaveBeenCalledTimes(1);
  });
});
