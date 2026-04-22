import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { theme } from '../theme';
import { Pressable } from '../motion';

type EmptyStateCta = {
  label: string;
  onPress: () => void;
};

type EmptyStateProps = {
  /** Emoji or short glyph shown inside the icon circle. Defaults to 📭. */
  icon?: string;
  /** Main heading — required in practice (either via `title` or legacy `text`). */
  title?: string;
  /** Supporting copy below the title. */
  body?: string;
  /** Optional primary action button. */
  cta?: EmptyStateCta;
  /**
   * Legacy single-line API. When provided and `title` is not, it's used as the title.
   * Kept for backward compatibility with call sites that only pass a single line.
   */
  text?: string;
};

export const EmptyState = (props: EmptyStateProps) => {
  const icon = props.icon ?? '📭';
  const title = props.title ?? props.text ?? '';
  const { body, cta } = props;

  return (
    <View style={s.empty}>
      <View style={s.iconCircle}>
        <Text style={s.icon}>{icon}</Text>
      </View>
      {title ? <Text style={s.title}>{title}</Text> : null}
      {body ? <Text style={s.body}>{body}</Text> : null}
      {cta ? (
        <Pressable style={s.cta} onPress={cta.onPress} activeScale={0.96}>
          <Text style={s.ctaText}>{cta.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const s = StyleSheet.create({
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: theme.spacing.xl,
    ...Platform.select({ web: { paddingTop: 24 } }),
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  icon: { fontSize: 28 },
  title: {
    ...theme.typography.bodyBold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  body: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    maxWidth: 320,
  },
  cta: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  ctaText: {
    ...theme.typography.bodyBold,
    color: theme.colors.textInverse,
    letterSpacing: 0.2,
  },
});
