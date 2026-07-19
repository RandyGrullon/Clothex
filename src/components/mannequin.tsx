// Maniquí minimalista dibujado en SVG, escalado con las medidas reales del
// dueño (altura/peso), con las prendas recortadas superpuestas encima.
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { T } from '@/lib/theme';
import type { Garment, Profile } from '@/lib/types';

// Posición de cada categoría sobre el maniquí (fracciones del contenedor).
const SLOTS: Record<string, { top: number; height: number; width: number; z: number }> = {
  bottom: { top: 0.42, height: 0.46, width: 0.5, z: 2 },
  dress: { top: 0.16, height: 0.62, width: 0.62, z: 3 },
  top: { top: 0.15, height: 0.34, width: 0.62, z: 4 },
  outerwear: { top: 0.14, height: 0.38, width: 0.72, z: 5 },
  shoes: { top: 0.88, height: 0.11, width: 0.44, z: 6 },
  accessory: { top: 0.0, height: 0.13, width: 0.28, z: 7 },
};

export function Mannequin({
  profile,
  garments,
  width = 260,
}: {
  profile: Profile | null;
  garments: Garment[];
  width?: number;
}) {
  const height = width * 2.2;
  const h = profile?.height_cm ?? 170;
  const w = profile?.weight_kg ?? 70;
  const bmi = w / Math.pow(h / 100, 2);
  // Escala horizontal del cuerpo según el IMC real del dueño.
  const wf = Math.max(0.82, Math.min(1.35, bmi / 22.5));

  const sorted = [...garments].sort(
    (a, b) => (SLOTS[a.category]?.z ?? 0) - (SLOTS[b.category]?.z ?? 0),
  );

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox="0 0 200 440">
        <G transform={`translate(100,0) scale(${wf},1) translate(-100,0)`}>
          {/* cabeza y cuello */}
          <Circle cx="100" cy="34" r="22" fill={T.surfaceSoft} stroke={T.line} strokeWidth="2" />
          <Rect x="92" y="54" width="16" height="14" rx="6" fill={T.surfaceSoft} />
          {/* torso */}
          <Path
            d="M64,68 L136,68 C142,112 140,160 132,202 L68,202 C60,160 58,112 64,68 Z"
            fill={T.surfaceSoft}
            stroke={T.line}
            strokeWidth="2"
          />
          {/* brazos */}
          <Rect x="44" y="72" width="15" height="122" rx="7.5" fill={T.surfaceSoft} stroke={T.line} strokeWidth="2" />
          <Rect x="141" y="72" width="15" height="122" rx="7.5" fill={T.surfaceSoft} stroke={T.line} strokeWidth="2" />
          {/* piernas */}
          <Rect x="70" y="202" width="26" height="178" rx="13" fill={T.surfaceSoft} stroke={T.line} strokeWidth="2" />
          <Rect x="104" y="202" width="26" height="178" rx="13" fill={T.surfaceSoft} stroke={T.line} strokeWidth="2" />
          {/* pies */}
          <Ellipse cx="83" cy="392" rx="17" ry="9" fill={T.surfaceSoft} stroke={T.line} strokeWidth="2" />
          <Ellipse cx="117" cy="392" rx="17" ry="9" fill={T.surfaceSoft} stroke={T.line} strokeWidth="2" />
        </G>
      </Svg>
      {sorted.map((g) => {
        const slot = SLOTS[g.category];
        if (!slot || !(g.cutout_url ?? g.image_url)) return null;
        const slotW = width * slot.width * (g.category === 'accessory' ? 1 : wf);
        return (
          <Image
            key={g.id}
            source={{ uri: g.cutout_url ?? g.image_url ?? undefined }}
            contentFit="contain"
            style={[
              styles.slot,
              {
                top: height * slot.top,
                height: height * slot.height,
                width: slotW,
                left: (width - slotW) / 2,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { position: 'absolute' },
});
