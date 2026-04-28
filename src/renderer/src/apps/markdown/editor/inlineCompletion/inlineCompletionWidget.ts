import { WidgetType } from '@codemirror/view';

export class InlineCompletionWidget extends WidgetType {
  constructor(private readonly text: string) {
    super();
  }

  override toDOM(): HTMLElement {
    const element = document.createElement('span');
    element.className = 'inline-completion-ghost';
    element.textContent = this.text;
    return element;
  }

  override ignoreEvent(): boolean {
    return true;
  }
}
