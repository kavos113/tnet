import type { Completion } from '@codemirror/autocomplete';

export const tagCompletions: Completion[] = [
  {
    label: 'keyword name',
    apply: 'keyword name="" type="n">\n\n</keyword>',
    type: 'keyword'
  },
  {
    label: 'keyword proposition',
    apply: 'keyword noindex number-class="" prefix="命顁E type="n">\n\n</keyword>',
    type: 'keyword'
  },
  {
    label: 'keyword lemma',
    apply: 'keyword noindex number-class="" prefix="補顁E type="n">\n\n</keyword>',
    type: 'keyword'
  },
  {
    label: 'details proof',
    apply: 'details>\n<summary>証明</summary>\n\n</details>',
    type: 'keyword'
  }
];
