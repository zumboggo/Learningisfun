import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md';
}

export function Card({ children, className = '', onClick, padding = 'md' }: CardProps) {
  const pads = { none: '', sm: 'p-3', md: 'p-4' };
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-xl border border-gray-200 shadow-sm
        ${onClick ? 'cursor-pointer hover:shadow-md active:scale-[0.99] transition-all' : ''}
        ${pads[padding]} ${className}
      `}
    >
      {children}
    </div>
  );
}
