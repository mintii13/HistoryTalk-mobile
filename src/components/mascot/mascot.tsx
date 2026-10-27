import { useEffect, useId } from 'react';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

export type MascotMood = 'idle' | 'thinking' | 'happy' | 'sad' | 'timeout';
/** Phu kien ngay le: cành mai Tết, cờ 30/4 – 2/9, đèn ông sao Trung thu, hoa 20/11. */
export type MascotAccessory = 'mai' | 'flag' | 'lantern' | 'flowers';

/*
 * Ban mobile cua mascot dong ho cat (components/mascot/Mascot.tsx ben web): cung hinh SVG,
 * chuyen dong viet lai bang Reanimated thay cho GSAP.
 */
const TOP_HALF = 68;
const TOP_EMPTY = 100;
const BOTTOM_HALF = 168;
const BOTTOM_FULL = 140;

const INK = '#4A1206';
const FRAME_DARK = '#8E1B0A';

const SPARKLES = [
  { x: 30, y: 62, s: 1 },
  { x: 170, y: 56, s: 0.85 },
  { x: 20, y: 146, s: 0.7 },
  { x: 182, y: 150, s: 1 },
  { x: 100, y: 6, s: 0.75 },
];

const ARM_PATHS: Record<MascotMood, { left: string; right: string }> = {
  idle: { left: 'M74 124 Q64 134 62 146', right: 'M126 124 Q136 134 138 146' },
  thinking: { left: 'M74 124 Q64 134 62 146', right: 'M126 124 Q134 142 116 141' },
  happy: { left: 'M74 112 Q60 102 56 86', right: 'M126 112 Q140 102 144 86' },
  sad: { left: 'M75 127 Q70 141 70 153', right: 'M125 127 Q130 141 130 153' },
  timeout: { left: 'M74 118 Q60 112 64 98', right: 'M126 118 Q140 112 136 98' },
};

const ACCESSORY_AT: Record<MascotAccessory, [number, number]> = {
  mai: [42, 28],
  flowers: [42, 28],
  flag: [172, 32],
  lantern: [164, 30],
};
const ACCESSORY_SCALE = 1.6;

function pathEnd(path: string) {
  const [x, y] = path.split(' ').slice(-2).map(Number);
  return { x, y };
}

function Blossom({ x, y, petal, heart }: { x: number; y: number; petal: string; heart: string }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <Circle
          key={a}
          cx={Math.cos((a * Math.PI) / 180) * 3.2}
          cy={Math.sin((a * Math.PI) / 180) * 3.2}
          r={2.9}
          fill={petal}
        />
      ))}
      <Circle r={1.7} fill={heart} />
    </G>
  );
}

function Accessory({ type }: { type: MascotAccessory }) {
  if (type === 'flag') {
    return (
      <G>
        <Line x1={172} y1={32} x2={172} y2={0} stroke="#6B3B14" strokeWidth={3} strokeLinecap="round" />
        <Path d="M173 2 Q186 -3 199 2 V20 Q186 15 173 20Z" fill="#DA251D" />
        <Path
          d="M186 5.5 L187.6 9.6 L192 9.8 L188.6 12.5 L189.8 16.8 L186 14.3 L182.2 16.8 L183.4 12.5 L180 9.8 L184.4 9.6Z"
          fill="#FFDE00"
        />
      </G>
    );
  }
  if (type === 'lantern') {
    return (
      <G>
        <Path d="M164 30 Q178 22 186 4" stroke="#6B3B14" strokeWidth={3} strokeLinecap="round" fill="none" />
        <Line x1={186} y1={4} x2={186} y2={12} stroke="#6B3B14" strokeWidth={1.5} />
        <Path
          d="M186 12 L189.2 20.6 L198.4 21 L191.2 26.7 L193.6 35.6 L186 30.5 L178.4 35.6 L180.8 26.7 L173.6 21 L182.8 20.6Z"
          fill="#E53935"
          stroke="#FFC107"
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
        <Circle cx={186} cy={25} r={3} fill="#FFE082" />
        <Path d="M184 35 L183 44 M188 35 L189 44" stroke="#FFC107" strokeWidth={1.5} strokeLinecap="round" />
      </G>
    );
  }
  const [petal, heart] = type === 'mai' ? ['#FFD21F', '#E07A00'] : ['#FF8FB1', '#C2185B'];
  return (
    <G>
      <Path d="M42 28 Q30 18 14 6 M28 17 Q30 8 38 2" stroke="#6B3B14" strokeWidth={2.6} strokeLinecap="round" fill="none" />
      <Blossom x={14} y={6} petal={petal} heart={heart} />
      <Blossom x={38} y={3} petal={petal} heart={heart} />
      <Blossom x={24} y={14} petal={petal} heart={heart} />
      <Ellipse cx={33} cy={12} rx={3} ry={1.6} fill="#5C9E3A" transform="rotate(-30 33 12)" />
    </G>
  );
}

function Eye({ cx, cy, big }: { cx: number; cy: number; big?: boolean }) {
  return (
    <>
      <Ellipse cx={cx} cy={cy} rx={big ? 4.2 : 3.5} ry={big ? 5.2 : 4.5} fill={INK} />
      <Circle cx={cx + 1.2} cy={cy - 1.6} r={big ? 1.5 : 1.25} fill="#FFFFFF" />
    </>
  );
}

function Face({ mood }: { mood: MascotMood }) {
  const look = mood === 'thinking' ? { dx: 1.6, dy: -1.8 } : { dx: 0, dy: 0 };
  const line = { stroke: INK, strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <G>
      {mood === 'sad' && (
        <>
          <Path d="M85 106 L93 103" {...line} />
          <Path d="M115 106 L107 103" {...line} />
        </>
      )}
      {mood === 'thinking' && (
        <>
          <Path d="M86 105.5 L94 105.5" {...line} />
          <Path d="M106 103 Q110.5 99.5 115 102" {...line} />
        </>
      )}
      {mood === 'timeout' && (
        <>
          <Path d="M85 103 Q89.5 99 94 101.5" {...line} />
          <Path d="M115 103 Q110.5 99 106 101.5" {...line} />
        </>
      )}

      {mood === 'happy' ? (
        <>
          <Path d="M85.5 114 Q90 107.5 94.5 114" {...line} strokeWidth={2.8} />
          <Path d="M105.5 114 Q110 107.5 114.5 114" {...line} strokeWidth={2.8} />
        </>
      ) : (
        <>
          <Eye cx={90 + look.dx} cy={113 + look.dy} big={mood === 'timeout'} />
          <Eye cx={110 + look.dx} cy={113 + look.dy} big={mood === 'timeout'} />
        </>
      )}

      <Ellipse cx={83} cy={122} rx={4} ry={2.8} fill="#FF6B4A" opacity={0.4} />
      <Ellipse cx={117} cy={122} rx={4} ry={2.8} fill="#FF6B4A" opacity={0.4} />

      {mood === 'idle' && <Path d="M94.5 123 Q100 128.5 105.5 123" {...line} />}
      {mood === 'thinking' && <Path d="M96 126 Q100.5 124 105 126.5" {...line} />}
      {mood === 'sad' && <Path d="M94.5 128 Q100 122.5 105.5 128" {...line} />}
      {mood === 'happy' && (
        <>
          <Path d="M92 120.5 Q100 133.5 108 120.5 Z" {...line} fill={INK} />
          <Path d="M96 127.5 Q100 125 104 127.5 Q100 131 96 127.5 Z" fill="#FF7A59" />
        </>
      )}
      {mood === 'timeout' && <Ellipse cx={100} cy={126.5} rx={3.6} ry={4.6} fill={INK} />}

      {mood === 'sad' && <Path d="M113.5 118 q-2.6 4.2 0 6 q2.6 -1.8 0 -6Z" fill="#5BA8E8" />}
      {mood === 'timeout' && <Path d="M124 98 q-3 4.8 0 6.8 q3 -2 0 -6.8Z" fill="#7FC0F0" />}
    </G>
  );
}

interface MascotProps {
  mood?: MascotMood;
  /** Be rong (px); chieu cao theo viewBox 5:6. */
  size?: number;
  /** Tay de vay/chi; tat thi gan voi logo goc hon (gon hon o co nho). */
  arms?: boolean;
  accessory?: MascotAccessory | null;
  /** Nhan cho trinh doc man hinh; bo trong thi coi la trang tri. */
  label?: string;
}

/** Logo dong ho cat cua HistoryTalk thanh nhan vat. Ton trong "giam chuyen dong" cua he thong. */
export function Mascot({ mood = 'idle', size = 120, arms = true, accessory, label }: MascotProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (name: string) => `m-${name}-${uid}`;
  const reduceMotion = useReducedMotion();
  const done = mood === 'timeout';
  const armPaths = ARM_PATHS[mood];

  const rotate = useSharedValue(0);
  const lift = useSharedValue(0);
  const shift = useSharedValue(0);

  useEffect(() => {
    rotate.value = 0;
    lift.value = 0;
    shift.value = 0;
    if (reduceMotion) return;
    const sine = Easing.inOut(Easing.sin);
    if (mood === 'idle') {
      rotate.value = withRepeat(withSequence(withTiming(2.5, { duration: 2400, easing: sine }), withTiming(-2.5, { duration: 2400, easing: sine })), -1, true);
    } else if (mood === 'thinking') {
      rotate.value = withRepeat(withTiming(-4, { duration: 1600, easing: sine }), -1, true);
    } else if (mood === 'happy') {
      lift.value = withRepeat(
        withSequence(
          withTiming(-14, { duration: 300, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 260, easing: Easing.in(Easing.quad) }),
          withTiming(0, { duration: 200 }),
        ),
        -1,
      );
    } else if (mood === 'sad') {
      lift.value = withRepeat(withTiming(3, { duration: 2600, easing: sine }), -1, true);
      rotate.value = withRepeat(withTiming(-3, { duration: 2600, easing: sine }), -1, true);
    } else if (mood === 'timeout') {
      shift.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 50 }),
          withRepeat(withTiming(3, { duration: 50 }), 6, true),
          withTiming(0, { duration: 50 }),
          withTiming(0, { duration: 1100 }),
        ),
        -1,
      );
    }
    return () => {
      cancelAnimation(rotate);
      cancelAnimation(lift);
      cancelAnimation(shift);
    };
  }, [mood, reduceMotion, rotate, lift, shift]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shift.value }, { translateY: lift.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View
      style={[{ width: size, height: size * 1.2, transformOrigin: 'bottom' }, bodyStyle]}
      accessible={!!label}
      accessibilityRole={label ? 'image' : undefined}
      accessibilityLabel={label}
      importantForAccessibility={label ? 'yes' : 'no-hide-descendants'}
    >
      <Svg viewBox="0 0 200 240" width={size} height={size * 1.2}>
        <Defs>
          <RadialGradient id={id('bar')} cx={100} cy={117} r={118} gradientUnits="userSpaceOnUse">
            <Stop offset={0} stopColor="#FFAD00" />
            <Stop offset={0.5} stopColor="#E27600" />
            <Stop offset={1} stopColor="#9A0A00" />
          </RadialGradient>
          <RadialGradient id={id('core')} cx="0.38" cy="0.32" r="0.8">
            <Stop offset={0} stopColor="#FFE9A8" />
            <Stop offset={0.55} stopColor="#FFB81C" />
            <Stop offset={1} stopColor="#F08A00" />
          </RadialGradient>
          <LinearGradient id={id('sand')} x1="0" y1="0" x2="0" y2="1">
            <Stop offset={0} stopColor="#FFDE7A" />
            <Stop offset={1} stopColor="#E9A21F" />
          </LinearGradient>
          <LinearGradient id={id('cap')} x1="0" y1="0" x2="0" y2="1">
            <Stop offset={0} stopColor="#C2361A" />
            <Stop offset={1} stopColor="#7A1408" />
          </LinearGradient>
          <ClipPath id={id('top')}>
            <Polygon points="57,36 143,36 100,105" />
          </ClipPath>
          <ClipPath id={id('bottom')}>
            <Polygon points="100,129 57,198 143,198" />
          </ClipPath>
        </Defs>

        <Ellipse cx={100} cy={230} rx={44} ry={5} fill="#000000" opacity={0.2} />

        {mood === 'happy' && (
          <G fill="#FFC83D">
            {SPARKLES.map((p, i) => (
              <G key={i} transform={`translate(${p.x} ${p.y}) scale(${p.s})`}>
                <Path d="M0 -9 Q1 -1 9 0 Q1 1 0 9 Q-1 1 -9 0 Q-1 -1 0 -9Z" />
              </G>
            ))}
          </G>
        )}

        {mood === 'thinking' && (
          <G fill="#C9A06A">
            <Circle cx={150} cy={70} r={3} />
            <Circle cx={160} cy={56} r={4} />
            <Circle cx={172} cy={40} r={5.5} />
          </G>
        )}

        <G>
          <G fill={FRAME_DARK}>
            <Ellipse cx={80} cy={219} rx={11} ry={6} />
            <Ellipse cx={120} cy={219} rx={11} ry={6} />
          </G>

          <G opacity={mood === 'sad' ? 0.85 : 1}>
            <Polygon points="57,36 143,36 100,105" fill="#FFF3D6" opacity={0.12} />
            <Polygon points="100,129 57,198 143,198" fill="#FFF3D6" opacity={0.12} />

            <G clipPath={`url(#${id('top')})`}>
              <Path
                transform={`translate(0 ${done ? TOP_EMPTY : TOP_HALF})`}
                d="M20 0 Q100 9 180 0 V120 H20Z"
                fill={`url(#${id('sand')})`}
              />
            </G>
            {!done && (
              <G>
                <Line x1={100} y1={104} x2={100} y2={198} stroke="#FFD66B" strokeWidth={1.2} opacity={0.6} />
                <Line
                  x1={100}
                  y1={104}
                  x2={100}
                  y2={198}
                  stroke="#FFE08A"
                  strokeWidth={2.6}
                  strokeLinecap="round"
                  strokeDasharray="2.5 4.5"
                />
              </G>
            )}
            <G clipPath={`url(#${id('bottom')})`}>
              <Path
                transform={`translate(0 ${done ? BOTTOM_FULL : BOTTOM_HALF})`}
                d="M20 16 Q100 -12 180 16 V120 H20Z"
                fill={`url(#${id('sand')})`}
              />
            </G>

            <G stroke="#FFFFFF" strokeLinecap="round" opacity={0.45}>
              <Path d="M68 44 L83 68" strokeWidth={3} />
              <Path d="M88 76 L91 81" strokeWidth={3} />
              <Path d="M68 190 L76 177" strokeWidth={2.5} />
            </G>

            <G stroke={`url(#${id('bar')})`} strokeWidth={12} strokeLinecap="round">
              <Line x1={48} y1={36} x2={152} y2={198} />
              <Line x1={152} y1={36} x2={48} y2={198} />
            </G>

            {[24, 198].map((y) => (
              <G key={y}>
                <Rect x={36} y={y} width={128} height={14} rx={7} fill={`url(#${id('cap')})`} />
                <Rect x={44} y={y + 2.5} width={112} height={2.5} rx={1.25} fill="#FFFFFF" opacity={0.28} />
              </G>
            ))}
          </G>

          <G>
            <Circle cx={100} cy={117} r={35} fill="#FFB000" opacity={0.22} />
            <Circle cx={100} cy={117} r={27} fill={`url(#${id('core')})`} stroke="#C25A00" strokeWidth={2} />
            <Path d="M84 104 Q90 96 99 95" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" fill="none" opacity={0.5} />
            <Face mood={mood} />
          </G>

          {arms && (
            <G stroke={FRAME_DARK} strokeWidth={6} strokeLinecap="round" fill="none">
              {(['left', 'right'] as const).map((side) => {
                const d = armPaths[side];
                const hand = pathEnd(d);
                return (
                  <G key={side}>
                    <Path d={d} />
                    <Circle cx={hand.x} cy={hand.y} r={6} fill="#FFB81C" strokeWidth={2.5} />
                  </G>
                );
              })}
            </G>
          )}

          {accessory && (
            <G
              transform={`translate(${ACCESSORY_AT[accessory].join(' ')}) scale(${ACCESSORY_SCALE}) translate(${ACCESSORY_AT[accessory].map((v) => -v).join(' ')})`}
            >
              <Accessory type={accessory} />
            </G>
          )}
        </G>
      </Svg>
    </Animated.View>
  );
}
