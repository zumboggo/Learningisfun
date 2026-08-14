import type { DeckComposition } from '@/services/study-insights';

/** New / familiar / known split of each deck, as a stacked bar per deck. */
export function DeckMakeup({ decks }: { decks: DeckComposition[] }) {
  if (decks.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-slate-400">
        No cards in your decks yet.
      </p>
    );
  }

  const totals = decks.reduce(
    (sum, deck) => ({
      newCount: sum.newCount + deck.newCount,
      familiar: sum.familiar + deck.familiar,
      known: sum.known + deck.known,
      total: sum.total + deck.total,
    }),
    { newCount: 0, familiar: 0, known: 0, total: 0 },
  );

  return (
    <div>
      <div className="makeup-legend">
        <span className="makeup-key makeup-key-known">Known {totals.known}</span>
        <span className="makeup-key makeup-key-familiar">Familiar {totals.familiar}</span>
        <span className="makeup-key makeup-key-new">New {totals.newCount}</span>
      </div>

      <ul className="makeup-list">
        {decks.map(deck => {
          const pct = (n: number) => (deck.total > 0 ? (n / deck.total) * 100 : 0);
          return (
            <li key={deck.deckId} className="makeup-row">
              <div className="makeup-row-head">
                <span className="makeup-title">{deck.title}</span>
                <span className="makeup-count">
                  {deck.known}/{deck.total} known
                </span>
              </div>
              <div
                className="makeup-bar"
                role="img"
                aria-label={
                  `${deck.title}: ${deck.known} known, ${deck.familiar} familiar, ` +
                  `${deck.newCount} new, of ${deck.total} cards.`
                }
              >
                {deck.known > 0 && (
                  <span className="makeup-seg makeup-seg-known" style={{ width: `${pct(deck.known)}%` }} />
                )}
                {deck.familiar > 0 && (
                  <span className="makeup-seg makeup-seg-familiar" style={{ width: `${pct(deck.familiar)}%` }} />
                )}
                {deck.newCount > 0 && (
                  <span className="makeup-seg makeup-seg-new" style={{ width: `${pct(deck.newCount)}%` }} />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
