import type { Completion } from '@codemirror/autocomplete';

export const tagCompletions: Completion[] = [
  {
    label: 'keyword name',
    apply: 'keyword name="">\n\n</keyword>',
    type: 'keyword'
  },
  {
    label: 'keyword proposition',
    apply: 'keyword noindex number-class="" prefix="Proposition">\n\n</keyword>',
    type: 'keyword'
  },
  {
    label: 'keyword lemma',
    apply: 'keyword noindex number-class="" prefix="Lemma">\n\n</keyword>',
    type: 'keyword'
  },
  {
    label: 'details proof',
    apply: 'details>\n<summary>Proof</summary>\n\n</details>',
    type: 'keyword'
  }
];

export const latexCompletions: Completion[] = [
  '\\alpha',
  '\\beta',
  '\\gamma',
  '\\delta',
  '\\epsilon',
  '\\theta',
  '\\lambda',
  '\\mu',
  '\\pi',
  '\\sigma',
  '\\omega',
  '\\sqrt{}',
  '\\frac{}{}',
  '\\sum',
  '\\int',
  '\\lim',
  '\\infty',
  '\\mathbb{R}',
  '\\mathbb{C}',
  '\\begin{align*}\\end{align*}',
  '\\begin{equation*}\\end{equation*}'
].map((label) => ({
  label,
  apply: label.replace(/^\\/, ''),
  type: 'keyword'
}));
