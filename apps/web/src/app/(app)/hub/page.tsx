'use client';

import React from 'react';
import {
  HubHeader,
  HubCarousel,
  HubTilesGrid,
} from '@/components/hub';

export default function HubPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-6">
      <HubHeader />
      <HubCarousel />
      <HubTilesGrid />
    </div>
  );
}
