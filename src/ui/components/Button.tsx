import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { playSfx } from '../../game/audio/sound';
import { C, F } from '../theme';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

interface Props {
  label: string;
  onPress: () => void;
  icon?: IconName;
  color?: string;
  disabled?: boolean;
  sub?: string;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
  silent?: boolean;
  right?: ReactNode;
}

export function Button({ label, onPress, icon, color = C.accent, disabled, sub, small, style, silent, right }: Props) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        if (!silent) playSfx('select');
        onPress();
      }}
      style={({ pressed }) => [
        styles.btn,
        small && styles.small,
        { borderColor: disabled ? C.border : color },
        pressed && { backgroundColor: C.panelHi, transform: [{ scale: 0.97 }] },
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon && <MaterialCommunityIcons name={icon} size={small ? 16 : 20} color={disabled ? C.faint : color} />}
      <View style={styles.textWrap}>
        <Text numberOfLines={1} style={[styles.label, small && styles.labelSmall, { color: disabled ? C.faint : C.text }]}>
          {label}
        </Text>
        {sub ? (
          <Text numberOfLines={1} style={[styles.sub, { color: disabled ? C.faint : C.dim }]}>
            {sub}
          </Text>
        ) : null}
      </View>
      {right}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1.5,
    borderRadius: 10,
    backgroundColor: C.panel,
  },
  small: { paddingHorizontal: 10, paddingVertical: 7, gap: 6 },
  disabled: { opacity: 0.55 },
  textWrap: { flexShrink: 1 },
  label: { fontFamily: F.head, fontSize: 14, letterSpacing: 0.5 },
  labelSmall: { fontSize: 12 },
  sub: { fontFamily: F.mono, fontSize: 11, marginTop: 1 },
});
