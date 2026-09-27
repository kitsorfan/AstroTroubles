import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeOut, FadeOutUp } from 'react-native-reanimated';

import { LOGS } from '../../game/data/story';
import { useGame, type Toast } from '../../game/store/gameStore';
import { C, F, TONE_COLOR } from '../theme';
import { Button } from './Button';

const TOAST_MS = 3400;

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useGame((s) => s.dismissToast);
  useEffect(() => {
    const id = setTimeout(() => dismiss(toast.id), TOAST_MS);
    return () => clearTimeout(id);
  }, [toast.id, dismiss]);
  return (
    <Animated.View entering={FadeInUp.duration(200)} exiting={FadeOutUp.duration(200)}>
      <Pressable onPress={() => dismiss(toast.id)} style={[styles.toast, { borderLeftColor: TONE_COLOR[toast.tone] }]}>
        <Text style={[styles.toastText, { color: TONE_COLOR[toast.tone] }]}>{toast.text}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function Toasts() {
  const toasts = useGame((s) => s.toasts);
  return (
    <View style={[styles.toasts, { pointerEvents: 'box-none' }]}>
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </View>
  );
}

export function LogReader() {
  const id = useGame((s) => s.readingLog);
  const close = useGame((s) => s.closeLog);
  if (!id) return null;
  const log = LOGS[id];
  if (!log) return null;
  return (
    <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} style={styles.modal}>
      <View style={styles.logCard}>
        <Text style={styles.logKicker}>DATA LOG RECOVERED</Text>
        <Text style={styles.logTitle}>{log.title}</Text>
        <Text style={styles.logAuthor}>{log.author}</Text>
        <ScrollView style={{ maxHeight: 320 }}>
          <Text style={styles.logBody}>{log.body}</Text>
        </ScrollView>
        <Button label="Close" icon="close" onPress={close} style={{ marginTop: 14, alignSelf: 'flex-end' }} />
      </View>
    </Animated.View>
  );
}

export function DeckTransition() {
  const transition = useGame((s) => s.transition);
  const dismiss = useGame((s) => s.dismissTransition);
  useEffect(() => {
    if (!transition) return;
    const id = setTimeout(dismiss, 2600);
    return () => clearTimeout(id);
  }, [transition, dismiss]);
  if (!transition) return null;
  return (
    <Animated.View key={transition.key} entering={FadeIn.duration(400)} exiting={FadeOut.duration(500)} style={styles.transition}>
      <Pressable style={styles.transitionInner} onPress={dismiss}>
        <Text style={styles.transitionKicker}>LIFT ARRIVING</Text>
        <Text style={styles.transitionTitle}>{transition.title.toUpperCase()}</Text>
        <Text style={styles.transitionSub}>{transition.subtitle}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toasts: { position: 'absolute', top: 8, left: 10, right: 10, gap: 6, alignItems: 'stretch' },
  toast: {
    backgroundColor: 'rgba(8,13,26,0.94)',
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 4,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  toastText: { fontFamily: F.mono, fontSize: 13 },
  modal: {
    ...StyleSheet.absoluteFill,
    backgroundColor: C.overlay,
    justifyContent: 'center',
    padding: 18,
  },
  logCard: {
    backgroundColor: '#0d1322',
    borderWidth: 1.5,
    borderColor: C.gold,
    borderRadius: 14,
    padding: 18,
  },
  logKicker: { fontFamily: F.head, fontSize: 10, color: C.gold, letterSpacing: 2 },
  logTitle: { fontFamily: F.title, fontSize: 19, color: C.text, marginTop: 6 },
  logAuthor: { fontFamily: F.mono, fontSize: 12, color: C.dim, marginBottom: 12 },
  logBody: { fontFamily: F.mono, fontSize: 15, lineHeight: 22, color: C.text },
  transition: { ...StyleSheet.absoluteFill, backgroundColor: '#000000' },
  transitionInner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  transitionKicker: { fontFamily: F.head, fontSize: 11, color: C.dim, letterSpacing: 4 },
  transitionTitle: { fontFamily: F.title, fontSize: 30, color: C.accent, textAlign: 'center', marginVertical: 10, letterSpacing: 2 },
  transitionSub: { fontFamily: F.mono, fontSize: 14, color: C.text, textAlign: 'center' },
});
