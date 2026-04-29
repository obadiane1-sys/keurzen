import React, { useEffect, useRef } from 'react';
import { ViewStyle, Animated, Easing } from 'react-native';
import Svg, {
  Rect,
  Circle,
  Path,
  Ellipse,
  Line,
  G,
  Defs,
  ClipPath,
  Text as SvgText,
} from 'react-native-svg';

// ─── Types ──────────────────────────────────────────────────────────────────

export type MascotExpression =
  | 'normal'
  | 'happy'
  | 'tired'
  | 'surprised'
  | 'error'
  | 'loading';

interface KeurzenMascotProps {
  expression?: MascotExpression;
  size?: number;
  animated?: boolean;
  style?: ViewStyle;
}

// ─── Colors ─────────────────────────────────────────────────────────────────

const BROWN = '#3D2218';
const MINT = '#7DCCC3';
const MINT2 = '#52B8B0';
const CREAM = '#F5EFE0';
const CORAL = '#F0A898';
const CORALD = '#D07868';
const DOOR = '#7B5848';

// ─── Blush dots helper ──────────────────────────────────────────────────────

function BlushDots({ cx, cy }: { cx: number; cy: number }) {
  return (
    <>
      <Circle cx={cx - 8} cy={cy + 2} r={2.5} fill={CORALD} opacity={0.7} />
      <Circle cx={cx} cy={cy + 5} r={2.5} fill={CORALD} opacity={0.7} />
      <Circle cx={cx + 8} cy={cy + 2} r={2.5} fill={CORALD} opacity={0.7} />
    </>
  );
}

// ─── Ribbon stripes ─────────────────────────────────────────────────────────

function RibbonStripes() {
  const stripes = [];
  for (let i = 0; i < 16; i++) {
    const x = 190 + i * 20;
    stripes.push(
      <Line
        key={i}
        x1={x}
        y1={440}
        x2={x + 16}
        y2={472}
        stroke="white"
        strokeWidth={4}
        opacity={0.35}
      />,
    );
  }
  return (
    <>
      <Defs>
        <ClipPath id="ribbonClip">
          <Rect x={190} y={440} width={300} height={32} />
        </ClipPath>
      </Defs>
      <Rect x={190} y={440} width={300} height={32} fill={MINT} />
      <G clipPath="url(#ribbonClip)">{stripes}</G>
      <Line x1={190} y1={440} x2={490} y2={440} stroke={BROWN} strokeWidth={3.5} />
      <Line x1={190} y1={472} x2={490} y2={472} stroke={BROWN} strokeWidth={3.5} />
    </>
  );
}

// ─── Shared base layers ─────────────────────────────────────────────────────

function BaseBody() {
  return (
    <Rect
      x={190}
      y={292}
      width={300}
      height={252}
      rx={54}
      fill={CREAM}
      stroke={BROWN}
      strokeWidth={5}
    />
  );
}

function BowAndDoor() {
  return (
    <>
      {/* Bow left */}
      <Path
        d="M340,456 C330,443 303,436 288,448 C276,458 295,474 318,470 C330,468 340,462 340,456Z"
        fill={MINT}
        stroke={BROWN}
        strokeWidth={3.5}
      />
      {/* Bow right */}
      <Path
        d="M340,456 C350,443 377,436 392,448 C404,458 385,474 362,470 C350,468 340,462 340,456Z"
        fill={MINT}
        stroke={BROWN}
        strokeWidth={3.5}
      />
      {/* Bow knot */}
      <Ellipse cx={340} cy={458} rx={10} ry={12} fill={MINT2} stroke={BROWN} strokeWidth={3} />
      {/* Door arch */}
      <Path
        d="M322,543 L322,520 Q322,502 340,502 Q358,502 358,520 L358,543Z"
        fill={DOOR}
        stroke={BROWN}
        strokeWidth={3.5}
      />
    </>
  );
}

function Roof() {
  return (
    <>
      <Path
        d="M340,108 L530,306 L150,306Z"
        fill={MINT}
        stroke={BROWN}
        strokeWidth={5}
        strokeLinejoin="round"
      />
      {/* Peak ornament */}
      <Path
        d="M340,88 L358,124 L322,124Z"
        fill={CORAL}
        stroke={BROWN}
        strokeWidth={3.5}
      />
    </>
  );
}

// ─── Face variants ──────────────────────────────────────────────────────────

function FaceNormal() {
  return (
    <>
      {/* Left eye */}
      <Circle cx={284} cy={374} r={27} fill="#2C1812" />
      <Circle cx={274} cy={362} r={8.5} fill="white" />
      {/* Right eye wink */}
      <Path d="M362,367 Q384,392 406,367" stroke={BROWN} strokeWidth={5.5} fill="none" />
      {/* Blush */}
      <Ellipse cx={246} cy={399} rx={25} ry={16} fill={CORAL} opacity={0.85} />
      <BlushDots cx={246} cy={399} />
      <Ellipse cx={434} cy={399} rx={25} ry={16} fill={CORAL} opacity={0.85} />
      <BlushDots cx={434} cy={399} />
      {/* Smile */}
      <Path d="M316,418 Q340,438 364,418" stroke={BROWN} strokeWidth={4.5} fill="none" />
    </>
  );
}

function FaceHappy() {
  return (
    <>
      {/* Both eyes wink */}
      <Path d="M262,368 Q284,388 306,368" stroke={BROWN} strokeWidth={5.5} fill="none" />
      <Path d="M374,368 Q396,388 418,368" stroke={BROWN} strokeWidth={5.5} fill="none" />
      {/* Blush slightly larger */}
      <Ellipse cx={246} cy={399} rx={28} ry={18} fill={CORAL} opacity={0.85} />
      <BlushDots cx={246} cy={399} />
      <Ellipse cx={434} cy={399} rx={28} ry={18} fill={CORAL} opacity={0.85} />
      <BlushDots cx={434} cy={399} />
      {/* Big smile */}
      <Path d="M298,412 Q340,448 382,412" stroke={BROWN} strokeWidth={5} fill="none" />
      {/* Sparkle stars */}
      <SvgText x={300} y={354} fontSize={28} fill={MINT2} textAnchor="middle">
        {'✦'}
      </SvgText>
      <SvgText x={400} y={348} fontSize={20} fill={MINT2} textAnchor="middle">
        {'✦'}
      </SvgText>
    </>
  );
}

function FaceTired() {
  return (
    <>
      {/* Left eye (lowered) */}
      <Circle cx={284} cy={380} r={27} fill="#2C1812" />
      <Circle cx={274} cy={368} r={8.5} fill="white" />
      {/* Heavy eyelid left */}
      <Rect x={258} y={358} width={52} height={14} rx={7} fill="#8B6E65" opacity={0.75} />
      {/* Right eye wink (droopy) */}
      <Path d="M374,367 Q396,358 418,367" stroke={BROWN} strokeWidth={5.5} fill="none" />
      {/* Eyelid right */}
      <Rect x={368} y={352} width={52} height={14} rx={7} fill="#8B6E65" opacity={0.75} />
      {/* Smaller cheeks */}
      <Ellipse cx={246} cy={399} rx={20} ry={12} fill={CORAL} opacity={0.6} />
      <Ellipse cx={434} cy={399} rx={20} ry={12} fill={CORAL} opacity={0.6} />
      {/* Flat mouth */}
      <Path d="M318,426 Q340,418 362,426" stroke={BROWN} strokeWidth={4.5} fill="none" />
      {/* Z's */}
      <SvgText x={490} y={340} fontSize={22} fill={BROWN} opacity={0.5} fontWeight="700">
        z
      </SvgText>
      <SvgText x={510} y={318} fontSize={16} fill={BROWN} opacity={0.35} fontWeight="700">
        z
      </SvgText>
    </>
  );
}

function FaceSurprised() {
  return (
    <>
      {/* Both eyes wide open */}
      <Circle cx={284} cy={374} r={30} fill="#2C1812" />
      <Circle cx={274} cy={360} r={10} fill="white" />
      <Circle cx={396} cy={374} r={30} fill="#2C1812" />
      <Circle cx={386} cy={360} r={10} fill="white" />
      {/* Smaller cheeks */}
      <Ellipse cx={246} cy={399} rx={20} ry={12} fill={CORAL} opacity={0.7} />
      <Ellipse cx={434} cy={399} rx={20} ry={12} fill={CORAL} opacity={0.7} />
      {/* Open mouth */}
      <Ellipse cx={340} cy={428} rx={18} ry={16} fill={BROWN} />
    </>
  );
}

function FaceError() {
  return (
    <>
      {/* Left eye normal */}
      <Circle cx={284} cy={374} r={27} fill="#2C1812" />
      <Circle cx={274} cy={362} r={8.5} fill="white" />
      {/* Right eye wink */}
      <Path d="M362,367 Q384,392 406,367" stroke={BROWN} strokeWidth={5.5} fill="none" />
      {/* Cheeks stronger */}
      <Ellipse cx={246} cy={399} rx={22} ry={14} fill={CORAL} opacity={0.9} />
      <BlushDots cx={246} cy={399} />
      <Ellipse cx={434} cy={399} rx={22} ry={14} fill={CORAL} opacity={0.9} />
      <BlushDots cx={434} cy={399} />
      {/* Downturned mouth (sad) */}
      <Path d="M310,430 Q340,416 370,430" stroke={BROWN} strokeWidth={4.5} fill="none" />
      {/* Question mark */}
      <SvgText x={382} y={348} fontSize={32} fill="#D85A30" opacity={0.9} fontWeight="700">
        ?
      </SvgText>
    </>
  );
}

function FaceLoading() {
  return (
    <>
      {/* Both eyes soft wink */}
      <Path d="M262,372 Q284,388 306,372" stroke={BROWN} strokeWidth={5.5} fill="none" />
      <Path d="M374,372 Q396,388 418,372" stroke={BROWN} strokeWidth={5.5} fill="none" />
      {/* 3 dots above eyes */}
      <Circle cx={297} cy={360} r={6} fill={MINT2} opacity={0.9} />
      <Circle cx={340} cy={360} r={6} fill={MINT2} opacity={0.9} />
      <Circle cx={383} cy={360} r={6} fill={MINT2} opacity={0.9} />
      {/* Cheeks */}
      <Ellipse cx={246} cy={399} rx={25} ry={16} fill={CORAL} opacity={0.7} />
      <Ellipse cx={434} cy={399} rx={25} ry={16} fill={CORAL} opacity={0.7} />
      {/* Gentle smile */}
      <Path d="M314,422 Q340,434 366,422" stroke={BROWN} strokeWidth={4} fill="none" />
    </>
  );
}

const FACE_MAP: Record<MascotExpression, React.FC> = {
  normal: FaceNormal,
  happy: FaceHappy,
  tired: FaceTired,
  surprised: FaceSurprised,
  error: FaceError,
  loading: FaceLoading,
};

// ─── Animation hooks ────────────────────────────────────────────────────────

function useBreathingStyle() {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.03,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [scale]);
  return { transform: [{ scale }] };
}

function useBounceStyle() {
  const translateY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(translateY, {
        toValue: -12,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        easing: Easing.bounce,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY]);
  return { transform: [{ translateY }] };
}

function useSwayStyle() {
  const rotate = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(rotate, {
          toValue: -1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [rotate]);
  const rotateInterpolation = rotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-3deg', '3deg'],
  });
  return { transform: [{ rotate: rotateInterpolation }] };
}

function usePopStyle() {
  const scale = useRef(new Animated.Value(0.85)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.05,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1.0,
        duration: 250,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale]);
  return { transform: [{ scale }] };
}

function useShakeStyle() {
  const rotate = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(rotate, { toValue: -1, duration: 100, useNativeDriver: true }),
      Animated.timing(rotate, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(rotate, { toValue: -1, duration: 100, useNativeDriver: true }),
      Animated.timing(rotate, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(rotate, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [rotate]);
  const rotateInterpolation = rotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-4deg', '4deg'],
  });
  return { transform: [{ rotate: rotateInterpolation }] };
}

function useLoadingDotsStyle() {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.02,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [scale]);
  return { transform: [{ scale }] };
}

type AnimatedStyleResult = Animated.WithAnimatedObject<ViewStyle>;

const ANIMATION_MAP: Record<MascotExpression, () => AnimatedStyleResult> = {
  normal: useBreathingStyle,
  happy: useBounceStyle,
  tired: useSwayStyle,
  surprised: usePopStyle,
  error: useShakeStyle,
  loading: useLoadingDotsStyle,
};

// ─── Static wrapper (no animation) ─────────────────────────────────────────

function useStaticStyle(): AnimatedStyleResult {
  return { transform: [] };
}

// ─── Main component ─────────────────────────────────────────────────────────

function KeurzenMascot({
  expression = 'normal',
  size = 120,
  animated = true,
  style,
}: KeurzenMascotProps) {
  const useAnimation = animated ? ANIMATION_MAP[expression] : useStaticStyle;
  const animatedStyle = useAnimation();

  const Face = FACE_MAP[expression];

  return (
    <Animated.View style={[{ width: size, height: size * (580 / 680) }, style, animatedStyle]}>
      <Svg viewBox="0 0 680 580" width="100%" height="100%">
        {/* Base body */}
        <BaseBody />

        {/* Face (expression-specific) */}
        <Face />

        {/* Ribbon with stripes */}
        <RibbonStripes />

        {/* Bow + door */}
        <BowAndDoor />

        {/* Roof */}
        <Roof />
      </Svg>
    </Animated.View>
  );
}

export default KeurzenMascot;
export { KeurzenMascot };
