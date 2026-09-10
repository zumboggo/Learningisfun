import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TextPresentPage } from '@/pages/teacher/TextPresentPage';
import { TextViewControls } from '@/components/texts/TextViewControls';

vi.mock('react-router-dom', () => ({ useParams: () => ({ textId: 'text' }), useNavigate: () => vi.fn() }));
vi.mock('dexie-react-hooks', () => ({ useLiveQuery: (query: () => unknown) => query() }));
vi.mock('@/db/schema', () => ({ db: {
  texts: { get: () => ({ title: 'Reading', author: 'Author' }) },
  text_paragraphs: { where: () => ({ equals: () => ({ sortBy: () => [
    { $id: 'a', content: '**First** passage.' }, { $id: 'b', content: 'Second passage.' },
  ] }) }) },
} }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('article text display', () => {
  it('presents the whole article by default, scales text, and has no phone mode', () => {
    render(<TextPresentPage/>);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second passage.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Next paragraph')).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Larger text'));
    expect(screen.getByRole('article')).toHaveStyle({ fontSize: '34px' });
    expect(screen.queryByText('Cell Phone Mode')).not.toBeInTheDocument();
  });
  it('does not intercept Space in article mode', () => {
    render(<TextPresentPage/>);
    expect(fireEvent.keyDown(window, { key: ' ', cancelable: true })).toBe(true);
  });
  it('exports formatted reading content with a safe filename', async () => {
    const create = vi.fn<(blob: Blob) => string>(() => 'blob:reading');
    vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function(this: HTMLAnchorElement) {
      expect(this.download).toBe('Title.md');
    });
    render(<TextViewControls title="Title" paragraphs={['**Bold** and [link](https://example.com)', '*Italic*']} size={22} onSize={vi.fn()}/>);
    fireEvent.click(screen.getByText('Export .md'));
    expect(click).toHaveBeenCalledOnce();
    const blob = create.mock.calls[0][0] as Blob;
    const content = await new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.readAsText(blob); });
    expect(content).toBe('# Title\n\n**Bold** and [link](https://example.com)\n\n*Italic*\n');
  });
  it('disables export when there is no extracted reading', () => {
    render(<TextViewControls title="Scan" paragraphs={[]} size={16} onSize={vi.fn()}/>);
    expect(screen.getByText('Export .md')).toBeDisabled();
    expect(screen.getByLabelText('Smaller text')).toBeDisabled();
  });
});
