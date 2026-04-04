import React from 'react';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';
import { DCOLORS } from './constants';

interface IconProps {
  size?: number;
  color?: string;
}

export function IconCheck({ size = 20, color = DCOLORS.mint }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline
        points="20 6 9 17 4 12"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconClock({ size = 20, color = DCOLORS.blue }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} />
      <Polyline
        points="12 6 12 12 16 14"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconAlert({ size = 20, color = DCOLORS.coral }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1={12} y1={9} x2={12} y2={13} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1={12} y1={17} x2={12.01} y2={17} stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function IconBrain({ size = 20, color = DCOLORS.lavender }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.5 2A5.5 5.5 0 0 0 4 7.5c0 1.5.6 2.9 1.6 3.9L12 18l6.4-6.6A5.5 5.5 0 0 0 12 2.5 5.5 5.5 0 0 0 9.5 2z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 18v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function IconTrendUp({ size = 16, color = DCOLORS.mint }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline
        points="23 6 13.5 15.5 8.5 10.5 1 18"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points="17 6 23 6 23 12"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconTrendDown({ size = 16, color = DCOLORS.coral }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline
        points="23 18 13.5 8.5 8.5 13.5 1 6"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points="17 18 23 18 23 12"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconWallet({ size = 20, color = DCOLORS.coral }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x={1}
        y={4}
        width={22}
        height={16}
        rx={3}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M1 10h22" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={18} cy={15} r={1} fill={color} />
    </Svg>
  );
}

export function IconChevronRight({ size = 18, color = DCOLORS.textMuted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline
        points="9 18 15 12 9 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconBell({ size = 20, color = DCOLORS.navy }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconCalendar({ size = 20, color = DCOLORS.blue }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x={3}
        y={4}
        width={18}
        height={18}
        rx={2}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1={16} y1={2} x2={16} y2={6} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1={8} y1={2} x2={8} y2={6} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1={3} y1={10} x2={21} y2={10} stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
