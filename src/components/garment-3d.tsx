// Visor pseudo-3D: la prenda recortada gira con el dedo (perspectiva + capas
// desplazadas que simulan grosor) sobre una sombra que reacciona al giro.
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { T } from '@/lib/theme';

const LAYERS = [6, 5, 4, 3, 2, 1, 0];

export function Garment3D({ uri, size = 300 }: { uri: string; size?: number }) {
  const rx = useSharedValue(-6);
  const ry = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  useEffect(() => {
    ry.value = withTiming(18, { duration: 900 });
  }, [ry]);

  const pan = Gesture.Pan()
    .onStart(() => {
      startX.value = ry.value;
      startY.value = rx.value;
    })
    .onUpdate((e) => {
      ry.value = startX.value + e.translationX * 0.35;
      rx.value = Math.max(-32, Math.min(32, startY.value - e.translationY * 0.25));
    })
    .onEnd((e) => {
      ry.value = withDecay({ velocity: e.velocityX * 0.35, deceleration: 0.996 });
    });

  const shadowStyle = useAnimatedStyle(() => {
    const tilt = Math.abs(Math.sin((ry.value * Math.PI) / 180));
    return {
      transform: [{ scaleX: 1 - tilt * 0.35 }],
      opacity: 0.16 + tilt * 0.08,
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <View style={{ width: size, height: size + 40, alignItems: 'center' }}>
        <View style={{ width: size, height: size }}>
          {LAYERS.map((depth) => (
            <Layer key={depth} uri={uri} size={size} depth={depth} rx={rx} ry={ry} />
          ))}
        </View>
        <Animated.View
          style={[
            {
              marginTop: 8,
              width: size * 0.6,
              height: 18,
              borderRadius: 9,
              backgroundColor: T.ink,
            },
            shadowStyle,
          ]}
        />
      </View>
    </GestureDetector>
  );
}

function Layer({
  uri,
  size,
  depth,
  rx,
  ry,
}: {
  uri: string;
  size: number;
  depth: number;
  rx: SharedValue<number>;
  ry: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const yRad = (ry.value * Math.PI) / 180;
    const xRad = (rx.value * Math.PI) / 180;
    return {
      transform: [
        { perspective: 900 },
        { translateX: Math.sin(yRad) * depth * 1.6 },
        { translateY: Math.sin(xRad) * depth * 1.6 },
        { rotateY: `${ry.value}deg` },
        { rotateX: `${rx.value}deg` },
      ],
      opacity: depth === 0 ? 1 : interpolate(depth, [1, 6], [0.5, 0.12], Extrapolation.CLAMP),
    };
  });
  return (
    <Animated.Image
      source={{ uri }}
      resizeMode="contain"
      style={[
        StyleSheet.absoluteFill,
        { width: size, height: size },
        depth > 0 && { tintColor: '#5B564A' },
        style,
      ]}
    />
  );
}
