/**
 * Container Component
 *
 * Reusable content container with consistent spacing and max-width.
 * Supports different sizes for layout flexibility.
 */

import { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-2xl',
};

export function Container({ children, size = 'full', className = '' }: ContainerProps) {
  return (
    <div className={`mx-auto px-lg ${sizeClasses[size]} ${className}`}>
      {children}
    </div>
  );
}
