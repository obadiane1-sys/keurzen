'use client';

import React from 'react';
import { HubScoreCard } from './HubScoreCard';
import { HubTodayTasksCard } from './HubTodayTasksCard';
import { HubActivityCard } from './HubActivityCard';

export function HubCarousel() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <HubScoreCard />
      <HubTodayTasksCard />
      <HubActivityCard />
    </div>
  );
}
