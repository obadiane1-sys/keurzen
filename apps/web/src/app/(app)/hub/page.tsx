'use client';

import React from 'react';
import {
  HubHeader,
  HubCarousel,
  HubTilesGrid,
} from '@/components/hub';
import { StaggerChild } from '@/components/ui/AnimatedPage';

export default function HubPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-6">
      <StaggerChild index={0}>
        <HubHeader />
      </StaggerChild>
      <StaggerChild index={1}>
        <HubCarousel />
      </StaggerChild>
      <StaggerChild index={2}>
        <HubTilesGrid />
      </StaggerChild>
    </div>
  );
}
