/**
 * Separator Component
 */

import React from 'react';

export function Separator({ orientation = 'horizontal', className = '' }) {
  return (
    <div
      className={`shrink-0 bg-border ${
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]'
      } ${className}`}
    />
  );
}

