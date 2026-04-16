import React, { useRef, useCallback } from 'react';
import {
  Pressable,
  Animated,
  StyleProp,
  ViewStyle,
  PressableProps,
} from 'react-native';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  children?: React.ReactNode;
};

export function AnimatedPressable({
  style,
  scaleTo = 0.97,
  onPressIn,
  onPressOut,
  children,
  disabled,
  ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const handleIn = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
      Animated.timing(scale, {
        toValue: scaleTo,
        duration: 80,
        useNativeDriver: true,
      }).start();
      onPressIn?.(e);
    },
    [scale, scaleTo, onPressIn],
  );

  const handleOut = useCallback(
    (e: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) => {
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 200,
        useNativeDriver: true,
      }).start();
      onPressOut?.(e);
    },
    [scale, onPressOut],
  );

  return (
    <Pressable
      onPressIn={handleIn}
      onPressOut={handleOut}
      disabled={disabled}
      {...rest}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
