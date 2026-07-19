import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ColorDots } from '@/components/ui';
import { font, shadow, T } from '@/lib/theme';
import { categoryLabel, type Garment } from '@/lib/types';

export function GarmentCard({ garment, onPress }: { garment: Garment; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]}>
      <View style={s.imageBox}>
        <Image
          source={{ uri: garment.cutout_url ?? garment.image_url ?? undefined }}
          style={{ width: '100%', height: '100%' }}
          contentFit="contain"
          transition={200}
        />
      </View>
      <View style={{ padding: 12, gap: 6 }}>
        <Text numberOfLines={1} style={[font.body, { color: T.ink, fontWeight: '700' }]}>
          {garment.name}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={font.small}>{categoryLabel(garment.category)}</Text>
          <ColorDots colors={garment.colors ?? []} size={12} />
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: T.surface,
    borderRadius: T.radius,
    overflow: 'hidden',
    ...shadow,
  },
  imageBox: {
    backgroundColor: T.surfaceSoft,
    aspectRatio: 1,
    padding: 14,
  },
});
