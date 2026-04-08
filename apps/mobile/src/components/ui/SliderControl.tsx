import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import { Colors } from '../../constants/tokens';

interface SliderControlProps {
  value: number;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  onValueChange: (value: number) => void;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  accessibilityLabel?: string;
  style?: object;
}

const TRACK_HEIGHT = 6;
const THUMB_SIZE = 24;

export function SliderControl({
  value,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  onValueChange,
  minimumTrackTintColor = Colors.terracotta,
  maximumTrackTintColor = Colors.border,
  thumbTintColor = Colors.terracotta,
  accessibilityLabel,
  style,
}: SliderControlProps) {
  const trackWidth = useRef(0);
  const trackX = useRef(0);
  const range = maximumValue - minimumValue;
  const fraction = range > 0 ? (value - minimumValue) / range : 0;

  const computeValue = useCallback(
    (pageX: number) => {
      if (trackWidth.current <= 0) return value;
      const x = pageX - trackX.current;
      const ratio = Math.min(Math.max(x / trackWidth.current, 0), 1);
      const raw = minimumValue + ratio * range;
      return Math.round(raw / step) * step;
    },
    [minimumValue, range, step, value],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        onValueChange(computeValue(evt.nativeEvent.pageX));
      },
      onPanResponderMove: (evt) => {
        onValueChange(computeValue(evt.nativeEvent.pageX));
      },
    }),
  ).current;

  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{
        min: minimumValue,
        max: maximumValue,
        now: value,
      }}
      onLayout={(e) => {
        trackWidth.current = e.nativeEvent.layout.width;
        (e.target as unknown as { measureInWindow: (cb: (x: number) => void) => void })
          .measureInWindow((x: number) => {
            trackX.current = x;
          });
      }}
      {...panResponder.panHandlers}
    >
      {/* Background track */}
      <View style={[styles.track, { backgroundColor: maximumTrackTintColor }]} />

      {/* Filled track */}
      <View
        style={[
          styles.track,
          styles.filledTrack,
          { backgroundColor: minimumTrackTintColor, width: `${fraction * 100}%` },
        ]}
      />

      {/* Thumb */}
      <View
        style={[
          styles.thumb,
          {
            backgroundColor: thumbTintColor,
            left: `${fraction * 100}%`,
            marginLeft: -THUMB_SIZE / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: Colors.border,
  },
  filledTrack: {
    right: undefined,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
});
