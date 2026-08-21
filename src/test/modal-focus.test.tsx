import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from '@/components/common/Modal';

describe('Modal focus', () => {
  it('does not steal focus when its parent rerenders with a new close callback', () => {
    const view = render(<Modal open onClose={() => undefined} title="Add text"><textarea aria-label="Copied text" /></Modal>);
    const textarea = screen.getByLabelText('Copied text');
    textarea.focus();
    expect(textarea).toHaveFocus();

    view.rerender(<Modal open onClose={vi.fn()} title="Add text"><textarea aria-label="Copied text" /></Modal>);
    expect(textarea).toHaveFocus();
  });
});
