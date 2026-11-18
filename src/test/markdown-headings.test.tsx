import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { Markdown } from '@/components/common/Markdown';

it('renders Canvas fourth-level headings as enlarged headings without hash marks', () => {
  render(<Markdown content={'Introductory text\n#### 1. Copy accurately\nCopy four paragraphs.'} />);
  const heading = screen.getByRole('heading', { level: 4, name: '1. Copy accurately' });
  expect(heading.className).toContain('text-[1.15em]');
  expect(screen.queryByText(/####/)).toBeNull();
  expect(screen.getByText('Copy four paragraphs.')).toBeTruthy();
});
