import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { font, shadow, T } from '@/lib/theme';
import type { GarmentColor } from '@/lib/types';

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  small = false,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
}) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.btn,
        small && s.btnSmall,
        isPrimary && { backgroundColor: T.accent },
        variant === 'ghost' && s.btnGhost,
        variant === 'danger' && { backgroundColor: '#FBEFEA' },
        (pressed || disabled || loading) && { opacity: 0.6 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#fff' : T.ink} />
      ) : (
        <Text
          style={[
            s.btnText,
            small && { fontSize: 13.5 },
            isPrimary && { color: '#fff' },
            variant === 'danger' && { color: T.danger },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function Input(props: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  multiline?: boolean;
}) {
  const { label, ...rest } = props;
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={font.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={T.muted}
        style={[s.input, props.multiline && { height: 84, textAlignVertical: 'top' }]}
        {...rest}
      />
    </View>
  );
}

export function Chip({
  label,
  active = false,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.chip, active && { backgroundColor: T.ink, borderColor: T.ink }]}
    >
      <Text style={[s.chipText, active && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export function ColorDots({ colors, size = 16 }: { colors: GarmentColor[]; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {colors.slice(0, 5).map((c, i) => (
        <View
          key={`${c.hex}-${i}`}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: c.hex,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.12)',
          }}
        />
      ))}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function EmptyState({ emoji, title, hint }: { emoji: string; title: string; hint: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 56, gap: 8 }}>
      <Text style={{ fontSize: 44 }}>{emoji}</Text>
      <Text style={font.h2}>{title}</Text>
      <Text style={[font.body, { textAlign: 'center', maxWidth: 260 }]}>{hint}</Text>
    </View>
  );
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={font.label}>{label}</Text>
      <Text style={[font.body, { color: T.ink, fontWeight: '600' }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  btnSmall: { height: 40, borderRadius: 20, paddingHorizontal: 18 },
  btnGhost: { borderWidth: 1.5, borderColor: T.line, backgroundColor: T.surface },
  btnText: { fontSize: 15.5, fontWeight: '700', color: T.ink, letterSpacing: 0.2 },
  input: {
    backgroundColor: T.surface,
    borderWidth: 1.5,
    borderColor: T.line,
    borderRadius: T.radiusSm,
    paddingHorizontal: 14,
    height: 50,
    fontSize: 15,
    color: T.ink,
  },
  chip: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: T.line,
    backgroundColor: T.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 13.5, fontWeight: '600', color: T.inkSoft },
  card: {
    backgroundColor: T.surface,
    borderRadius: T.radius,
    padding: T.pad,
    ...shadow,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: T.line,
  },
});
