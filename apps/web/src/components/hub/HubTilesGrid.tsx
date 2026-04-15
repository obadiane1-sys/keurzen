'use client';

import React from 'react';
import { HUB_TILES } from '@keurzen/shared';
import { HubTile } from './HubTile';

export function HubTilesGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 px-4 md:grid-cols-4 md:gap-4 md:px-0">
      {HUB_TILES.map((t) => (
        <HubTile key={t.key} config={t} />
      ))}
    </div>
  );
}
