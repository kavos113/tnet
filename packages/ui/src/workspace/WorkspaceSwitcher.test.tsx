import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';

describe('WorkspaceSwitcher', () => {
  afterEach(() => cleanup());

  it('switches inactive workspaces and opens a new workspace', () => {
    const onSwitchRoot = vi.fn();
    const onOpenRoot = vi.fn();

    render(
      <WorkspaceSwitcher
        roots={['/workspace', '/second']}
        activeRoot="/workspace"
        ariaLabel="Workspaces"
        openLabel="Open workspace"
        onSwitchRoot={onSwitchRoot}
        onOpenRoot={onOpenRoot}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Switch to second' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open workspace' }));

    expect(onSwitchRoot).toHaveBeenCalledWith('/second');
    expect(onOpenRoot).toHaveBeenCalled();
  });
});
