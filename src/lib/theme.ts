// Tema minimalista Klozet — paleta neutra cálida, tipografía aireada.
export const T = {
  bg: '#F7F6F2',
  surface: '#FFFFFF',
  surfaceSoft: '#F1EFE9',
  ink: '#17150F',
  inkSoft: '#4A4740',
  muted: '#9B968A',
  line: '#E9E6DE',
  accent: '#17150F',
  gold: '#A9885B',
  danger: '#B4442C',
  ok: '#3E7A4E',
  radius: 20,
  radiusSm: 12,
  pad: 20,
};

export const shadow = {
  shadowColor: '#17150F',
  shadowOpacity: 0.06,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
} as const;

export const font = {
  title: { fontSize: 30, fontWeight: '700' as const, letterSpacing: -0.5, color: T.ink },
  h2: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3, color: T.ink },
  body: { fontSize: 15, color: T.inkSoft, lineHeight: 22 },
  small: { fontSize: 12.5, color: T.muted, letterSpacing: 0.2 },
  label: {
    fontSize: 11.5,
    color: T.muted,
    letterSpacing: 1.4,
    textTransform: 'uppercase' as const,
    fontWeight: '600' as const,
  },
};
