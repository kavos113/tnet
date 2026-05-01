import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SettingsFieldConfig } from './SettingsDialog';
import { SettingsDialogShell, SettingsFieldsSection } from './SettingsDialog';

interface TestDraft {
  name: string;
  token: string;
  retries: number;
  enabled: boolean;
  mode: string;
}

const fields: ReadonlyArray<SettingsFieldConfig<TestDraft>> = [
  { id: 'settings-name', label: 'Name', key: 'name', type: 'text' },
  { id: 'settings-token', label: 'Token', key: 'token', type: 'password' },
  { id: 'settings-retries', label: 'Retries', key: 'retries', type: 'number', min: 1 },
  { id: 'settings-enabled', label: 'Enabled', key: 'enabled', type: 'checkbox' },
  {
    id: 'settings-mode',
    label: 'Mode',
    key: 'mode',
    type: 'select',
    options: [
      { value: 'fast', label: 'Fast' },
      { value: 'safe', label: 'Safe' }
    ]
  }
];

describe('settings UI', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders common fields and emits typed changes', () => {
    const onFieldChange = vi.fn();
    const draft: TestDraft = {
      name: 'Local',
      token: 'secret',
      retries: 2,
      enabled: true,
      mode: 'fast'
    };

    render(
      <SettingsFieldsSection
        title="General"
        draft={draft}
        fields={fields}
        onFieldChange={onFieldChange}
      />
    );

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Remote' } });
    fireEvent.change(screen.getByLabelText('Token'), { target: { value: 'updated' } });
    fireEvent.change(screen.getByLabelText('Retries'), { target: { value: '3' } });
    fireEvent.click(screen.getByLabelText('Enabled'));
    fireEvent.change(screen.getByLabelText('Mode'), { target: { value: 'safe' } });

    expect(onFieldChange).toHaveBeenCalledWith('name', 'Remote');
    expect(onFieldChange).toHaveBeenCalledWith('token', 'updated');
    expect(onFieldChange).toHaveBeenCalledWith('retries', 3);
    expect(onFieldChange).toHaveBeenCalledWith('enabled', false);
    expect(onFieldChange).toHaveBeenCalledWith('mode', 'safe');
  });

  it('keeps the shell open when save rejects', async () => {
    const onClose = vi.fn();
    const onSaveError = vi.fn();
    const error = new Error('save failed');

    render(
      <SettingsDialogShell
        isOpen={true}
        onClose={onClose}
        title="Settings"
        ariaLabel="Settings"
        onSave={() => Promise.reject(error)}
        onSaveError={onSaveError}
      >
        <span>Body</span>
      </SettingsDialogShell>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSaveError).toHaveBeenCalledWith(error));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('disables save when the settings target is unavailable', () => {
    render(
      <SettingsDialogShell
        isOpen={true}
        onClose={vi.fn()}
        title="Settings"
        ariaLabel="Settings"
        unavailableMessage="Open a workspace first."
        onSave={vi.fn()}
      >
        <span>Body</span>
      </SettingsDialogShell>
    );

    expect(screen.getByText('Open a workspace first.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.queryByText('Body')).not.toBeInTheDocument();
  });
});
