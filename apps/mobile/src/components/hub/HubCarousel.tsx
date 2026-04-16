import React, { useState } from 'react';
import {
  View,
  FlatList,
  useWindowDimensions,
  StyleSheet,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { HubScoreCard } from './HubScoreCard';
import { HubTodayTasksCard } from './HubTodayTasksCard';
import { HubActivityCard } from './HubActivityCard';
import { Colors } from '../../constants/tokens';

type CardKey = 'score' | 'today' | 'activity';

const CARDS: { key: CardKey; render: () => React.ReactElement }[] = [
  { key: 'score',    render: () => <HubScoreCard /> },
  { key: 'today',    render: () => <HubTodayTasksCard /> },
  { key: 'activity', render: () => <HubActivityCard /> },
];

const H_PADDING = 16;
const GAP = 12;

export function HubCarousel() {
  const { width } = useWindowDimensions();
  const cardWidth = width - H_PADDING * 2;
  const [index, setIndex] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const next = Math.round(x / (cardWidth + GAP));
    if (next !== index) setIndex(next);
  };

  return (
    <View>
      <FlatList
        data={CARDS}
        keyExtractor={(c) => c.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + GAP}
        decelerationRate="fast"
        contentContainerStyle={{
          paddingHorizontal: H_PADDING,
          paddingVertical: 6,
          gap: GAP,
        }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={{ width: cardWidth }}>{item.render()}</View>
        )}
      />
      <View style={styles.dots}>
        {CARDS.map((c, i) => (
          <View
            key={c.key}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.primary,
    width: 18,
  },
});
