import React from 'react';
import { View, StyleSheet } from 'react-native';
import { HUB_TILES } from '@keurzen/shared';
import { HubTile } from './HubTile';

export function HubTilesGrid() {
  const rows: typeof HUB_TILES[number][][] = [];
  for (let i = 0; i < HUB_TILES.length; i += 2) {
    rows.push(HUB_TILES.slice(i, i + 2) as typeof HUB_TILES[number][]);
  }

  return (
    <View style={styles.grid}>
      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((tile) => (
            <HubTile key={tile.key} config={tile} />
          ))}
          {row.length === 1 && <View style={styles.spacer} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 12,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  spacer: {
    flex: 1,
  },
});
