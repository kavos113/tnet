import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { oneDark } from '@codemirror/theme-one-dark';
import { autocompletion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';

export interface CodeMirrorInstance {
  view: EditorView;
  updateContent: (content: string) => void;
  getContent: () => string;
  destroy: () => void;
  setEditorStyle: (style: Record<string, string>) => void;
}

const keywordAutocompletion =
  (rootDir: string) =>
  async (context: CompletionContext): Promise<CompletionResult | null> => {
    const match = context.matchBefore(/\[\[([^\]]*)$/);
    if (!match) {
      return null;
    }

    const keywords = await window.electronAPI.loadKeywords(rootDir);
    const options = Object.entries(keywords).map(([name, path]) => ({
      label: name,
      apply: `${path}|${name}`,
      type: 'keyword'
    }));

    return {
      from: match.from + 2,
      options,
      validFor: /^\[\[[^\]]*$/
    };
  };

const tagAutocompletion = () => {
  const commands = [
    {
      label: 'keyword name',
      apply: 'keyword name="">\n\n</keyword>',
      type: 'keyword'
    },
    {
      label: 'keyword prop',
      apply: 'keyword noindex number-class="" prefix="命題">\n\n</keyword>',
      type: 'keyword'
    },
    {
      label: 'keyword lemma',
      apply: 'keyword noindex number-class="" prefix="補題">\n\n</keyword>',
      type: 'keyword'
    },
    {
      label: 'keyword cor',
      apply: 'keyword noindex number-class="" prefix="系">\n\n</keyword>',
      type: 'keyword'
    },
    {
      label: 'detail proof',
      apply: 'details>\n<summary>証明</summary>\n\n</details>',
      type: 'keyword'
    }
  ];

  return (context: CompletionContext): CompletionResult | null => {
    const match = context.matchBefore(/<([a-zA-Z]*)$/);
    if (!match) {
      return null;
    }
    const word = match.text.slice(1); // Remove the leading '<'

    const filteredOptions = commands.filter((cmd) =>
      cmd.apply.toLowerCase().startsWith(`${word.toLowerCase()}`)
    );

    return {
      from: match.from + 1, // Start completion after '<'
      options: filteredOptions,
      validFor: /^<([a-zA-Z]*)$/
    };
  };
};

const katexAutocompletion = () => {
  const latexCommands = [
    { label: '\\alpha', apply: 'alpha', type: 'keyword' },
    { label: '\\beta', apply: 'beta', type: 'keyword' },
    { label: '\\gamma', apply: 'gamma', type: 'keyword' },
    { label: '\\delta', apply: 'delta', type: 'keyword' },
    { label: '\\epsilon', apply: 'epsilon', type: 'keyword' },
    { label: '\\zeta', apply: 'zeta', type: 'keyword' },
    { label: '\\eta', apply: 'eta', type: 'keyword' },
    { label: '\\theta', apply: 'theta', type: 'keyword' },
    { label: '\\iota', apply: 'iota', type: 'keyword' },
    { label: '\\kappa', apply: 'kappa', type: 'keyword' },
    { label: '\\lambda', apply: 'lambda', type: 'keyword' },
    { label: '\\mu', apply: 'mu', type: 'keyword' },
    { label: '\\nu', apply: 'nu', type: 'keyword' },
    { label: '\\xi', apply: 'xi', type: 'keyword' },
    { label: '\\pi', apply: 'pi', type: 'keyword' },
    { label: '\\rho', apply: 'rho', type: 'keyword' },
    { label: '\\sigma', apply: 'sigma', type: 'keyword' },
    { label: '\\tau', apply: 'tau', type: 'keyword' },
    { label: '\\upsilon', apply: 'upsilon', type: 'keyword' },
    { label: '\\phi', apply: 'phi', type: 'keyword' },
    { label: '\\chi', apply: 'chi', type: 'keyword' },
    { label: '\\psi', apply: 'psi', type: 'keyword' },
    { label: '\\omega', apply: 'omega', type: 'keyword' },
    { label: '\\Gamma', apply: 'Gamma', type: 'keyword' },
    { label: '\\Delta', apply: 'Delta', type: 'keyword' },
    { label: '\\Theta', apply: 'Theta', type: 'keyword' },
    { label: '\\Lambda', apply: 'Lambda', type: 'keyword' },
    { label: '\\Xi', apply: 'Xi', type: 'keyword' },
    { label: '\\Pi', apply: 'Pi', type: 'keyword' },
    { label: '\\Sigma', apply: 'Sigma', type: 'keyword' },
    { label: '\\Upsilon', apply: 'Upsilon', type: 'keyword' },
    { label: '\\Phi', apply: 'Phi', type: 'keyword' },
    { label: '\\Psi', apply: 'Psi', type: 'keyword' },
    { label: '\\Omega', apply: 'Omega', type: 'keyword' },
    { label: '\\sqrt{}', apply: 'sqrt{}', type: 'keyword' },
    { label: '\\frac{}{}', apply: 'frac{}{}', type: 'keyword' },
    { label: '\\sum', apply: 'sum', type: 'keyword' },
    { label: '\\int', apply: 'int', type: 'keyword' },
    { label: '\\lim', apply: 'lim', type: 'keyword' },
    { label: '\\infty', apply: 'infty', type: 'keyword' },
    { label: '\\vec{}', apply: 'vec{}', type: 'keyword' },
    { label: '\\cdot', apply: 'cdot', type: 'keyword' },
    { label: '\\times', apply: 'times', type: 'keyword' },
    { label: '\\div', apply: 'div', type: 'keyword' },
    { label: '\\pm', apply: 'pm', type: 'keyword' },
    { label: '\\mp', apply: 'mp', type: 'keyword' },
    { label: '\\approx', apply: 'approx', type: 'keyword' },
    { label: '\\neq', apply: 'neq', type: 'keyword' },
    { label: '\\leq', apply: 'leq', type: 'keyword' },
    { label: '\\geq', apply: 'geq', type: 'keyword' },
    { label: '\\subset', apply: 'subset', type: 'keyword' },
    { label: '\\supset', apply: 'supset', type: 'keyword' },
    { label: '\\subseteq', apply: 'subseteq', type: 'keyword' },
    { label: '\\supseteq', apply: 'supseteq', type: 'keyword' },
    { label: '\\in', apply: 'in', type: 'keyword' },
    { label: '\\notin', apply: 'notin', type: 'keyword' },
    { label: '\\forall', apply: 'forall', type: 'keyword' },
    { label: '\\exists', apply: 'exists', type: 'keyword' },
    { label: '\\nabla', apply: 'nabla', type: 'keyword' },
    { label: '\\partial', apply: 'partial', type: 'keyword' },
    { label: '\\prime', apply: 'prime', type: 'keyword' },
    { label: '\\emptyset', apply: 'emptyset', type: 'keyword' },
    { label: '\\mathbb{R}', apply: 'mathbb{R}', type: 'keyword' },
    { label: '\\mathbb{C}', apply: 'mathbb{C}', type: 'keyword' },
    { label: '\\mathcal{}', apply: 'mathcal{}', type: 'keyword' },
    {
      label: '\\begin{pmatrix}\\end{pmatrix}',
      apply: 'begin{pmatrix}\n\n\\end{pmatrix}',
      type: 'keyword'
    },
    {
      label: '\\begin{vmatrix}\\end{vmatrix}',
      apply: 'begin{vmatrix}\n\n\\end{vmatrix}',
      type: 'keyword'
    },
    {
      label: '\\begin{bmatrix}\\end{bmatrix}',
      apply: 'begin{bmatrix}\n\n\\end{bmatrix}',
      type: 'keyword'
    },
    {
      label: '\\begin{Bmatrix}\\end{Bmatrix}',
      apply: 'begin{Bmatrix}\n\n\\end{Bmatrix}',
      type: 'keyword'
    },
    {
      label: '\\begin{Vmatrix}\\end{Vmatrix}',
      apply: 'begin{Vmatrix}\n\n\\end{Vmatrix}',
      type: 'keyword'
    },
    {
      label: '\\begin{array}{c}\\end{array}',
      apply: 'begin{array}{c}\n\n\\end{array}',
      type: 'keyword'
    },
    {
      label: '\\begin{align}\\end{align}',
      apply: 'begin{align}\n\n\\end{align}',
      type: 'keyword'
    },
    {
      label: '\\begin{equation}\\end{equation}',
      apply: 'begin{equation}\n\n\\end{equation}',
      type: 'keyword'
    },
    { label: '\\left(\\right)', apply: 'left(\\right)', type: 'keyword' },
    { label: '\\left[\\right]', apply: 'left[\\right]', type: 'keyword' },
    { label: '\\left\\{\\right\\}', apply: 'left\\{\\right\\}', type: 'keyword' },
    { label: '\\left|\\right|', apply: 'left|\\right|', type: 'keyword' },
    { label: '\\left\\|\\right\\|', apply: 'left\\|\\right\\|', type: 'keyword' },
    { label: '\\dots', apply: 'dots', type: 'keyword' },
    { label: '\\cdots', apply: 'cdots', type: 'keyword' },
    { label: '\\vdots', apply: 'vdots', type: 'keyword' },
    { label: '\\ddots', apply: 'ddots', type: 'keyword' },
    { label: '\\dotsb', apply: 'dotsb', type: 'keyword' },
    { label: '\\dotsc', apply: 'dotsc', type: 'keyword' },
    { label: '\\dotsi', apply: 'dotsi', type: 'keyword' },
    { label: '\\dotsm', apply: 'dotsm', type: 'keyword' },
    { label: '\\dotso', apply: 'dotso', type: 'keyword' },
    { label: '\\pmod{}', apply: 'pmod{}', type: 'keyword' },
    { label: '\\text{}', apply: 'text{}', type: 'keyword' },
    { label: '\\mathrm{}', apply: 'mathrm{}', type: 'keyword' },
    { label: '\\mathbf{}', apply: 'mathbf{}', type: 'keyword' },
    { label: '\\textit{}', apply: 'textit{}', type: 'keyword' },
    { label: '\\underline{}', apply: 'underline{}', type: 'keyword' },
    { label: '\\overline{}', apply: 'overline{}', type: 'keyword' },
    { label: '\\vec{}', apply: 'vec{}', type: 'keyword' },
    { label: '\\hat{}', apply: 'hat{}', type: 'keyword' },
    { label: '\\tilde{}', apply: 'tilde{}', type: 'keyword' },
    { label: '\\dot{}', apply: 'dot{}', type: 'keyword' },
    { label: '\\ddot{}', apply: 'ddot{}', type: 'keyword' },
    { label: '\\frac{d}{dx}', apply: 'frac{d}{dx}', type: 'keyword' },
    {
      label: '\\frac{\\partial}{\\partial x}',
      apply: 'frac{\\partial}{\\partial x}',
      type: 'keyword'
    },
    { label: '\\sum_{n=0}^{\\infty}', apply: 'sum_{n=0}^{\\infty}', type: 'keyword' },
    { label: '\\int_{a}^{b}', apply: 'int_{a}^{b}', type: 'keyword' },
    { label: '\\lim_{x\\to\\infty}', apply: 'lim_{x\\to\\infty}', type: 'keyword' },
    { label: '\\log', apply: 'log', type: 'keyword' },
    { label: '\\ln', apply: 'ln', type: 'keyword' },
    { label: '\\sin', apply: 'sin', type: 'keyword' },
    { label: '\\cos', apply: 'cos', type: 'keyword' },
    { label: '\\tan', apply: 'tan', type: 'keyword' },
    { label: '\\arcsin', apply: 'arcsin', type: 'keyword' },
    { label: '\\arccos', apply: 'arccos', type: 'keyword' },
    { label: '\\arctan', apply: 'arctan', type: 'keyword' },
    { label: '\\sinh', apply: 'sinh', type: 'keyword' },
    { label: '\\cosh', apply: 'cosh', type: 'keyword' },
    { label: '\\tanh', apply: 'tanh', type: 'keyword' },
    { label: '\\det', apply: 'det', type: 'keyword' },
    { label: '\\dim', apply: 'dim', type: 'keyword' },
    { label: '\\exp', apply: 'exp', type: 'keyword' },
    { label: '\\gcd', apply: 'gcd', type: 'keyword' },
    { label: '\\hom', apply: 'hom', type: 'keyword' },
    { label: '\\ker', apply: 'ker', type: 'keyword' },
    { label: '\\max', apply: 'max', type: 'keyword' },
    { label: '\\min', apply: 'min', type: 'keyword' },
    { label: '\\sup', apply: 'sup', type: 'keyword' },
    { label: '\\inf', apply: 'inf', type: 'keyword' },
    { label: '\\arg', apply: 'arg', type: 'keyword' },
    { label: '\\deg', apply: 'deg', type: 'keyword' },
    { label: '\\Pr', apply: 'Pr', type: 'keyword' },
    { label: '\\lim_{n\\to\\infty}', apply: 'lim_{n\\to\\infty}', type: 'keyword' },
    { label: '\\rightarrow', apply: 'rightarrow', type: 'keyword' },
    { label: '\\leftarrow', apply: 'leftarrow', type: 'keyword' },
    { label: '\\Rightarrow', apply: 'Rightarrow', type: 'keyword' },
    { label: '\\Leftarrow', apply: 'Leftarrow', type: 'keyword' },
    { label: '\\leftrightarrow', apply: 'leftrightarrow', type: 'keyword' },
    { label: '\\Leftrightarrow', apply: 'Leftrightarrow', type: 'keyword' },
    { label: '\\longrightarrow', apply: 'longrightarrow', type: 'keyword' },
    { label: '\\longleftarrow', apply: 'longleftarrow', type: 'keyword' },
    { label: '\\Longrightarrow', apply: 'Longrightarrow', type: 'keyword' },
    { label: '\\Longleftarrow', apply: 'Longleftarrow', type: 'keyword' },
    { label: '\\longleftrightarrow', apply: 'longleftrightarrow', type: 'keyword' },
    { label: '\\Longleftrightarrow', apply: 'Longleftrightarrow', type: 'keyword' },
    { label: '\\mapsto', apply: 'mapsto', type: 'keyword' },
    { label: '\\implies', apply: 'implies', type: 'keyword' },
    { label: '\\impliedby', apply: 'impliedby', type: 'keyword' },
    { label: '\\iff', apply: 'iff', type: 'keyword' },
    { label: '\\land', apply: 'land', type: 'keyword' },
    { label: '\\lor', apply: 'lor', type: 'keyword' },
    { label: '\\neg', apply: 'neg', type: 'keyword' },
    { label: '\\oplus', apply: 'oplus', type: 'keyword' },
    { label: '\\otimes', apply: 'otimes', type: 'keyword' },
    { label: '\\times', apply: 'times', type: 'keyword' },
    { label: '\\cdot', apply: 'cdot', type: 'keyword' },
    { label: '\\circ', apply: 'circ', type: 'keyword' },
    { label: '\\bullet', apply: 'bullet', type: 'keyword' },
    { label: '\\star', apply: 'star', type: 'keyword' },
    { label: '\\ast', apply: 'ast', type: 'keyword' },
    { label: '\\dagger', apply: 'dagger', type: 'keyword' },
    { label: '\\ddagger', apply: 'ddagger', type: 'keyword' },
    { label: '\\amalg', apply: 'amalg', type: 'keyword' },
    { label: '\\diamond', apply: 'diamond', type: 'keyword' },
    { label: '\\triangle', apply: 'triangle', type: 'keyword' },
    { label: '\\nabla', apply: 'nabla', type: 'keyword' },
    { label: '\\square', apply: 'square', type: 'keyword' },
    { label: '\\blacksquare', apply: 'blacksquare', type: 'keyword' },
    { label: '\\clubsuit', apply: 'clubsuit', type: 'keyword' },
    { label: '\\diamondsuit', apply: 'diamondsuit', type: 'keyword' },
    { label: '\\heartsuit', apply: 'heartsuit', type: 'keyword' },
    { label: '\\spadesuit', apply: 'spadesuit', type: 'keyword' },
    { label: '\\angle', apply: 'angle', type: 'keyword' },
    { label: '\\measuredangle', apply: 'measuredangle', type: 'keyword' },
    { label: '\\infty', apply: 'infty', type: 'keyword' },
    { label: '\\prime', apply: 'prime', type: 'keyword' },
    { label: '\\emptyset', apply: 'emptyset', type: 'keyword' },
    { label: '\\ldots', apply: 'ldots', type: 'keyword' },
    { label: '\\cdots', apply: 'cdots', type: 'keyword' },
    { label: '\\vdots', apply: 'vdots', type: 'keyword' },
    { label: '\\ddots', apply: 'ddots', type: 'keyword' },
    { label: '\\aleph', apply: 'aleph', type: 'keyword' },
    { label: '\\beth', apply: 'beth', type: 'keyword' },
    { label: '\\daleth', apply: 'daleth', type: 'keyword' },
    { label: '\\gimel', apply: 'gimel', type: 'keyword' },
    { label: '\\hbar', apply: 'hbar', type: 'keyword' },
    { label: '\\ell', apply: 'ell', type: 'keyword' },
    { label: '\\wp', apply: 'wp', type: 'keyword' },
    { label: '\\Re', apply: 'Re', type: 'keyword' },
    { label: '\\Im', apply: 'Im', type: 'keyword' },
    { label: '\\partial', apply: 'partial', type: 'keyword' },
    { label: '\\forall', apply: 'forall', type: 'keyword' },
    { label: '\\exists', apply: 'exists', type: 'keyword' },
    { label: '\\neg', apply: 'neg', type: 'keyword' },
    { label: '\\top', apply: 'top', type: 'keyword' },
    { label: '\\bot', apply: 'bot', type: 'keyword' },
    { label: '\\vdash', apply: 'vdash', type: 'keyword' },
    { label: '\\models', apply: 'models', type: 'keyword' },
    { label: '\\langle', apply: 'langle', type: 'keyword' },
    { label: '\\rangle', apply: 'rangle', type: 'keyword' },
    { label: '\\{', apply: '{', type: 'keyword' },
    { label: '\\}', apply: '}', type: 'keyword' },
    { label: '\\left\\{', apply: 'left\\{', type: 'keyword' },
    { label: '\\right\\}', apply: 'right\\}', type: 'keyword' },
    { label: '\\left[', apply: 'left[', type: 'keyword' },
    { label: '\\right]', apply: 'right]', type: 'keyword' },
    { label: '\\left(', apply: 'left(', type: 'keyword' },
    { label: '\\right)', apply: 'right)', type: 'keyword' },
    { label: '\\left|', apply: 'left|', type: 'keyword' },
    { label: '\\right|', apply: 'right|', type: 'keyword' },
    { label: '\\left\\|', apply: 'left\\|', type: 'keyword' },
    { label: '\\right\\|', apply: 'right\\|', type: 'keyword' },
    { label: '\\left\\langle', apply: 'left\\langle', type: 'keyword' },
    { label: '\\right\\rangle', apply: 'right\\rangle', type: 'keyword' },
    {
      label: '\\begin{cases}\\end{cases}',
      apply: 'begin{cases}\n\n\\end{cases}',
      type: 'keyword'
    },
    {
      label: '\\begin{matrix}\\end{matrix}',
      apply: 'begin{matrix}\n\n\\end{matrix}',
      type: 'keyword'
    },
    {
      label: '\\begin{pmatrix}\\end{pmatrix}',
      apply: 'begin{pmatrix}\n\n\\end{pmatrix}',
      type: 'keyword'
    },
    {
      label: '\\begin{bmatrix}\\end{bmatrix}',
      apply: 'begin{bmatrix}\n\n\\end{bmatrix}',
      type: 'keyword'
    },
    {
      label: '\\begin{vmatrix}\\end{vmatrix}',
      apply: 'begin{vmatrix}\n\n\\end{vmatrix}',
      type: 'keyword'
    },
    {
      label: '\\begin{Vmatrix}\\end{Vmatrix}',
      apply: 'begin{Vmatrix}\n\n\\end{Vmatrix}',
      type: 'keyword'
    },
    {
      label: '\\begin{Bmatrix}\\end{Bmatrix}',
      apply: 'begin{Bmatrix}\n\n\\end{Bmatrix}',
      type: 'keyword'
    },
    {
      label: '\\begin{align*}\\end{align*}',
      apply: 'begin{align*}\n\n\\end{align*}',
      type: 'keyword'
    },
    {
      label: '\\begin{equation*}\\end{equation*}',
      apply: 'begin{equation*}\n\n\\end{equation*}',
      type: 'keyword'
    },
    { label: '\\text{}', apply: 'text{}', type: 'keyword' },
    { label: '\\quad', apply: 'quad', type: 'keyword' },
    { label: '\\qquad', apply: 'qquad', type: 'keyword' },
    { label: '\\;', apply: ';', type: 'keyword' },
    { label: '\\:', apply: ':', type: 'keyword' },
    { label: '\\,', apply: ',', type: 'keyword' },
    { label: '\\!', apply: '!', type: 'keyword' },
    { label: '\\phantom{}', apply: 'phantom{}', type: 'keyword' },
    { label: '\\hphantom{}', apply: 'hphantom{}', type: 'keyword' },
    { label: '\\vphantom{}', apply: 'vphantom{}', type: 'keyword' },
    { label: '\\boxed{}', apply: 'boxed{}', type: 'keyword' },
    { label: '\\color{}', apply: 'color{}', type: 'keyword' },
    { label: '\\textcolor{}{} ', apply: 'textcolor{}{} ', type: 'keyword' },
    { label: '\\colorbox{}{} ', apply: 'colorbox{}{} ', type: 'keyword' },
    { label: '\\fcolorbox{}{} ', apply: 'fcolorbox{}{} ', type: 'keyword' },
    { label: '\\cancel{}', apply: 'cancel{}', type: 'keyword' },
    { label: '\\bcancel{}', apply: 'bcancel{}', type: 'keyword' },
    { label: '\\xcancel{}', apply: 'xcancel{}', type: 'keyword' },
    { label: '\\sout{}', apply: 'sout{}', type: 'keyword' },
    { label: '\\overrightarrow{}', apply: 'overrightarrow{}', type: 'keyword' },
    { label: '\\overleftarrow{}', apply: 'overleftarrow{}', type: 'keyword' },
    { label: '\\overleftrightarrow{}', apply: 'overleftrightarrow{}', type: 'keyword' },
    { label: '\\underrightarrow{}', apply: 'underrightarrow{}', type: 'keyword' },
    { label: '\\underleftarrow{}', apply: 'underleftarrow{}', type: 'keyword' },
    { label: '\\underleftrightarrow{}', apply: 'underleftrightarrow{}', type: 'keyword' },
    { label: '\\xleftarrow{}', apply: 'xleftarrow{}', type: 'keyword' },
    { label: '\\xrightarrow{}', apply: 'xrightarrow{}', type: 'keyword' },
    { label: '\\xLeftarrow{}', apply: 'xLeftarrow{}', type: 'keyword' },
    { label: '\\xRightarrow{}', apply: 'xRightarrow{}', type: 'keyword' },
    { label: '\\xleftrightarrow{}', apply: 'xleftrightarrow{}', type: 'keyword' },
    { label: '\\xLeftrightarrow{}', apply: 'xLeftrightarrow{}', type: 'keyword' },
    { label: '\\stackrel{}{} ', apply: 'stackrel{}{} ', type: 'keyword' },
    { label: '\\overset{}{} ', apply: 'overset{}{} ', type: 'keyword' },
    { label: '\\underset{}{} ', apply: 'underset{}{} ', type: 'keyword' },
    { label: '\\substack{}', apply: 'substack{}', type: 'keyword' },
    { label: '\\boxed{}', apply: 'boxed{}', type: 'keyword' },
    { label: '\\text{d}x', apply: 'text{d}x', type: 'keyword' }
  ];

  return (context: CompletionContext): CompletionResult | null => {
    const match = context.matchBefore(/\\([a-zA-Z]*)$/);
    if (!match) {
      return null;
    }
    const word = match.text.slice(1); // Remove the leading '\\'

    const filteredOptions = latexCommands.filter((cmd) =>
      cmd.label.toLowerCase().startsWith(`\\${word.toLowerCase()}`)
    );

    return {
      from: match.from + 1, // Start completion after '\\'
      options: filteredOptions,
      validFor: /^\\([a-zA-Z]*)$/
    };
  };
};

export const createCodeMirrorEditor = (
  container: HTMLElement,
  initialContent: string,
  onChange: (content: string) => void,
  isDarkTheme = false,
  rootDir: string
): CodeMirrorInstance => {
  const editorTheme = EditorView.theme({
    '&': {
      height: '100%',
      fontSize: '14px',
      fontFamily: '"Consolas", "Monaco", "Courier New", monospace'
    },
    '.cm-content': {
      padding: '12px',
      minHeight: '100%'
    },
    '.cm-editor': {
      height: '100%'
    },
    '.cm-scroller': {
      fontFamily: 'inherit'
    },
    '.cm-line': {
      padding: '0 2px'
    },
    '.cm-gutters': {
      backgroundColor: 'var(--bg-color)',
      borderRight: '1px solid var(--border-color)'
    },
    '.cm-activeLine': {
      backgroundColor: 'var(--sidebar-bg)'
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'var(--sidebar-bg)'
    },
    '.cm-selectionMatch': {
      backgroundColor: 'var(--accent-color-light)'
    },
    '.cm-link': {
      color: 'var(--accent-color)'
    },
    '.cm-url': {
      color: 'var(--accent-color)'
    },
    '.cm-keyword': {
      color: '#c678dd'
    },
    '.cm-comment': {
      color: '#5c6370',
      fontStyle: 'italic'
    },
    '.cm-string': {
      color: '#98c379'
    },
    '.cm-number': {
      color: '#d19a66'
    },
    '.cm-variableName': {
      color: '#e06c75'
    },
    '.cm-typeName': {
      color: '#e5c07b'
    },
    '.cm-operator': {
      color: '#56b6c2'
    },
    '.cm-punctuation': {
      color: '#abb2bf'
    },
    '.cm-property': {
      color: '#e06c75'
    },
    '.cm-className': {
      color: '#e5c07b'
    },
    '.cm-tag': {
      color: '#e06c75'
    },
    '.cm-attributeName': {
      color: '#d19a66'
    },
    '.cm-attributeValue': {
      color: '#98c379'
    },
    '.cm-qualifier': {
      color: '#e5c07b'
    },
    '.cm-meta': {
      color: '#abb2bf'
    },
    '.cm-hr': {
      color: '#abb2bf'
    },
    '.cm-quote': {
      color: '#98c379',
      fontStyle: 'italic'
    },
    '.cm-header': {
      color: '#61afef',
      fontWeight: 'bold'
    },
    '.cm-strong': {
      fontWeight: 'bold'
    },
    '.cm-emphasis': {
      fontStyle: 'italic'
    },
    '.cm-strikethrough': {
      textDecoration: 'line-through'
    },
    '.cm-atom': {
      color: '#d19a66'
    },
    '.cm-def': {
      color: '#e06c75'
    },
    '.cm-bracket': {
      color: '#abb2bf'
    },
    '.cm-builtin': {
      color: '#e5c07b'
    },
    '.cm-error': {
      color: '#e06c75'
    },
    '.cm-invalid': {
      color: '#e06c75'
    },
    '.cm-codeblock': {
      backgroundColor: '#2c313a',
      borderRadius: '4px',
      padding: '10px',
      fontFamily: '"Fira Code", "Courier New", monospace'
    }
  });

  const extensions = [
    basicSetup,
    markdown({
      base: markdownLanguage,
      codeLanguages: languages
    }),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChange(update.state.doc.toString());
      }
    }),
    editorTheme,
    autocompletion({
      override: [keywordAutocompletion(rootDir), katexAutocompletion(), tagAutocompletion()]
    }),
    EditorView.lineWrapping
  ];

  if (isDarkTheme) {
    extensions.push(oneDark);
  }

  const state = EditorState.create({
    doc: initialContent,
    extensions
  });

  const view = new EditorView({
    state,
    parent: container
  });

  return {
    view,
    updateContent: (content: string) => {
      const currentContent = view.state.doc.toString();
      if (currentContent !== content) {
        view.dispatch({
          changes: {
            from: 0,
            to: view.state.doc.length,
            insert: content
          }
        });
      }
    },
    getContent: () => view.state.doc.toString(),
    destroy: () => view.destroy(),
    setEditorStyle: (style: Record<string, string>) => {
      const cmElement = view.dom;
      if (cmElement) {
        if (style.fontFamily) {
          cmElement.style.fontFamily = style.fontFamily;
        }
        if (style.fontSize) {
          cmElement.style.fontSize = style.fontSize;
        }
      }
    }
  };
};
