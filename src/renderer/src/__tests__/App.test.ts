import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import App from '../App.vue';

vi.mock('../components/MainLayout.vue', () => ({
  default: { template: '<div class="mock-main-layout">MainLayout</div>' }
}));

vi.mock('../components/Settings.vue', () => ({
  default: {
    template: '<div class="mock-settings" v-if="isOpen">Settings</div>',
    props: ['isOpen']
  }
}));

describe('App.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('MainLayoutを表示する', () => {
    const wrapper = mount(App);
    expect(wrapper.find('.mock-main-layout').exists()).toBe(true);
  });

  it('初期状態ではSettingsモーダルは非表示', () => {
    const wrapper = mount(App);
    expect(wrapper.find('.mock-settings').exists()).toBe(false);
  });

  it('Ctrl+,でSettingsモーダルが表示される', async () => {
    const wrapper = mount(App);

    const event = new KeyboardEvent('keydown', {
      key: ',',
      ctrlKey: true,
      bubbles: true
    });
    document.dispatchEvent(event);
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.mock-settings').exists()).toBe(true);
  });
});
