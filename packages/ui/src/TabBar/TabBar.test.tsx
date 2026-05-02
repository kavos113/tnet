import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TabBar } from './TabBar';

describe('TabBar', () => {
  afterEach(() => cleanup());

  it('selects and closes tabs', () => {
    const onSelectTab = vi.fn();
    const onCloseTab = vi.fn();

    render(
      <TabBar
        tabs={[
          { id: 'a', label: 'Alpha' },
          { id: 'b', label: 'Beta', isModified: true }
        ]}
        activeId="a"
        ariaLabel="Open items"
        onSelectTab={onSelectTab}
        onCloseTab={onCloseTab}
      />
    );

    fireEvent.click(screen.getByRole('tab', { name: /Beta/ }));
    expect(onSelectTab).toHaveBeenCalledWith('b', 1);

    fireEvent.click(screen.getByRole('button', { name: 'Close Alpha' }));
    expect(onCloseTab).toHaveBeenCalledWith('a', 0);
  });
});
