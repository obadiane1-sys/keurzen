import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

interface ProgressBarProps {
  value: number;
  max: number;
  color: string;
  height?: number;
}

export function ProgressBar({ value, max, color, height = 10 }: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const animatedWidth = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      style={{
        width: '100%',
        height,
        borderRadius: height,
        backgroundColor: color + '22',
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={{
          width: animatedWidth,
          height: '100%',
          borderRadius: height,
          backgroundColor: color,
        }}
      />
    </View>
  );
}
