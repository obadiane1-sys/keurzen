import React from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Ellipse,
  Path,
  G,
  Defs,
  RadialGradient,
  Stop,
  LinearGradient,
} from 'react-native-svg';
import { Colors } from '../../constants/tokens';

type MascotExpression = 'calm' | 'happy' | 'thinking' | 'sleepy' | 'celebrate';

interface MascotProps {
  size?: number;
  expression?: MascotExpression;
  color?: string;
  style?: ViewStyle;
}

/**
 * Keurzen Mascot — blob kawaii doux, sans bras ni jambes
 * Yeux ouverts avec reflets doux, expression apaisante
 */
export function Mascot({
  size = 80,
  expression = 'calm',
  color = Colors.success,
  style,
}: MascotProps) {
  const s = size;
  const cx = s / 2;
  const cy = s / 2;

  // Expression config
  const eyes: Record<MascotExpression, { leftY: number; rightY: number; leftX: number; rightX: number; r: number; sleepy?: boolean }> = {
    calm: { leftX: cx - s * 0.15, rightX: cx + s * 0.15, leftY: cy - s * 0.05, rightY: cy - s * 0.05, r: s * 0.07 },
    happy: { leftX: cx - s * 0.15, rightX: cx + s * 0.15, leftY: cy - s * 0.08, rightY: cy - s * 0.08, r: s * 0.07 },
    thinking: { leftX: cx - s * 0.17, rightX: cx + s * 0.13, leftY: cy - s * 0.05, rightY: cy - s * 0.08, r: s * 0.07 },
    sleepy: { leftX: cx - s * 0.15, rightX: cx + s * 0.15, leftY: cy - s * 0.02, rightY: cy - s * 0.02, r: s * 0.06, sleepy: true },
    celebrate: { leftX: cx - s * 0.15, rightX: cx + s * 0.15, leftY: cy - s * 0.1, rightY: cy - s * 0.1, r: s * 0.08 },
  };

  const eyeConfig = eyes[expression];

  // Cheek blush positions
  const blushY = cy + s * 0.08;
  const blushR = s * 0.07;

  // Smile based on expression
  const smileY = cy + s * 0.18;
  const smilePath: Record<MascotExpression, string> = {
    calm: `M ${cx - s * 0.1} ${smileY} Q ${cx} ${smileY + s * 0.05} ${cx + s * 0.1} ${smileY}`,
    happy: `M ${cx - s * 0.13} ${smileY - s * 0.02} Q ${cx} ${smileY + s * 0.1} ${cx + s * 0.13} ${smileY - s * 0.02}`,
    thinking: `M ${cx - s * 0.08} ${smileY} Q ${cx + s * 0.04} ${smileY + s * 0.02} ${cx + s * 0.1} ${smileY - s * 0.01}`,
    sleepy: `M ${cx - s * 0.08} ${smileY} Q ${cx} ${smileY + s * 0.03} ${cx + s * 0.08} ${smileY}`,
    celebrate: `M ${cx - s * 0.14} ${smileY - s * 0.03} Q ${cx} ${smileY + s * 0.12} ${cx + s * 0.14} ${smileY - s * 0.03}`,
  };

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <Defs>
          <RadialGradient id="bodyGrad" cx="45%" cy="35%" r="60%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.9" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.6" />
          </RadialGradient>
          <RadialGradient id="eyeGrad" cx="35%" cy="30%" r="60%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Body — organic blob shape */}
        <Ellipse
          cx={cx}
          cy={cy + s * 0.04}
          rx={s * 0.42}
          ry={s * 0.44}
          fill="url(#bodyGrad)"
        />

        {/* Cheeks / blush */}
        <Ellipse
          cx={cx - s * 0.22}
          cy={blushY}
          rx={blushR}
          ry={blushR * 0.55}
          fill={Colors.accent}
          opacity={0.35}
        />
        <Ellipse
          cx={cx + s * 0.22}
          cy={blushY}
          rx={blushR}
          ry={blushR * 0.55}
          fill={Colors.accent}
          opacity={0.35}
        />

        {/* Left eye */}
        {eyeConfig.sleepy ? (
          <Path
            d={`M ${eyeConfig.leftX - eyeConfig.r} ${eyeConfig.leftY} Q ${eyeConfig.leftX} ${eyeConfig.leftY - eyeConfig.r * 0.4} ${eyeConfig.leftX + eyeConfig.r} ${eyeConfig.leftY}`}
            stroke={Colors.textPrimary}
            strokeWidth={s * 0.025}
            fill="none"
            strokeLinecap="round"
          />
        ) : (
          <G>
            <Circle
              cx={eyeConfig.leftX}
              cy={eyeConfig.leftY}
              r={eyeConfig.r}
              fill={Colors.textPrimary}
            />
            {/* Eye shine */}
            <Circle
              cx={eyeConfig.leftX - eyeConfig.r * 0.35}
              cy={eyeConfig.leftY - eyeConfig.r * 0.35}
              r={eyeConfig.r * 0.28}
              fill="white"
              opacity={0.9}
            />
            <Circle
              cx={eyeConfig.leftX + eyeConfig.r * 0.2}
              cy={eyeConfig.leftY + eyeConfig.r * 0.15}
              r={eyeConfig.r * 0.13}
              fill="white"
              opacity={0.5}
            />
          </G>
        )}

        {/* Right eye */}
        {eyeConfig.sleepy ? (
          <Path
            d={`M ${eyeConfig.rightX - eyeConfig.r} ${eyeConfig.rightY} Q ${eyeConfig.rightX} ${eyeConfig.rightY - eyeConfig.r * 0.4} ${eyeConfig.rightX + eyeConfig.r} ${eyeConfig.rightY}`}
            stroke={Colors.textPrimary}
            strokeWidth={s * 0.025}
            fill="none"
            strokeLinecap="round"
          />
        ) : (
          <G>
            <Circle
              cx={eyeConfig.rightX}
              cy={eyeConfig.rightY}
              r={eyeConfig.r}
              fill={Colors.textPrimary}
            />
            <Circle
              cx={eyeConfig.rightX - eyeConfig.r * 0.35}
              cy={eyeConfig.rightY - eyeConfig.r * 0.35}
              r={eyeConfig.r * 0.28}
              fill="white"
              opacity={0.9}
            />
            <Circle
              cx={eyeConfig.rightX + eyeConfig.r * 0.2}
              cy={eyeConfig.rightY + eyeConfig.r * 0.15}
              r={eyeConfig.r * 0.13}
              fill="white"
              opacity={0.5}
            />
          </G>
        )}

        {/* Smile */}
        <Path
          d={smilePath[expression]}
          stroke={Colors.textPrimary}
          strokeWidth={s * 0.025}
          fill="none"
          strokeLinecap="round"
        />

        {/* Celebrate sparkles */}
        {expression === 'celebrate' && (
          <>
            <Circle cx={cx - s * 0.35} cy={cy - s * 0.3} r={s * 0.025} fill={Colors.accent} opacity={0.7} />
            <Circle cx={cx + s * 0.35} cy={cy - s * 0.28} r={s * 0.02} fill={Colors.primary} opacity={0.8} />
            <Circle cx={cx + s * 0.3} cy={cy - s * 0.38} r={s * 0.015} fill={Colors.joy} opacity={0.7} />
          </>
        )}
      </Svg>
    </View>
  );
}
