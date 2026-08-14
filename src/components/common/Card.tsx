import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md';
}

/**
 * Shared surface. The `app-card` marker lets the student shell restyle every
 * card to the soft glass surface used on the student home, without each page
 * having to know which role is viewing it (see `.student-shell .app-card`).
 */
export function Card({ children, className = '', onClick, padding = 'md' }: CardProps) {
  const pads = { none: '', sm: 'p-3', md: 'p-4' };
  return (
    <div
      onClick={onClick}
      className={`
        app-card bg-white rounded-xl border border-gray-200 shadow-sm
        ${onClick ? 'app-card-tappable cursor-pointer hover:shadow-md active:scale-[0.99] transition-all' : ''}
        ${pads[padding]} ${className}
      `}
    >
      {children}
    </div>
  );
}
