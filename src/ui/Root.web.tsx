import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { Text, View } from 'react-native';

import { C, F } from './theme';

function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
      <Text style={{ color: C.accent, fontFamily: F.head, letterSpacing: 3 }}>BOOTING HALCYON...</Text>
    </View>
  );
}

// Skia needs CanvasKit (public/canvaskit.wasm, copied by `npx setup-skia-web`) before any Skia component renders on web.
export default function Root() {
  return <WithSkiaWeb opts={{ locateFile: (file: string) => `/${file}` }} getComponent={() => import('./GameRoot')} fallback={<Loading />} />;
}
