// Probador sobre la foto real del dueño: muestra la persona recortada como
// base y superpone las prendas recortadas. Nunca toca la cara (solo dibuja
// prendas sobre torso/piernas/pies). No es un render con IA: es un montaje.
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import type { Garment } from '@/lib/types';

// Posición de cada categoría como fracción del recuadro de la persona.
const SLOTS: Record<string, { top: number; height: number; width: number; z: number }> = {
  bottom: { top: 0.5, height: 0.42, width: 0.42, z: 2 },
  dress: { top: 0.24, height: 0.58, width: 0.5, z: 3 },
  top: { top: 0.24, height: 0.3, width: 0.5, z: 4 },
  outerwear: { top: 0.23, height: 0.36, width: 0.6, z: 5 },
  shoes: { top: 0.9, height: 0.09, width: 0.36, z: 6 },
  accessory: { top: 0.05, height: 0.12, width: 0.24, z: 7 },
};

export function PhotoModel({
  personUrl,
  garments,
  width = 230,
}: {
  personUrl: string;
  garments: Garment[];
  width?: number;
}) {
  const height = width * 1.7;
  const sorted = [...garments].sort(
    (a, b) => (SLOTS[a.category]?.z ?? 0) - (SLOTS[b.category]?.z ?? 0),
  );

  return (
    <View style={{ width, height }}>
      <Image
        source={{ uri: personUrl }}
        style={{ width: '100%', height: '100%' }}
        contentFit="contain"
        transition={200}
      />
      {sorted.map((g) => {
        const slot = SLOTS[g.category];
        const uri = g.cutout_url ?? g.image_url;
        if (!slot || !uri) return null;
        const slotW = width * slot.width;
        return (
          <Image
            key={g.id}
            source={{ uri }}
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
