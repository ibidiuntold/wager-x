'use client';

import React from 'react';
import WagerDetails from '@/components/wagers/WagerDetails';
import LayoutSelector from '@/components/common/LayoutSelector';

export default function WagerPage() {
  return (
    <LayoutSelector layoutType="game">
      <WagerDetails />
      
    </LayoutSelector>
  );
}