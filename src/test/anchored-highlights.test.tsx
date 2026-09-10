import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Markdown } from '@/components/common/Markdown';
afterEach(cleanup);
describe('passage highlights', () => {
  it('anchors across formatting without duplicating the passage and opens notes by keyboard', () => {
    const open = vi.fn();
    const {container} = render(<Markdown content="A **bright** idea with *careful* evidence." highlights={[{id:'note',quote:'bright idea with careful'}]} onHighlightClick={open}/>);
    expect(container.textContent).toBe('A bright idea with careful evidence.');
    expect(container.querySelector('strong mark')).toHaveTextContent('bright');
    expect(container.querySelector('em mark')).toHaveTextContent('careful');
    fireEvent.keyDown(screen.getAllByRole('button')[0], {key:'Enter'});
    expect(open).toHaveBeenCalledWith('note');
  });
  it('does not misplace stale or ambiguous quotes after edits', () => {
    const {container} = render(<Markdown content="Echo then Echo." highlights={[{id:'old',quote:'Removed words'},{id:'ambiguous',quote:'Echo'}]}/>);
    expect(container.querySelector('mark')).toBeNull();
    expect(container.textContent).toBe('Echo then Echo.');
  });
  it('preserves safe links and makes no highlights without supplied authorized notes', () => {
    const {container} = render(<Markdown content="[Source](https://example.com) and **bold**."/ >);
    expect(screen.getByRole('link')).toHaveAttribute('href','https://example.com');
    expect(container.querySelector('mark')).toBeNull();
  });
});
