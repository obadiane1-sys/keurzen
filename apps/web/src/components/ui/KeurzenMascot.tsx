'use client';

import { cn } from '@/lib/utils';

export type MascotExpression = 'normal' | 'happy' | 'tired' | 'surprised' | 'error';

interface KeurzenMascotProps {
  expression?: MascotExpression;
  size?: number;
  className?: string;
}

const BROWN = '#3D2218';
const MINT = '#7DCCC3';
const MINT2 = '#52B8B0';
const CREAM = '#F5EFE0';
const CORAL = '#F0A898';
const CORALD = '#D07868';
const DOOR = '#7B5848';

function BlushDots({ cx, cy }: { cx: number; cy: number }) {
  return (
    <>
      <circle cx={cx - 8} cy={cy + 2} r={2.5} fill={CORALD} opacity={0.7} />
      <circle cx={cx} cy={cy + 5} r={2.5} fill={CORALD} opacity={0.7} />
      <circle cx={cx + 8} cy={cy + 2} r={2.5} fill={CORALD} opacity={0.7} />
    </>
  );
}

function FaceNormal() {
  return (
    <>
      <circle cx={284} cy={374} r={27} fill="#2C1812" />
      <circle cx={274} cy={362} r={8.5} fill="white" />
      <path d="M362,367 Q384,392 406,367" stroke={BROWN} strokeWidth={5.5} fill="none" />
      <ellipse cx={246} cy={399} rx={25} ry={16} fill={CORAL} opacity={0.85} />
      <BlushDots cx={246} cy={399} />
      <ellipse cx={434} cy={399} rx={25} ry={16} fill={CORAL} opacity={0.85} />
      <BlushDots cx={434} cy={399} />
      <path d="M316,418 Q340,438 364,418" stroke={BROWN} strokeWidth={4.5} fill="none" />
    </>
  );
}

function FaceHappy() {
  return (
    <>
      <path d="M262,368 Q284,388 306,368" stroke={BROWN} strokeWidth={5.5} fill="none" />
      <path d="M374,368 Q396,388 418,368" stroke={BROWN} strokeWidth={5.5} fill="none" />
      <ellipse cx={246} cy={399} rx={28} ry={18} fill={CORAL} opacity={0.85} />
      <BlushDots cx={246} cy={399} />
      <ellipse cx={434} cy={399} rx={28} ry={18} fill={CORAL} opacity={0.85} />
      <BlushDots cx={434} cy={399} />
      <path d="M298,412 Q340,448 382,412" stroke={BROWN} strokeWidth={5} fill="none" />
      <text x={300} y={354} fontSize={28} fill={MINT2} textAnchor="middle">✦</text>
      <text x={400} y={348} fontSize={20} fill={MINT2} textAnchor="middle">✦</text>
    </>
  );
}

function FaceTired() {
  return (
    <>
      <circle cx={284} cy={380} r={27} fill="#2C1812" />
      <circle cx={274} cy={368} r={8.5} fill="white" />
      <rect x={258} y={358} width={52} height={14} rx={7} fill="#8B6E65" opacity={0.75} />
      <path d="M374,367 Q396,358 418,367" stroke={BROWN} strokeWidth={5.5} fill="none" />
      <rect x={368} y={352} width={52} height={14} rx={7} fill="#8B6E65" opacity={0.75} />
      <ellipse cx={246} cy={399} rx={20} ry={12} fill={CORAL} opacity={0.6} />
      <ellipse cx={434} cy={399} rx={20} ry={12} fill={CORAL} opacity={0.6} />
      <path d="M318,426 Q340,418 362,426" stroke={BROWN} strokeWidth={4.5} fill="none" />
      <text x={490} y={340} fontSize={22} fill={BROWN} opacity={0.5} fontWeight={700}>z</text>
      <text x={510} y={318} fontSize={16} fill={BROWN} opacity={0.35} fontWeight={700}>z</text>
    </>
  );
}

function FaceSurprised() {
  return (
    <>
      <circle cx={284} cy={374} r={30} fill="#2C1812" />
      <circle cx={274} cy={360} r={10} fill="white" />
      <circle cx={396} cy={374} r={30} fill="#2C1812" />
      <circle cx={386} cy={360} r={10} fill="white" />
      <ellipse cx={246} cy={399} rx={20} ry={12} fill={CORAL} opacity={0.7} />
      <ellipse cx={434} cy={399} rx={20} ry={12} fill={CORAL} opacity={0.7} />
      <ellipse cx={340} cy={428} rx={18} ry={16} fill={BROWN} />
    </>
  );
}

function FaceError() {
  return (
    <>
      <circle cx={284} cy={374} r={27} fill="#2C1812" />
      <circle cx={274} cy={362} r={8.5} fill="white" />
      <path d="M362,367 Q384,392 406,367" stroke={BROWN} strokeWidth={5.5} fill="none" />
      <ellipse cx={246} cy={399} rx={22} ry={14} fill={CORAL} opacity={0.9} />
      <BlushDots cx={246} cy={399} />
      <ellipse cx={434} cy={399} rx={22} ry={14} fill={CORAL} opacity={0.9} />
      <BlushDots cx={434} cy={399} />
      <path d="M310,430 Q340,416 370,430" stroke={BROWN} strokeWidth={4.5} fill="none" />
      <text x={382} y={348} fontSize={32} fill="#D85A30" opacity={0.9} fontWeight={700}>?</text>
    </>
  );
}

const FACE_MAP: Record<MascotExpression, React.FC> = {
  normal: FaceNormal,
  happy: FaceHappy,
  tired: FaceTired,
  surprised: FaceSurprised,
  error: FaceError,
};

const ANIMATION_MAP: Record<MascotExpression, string> = {
  normal: 'animate-[breathing_3s_ease-in-out_infinite]',
  happy: 'animate-[bounce_0.7s_ease-out]',
  tired: 'animate-[sway_3s_ease-in-out_infinite]',
  surprised: 'animate-[pop_0.5s_ease-out]',
  error: 'animate-[shake_0.5s_ease-out]',
};

export function KeurzenMascot({ expression = 'normal', size = 120, className }: KeurzenMascotProps) {
  const Face = FACE_MAP[expression];

  return (
    <div
      className={cn(ANIMATION_MAP[expression], className)}
      style={{ width: size, height: size * (580 / 680) }}
    >
      <svg viewBox="0 0 680 580" width="100%" height="100%">
        {/* Body */}
        <rect x={190} y={292} width={300} height={252} rx={54} fill={CREAM} stroke={BROWN} strokeWidth={5} />

        {/* Face */}
        <Face />

        {/* Ribbon */}
        <rect x={190} y={440} width={300} height={32} fill={MINT} />
        <line x1={190} y1={440} x2={490} y2={440} stroke={BROWN} strokeWidth={3.5} />
        <line x1={190} y1={472} x2={490} y2={472} stroke={BROWN} strokeWidth={3.5} />

        {/* Bow */}
        <path d="M340,456 C330,443 303,436 288,448 C276,458 295,474 318,470 C330,468 340,462 340,456Z" fill={MINT} stroke={BROWN} strokeWidth={3.5} />
        <path d="M340,456 C350,443 377,436 392,448 C404,458 385,474 362,470 C350,468 340,462 340,456Z" fill={MINT} stroke={BROWN} strokeWidth={3.5} />
        <ellipse cx={340} cy={458} rx={10} ry={12} fill={MINT2} stroke={BROWN} strokeWidth={3} />

        {/* Door */}
        <path d="M322,543 L322,520 Q322,502 340,502 Q358,502 358,520 L358,543Z" fill={DOOR} stroke={BROWN} strokeWidth={3.5} />

        {/* Roof */}
        <path d="M340,108 L530,306 L150,306Z" fill={MINT} stroke={BROWN} strokeWidth={5} strokeLinejoin="round" />
        <path d="M340,88 L358,124 L322,124Z" fill={CORAL} stroke={BROWN} strokeWidth={3.5} />
      </svg>
    </div>
  );
}
