<script setup lang="ts">
import { ProjectConfig } from '@fixtures/config';
import { useWorkspaceStore } from '@renderer/store/workspace';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const store = useWorkspaceStore();
const { settings } = storeToRefs(store);

const projectSettings = ref<ProjectConfig>(settings.value);

const saveSettings = async (): Promise<void> => {
  await store.saveSettings(projectSettings.value);
};
</script>

<template>
  <div v-if="props.isOpen" class="modal-overlay" @click.self="emit('close')">
    <div class="modal-content">
      <h2>設定</h2>

      <div class="settings-group">
        <h3>エディタのフォント</h3>
        <div class="form-item">
          <label for="editor-font-family">フォントファミリー</label>
          <input id="editor-font-family" v-model="projectSettings.editorFontFamily" type="text" />
        </div>
        <div class="form-item">
          <label for="editor-font-size">フォントサイズ (px)</label>
          <input
            id="editor-font-size"
            v-model.number="projectSettings.editorFontSize"
            type="number"
          />
        </div>
      </div>

      <div class="settings-group">
        <h3>プレビューのフォント</h3>
        <div class="form-item">
          <label for="preview-font-family">フォントファミリー</label>
          <input id="preview-font-family" v-model="projectSettings.previewFontFamily" type="text" />
        </div>
        <div class="form-item">
          <label for="preview-font-size">フォントサイズ (px)</label>
          <input
            id="preview-font-size"
            v-model.number="projectSettings.previewFontSize"
            type="number"
          />
        </div>
      </div>

      <div class="modal-actions">
        <button class="btn-secondary" @click="emit('close')">キャンセル</button>
        <button class="btn-primary" @click="saveSettings">保存</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--background);
  padding: 20px;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

h2 {
  margin-top: 0;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--background-dark);
  padding-bottom: 10px;
}

.settings-group {
  margin-bottom: 20px;
}

.settings-group h3 {
  margin-bottom: 15px;
  font-size: 1.1em;
}

.form-item {
  margin-bottom: 10px;
}

.form-item label {
  display: block;
  margin-bottom: 5px;
  font-size: 14px;
}

.form-item input {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--background-dark);
  border-radius: 4px;
  background-color: var(--background);
  color: var(--foreground);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-primary,
.btn-secondary {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary {
  background-color: var(--main-dark);
  color: white;
}

.btn-secondary {
  background-color: var(--gray);
  color: var(--foreground);
}
</style>
