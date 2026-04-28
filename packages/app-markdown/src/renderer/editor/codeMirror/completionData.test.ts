import { describe, expect, it } from 'vitest';
import { latexCompletions } from './completionData';

describe('latexCompletions', () => {
  it('contains the legacy completion set including advanced operators and environments', () => {
    const labels = latexCompletions.map((completion) => completion.label);

    expect(labels).toContain('\\alpha');
    expect(labels).toContain('\\frac{\\partial}{\\partial x}');
    expect(labels).toContain('\\Longleftrightarrow');
    expect(labels).toContain('\\begin{cases}\\end{cases}');
    expect(labels).toContain('\\begin{align*}\\end{align*}');
    expect(labels).toContain('\\textcolor{}{} ');
    expect(labels).toContain('\\text{d}x');
  });

  it('keeps legacy duplicate entries where the old completion data had them', () => {
    const labels = latexCompletions.map((completion) => completion.label);
    const count = (target: string): number => labels.filter((label) => label === target).length;

    expect(count('\\vec{}')).toBe(2);
    expect(count('\\times')).toBe(2);
    expect(count('\\cdot')).toBe(2);
    expect(count('\\boxed{}')).toBe(2);
  });
});
