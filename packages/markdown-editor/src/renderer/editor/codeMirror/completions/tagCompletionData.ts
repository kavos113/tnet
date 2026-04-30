import type { Completion } from '@codemirror/autocomplete';

export const tagCompletions: Completion[] = [
  {
    label: 'details',
    apply: 'details>\n<summary></summary>\n\n</details>',
    type: 'keyword'
  },
  {
    label: 'summary',
    apply: 'summary></summary>',
    type: 'keyword'
  },
  {
    label: 'figure',
    apply: 'figure>\n\n</figure>',
    type: 'keyword'
  }
];
