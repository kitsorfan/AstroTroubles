import { useEffect } from 'react';
import { AppState, BackHandler, Platform, View } from 'react-native';

import { pauseMusic, playMusic } from '../game/audio/sound';
import { useGame } from '../game/store/gameStore';
import { BattleScreen } from './screens/BattleScreen';
import { ExploreScreen } from './screens/ExploreScreen';
import { EndingScreen, GameOverScreen, IntroScreen } from './screens/StoryScreens';
import { TitleScreen } from './screens/TitleScreen';
import { C } from './theme';

// Dev-only handle so browser automation can inspect and drive the store while testing on web.
if (__DEV__ && Platform.OS === 'web') {
  (globalThis as { __leviathan?: typeof useGame }).__leviathan = useGame;
}

export default function GameRoot() {
  const screen = useGame((s) => s.screen);
  const initSettings = useGame((s) => s.initSettings);

  useEffect(() => {
    void initSettings().then(() => {
      if (useGame.getState().screen === 'title') playMusic('title');
    });
  }, [initSettings]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        useGame.getState().autosave();
        pauseMusic(true);
      } else if (state === 'active') {
        pauseMusic(false);
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const s = useGame.getState();
      if (s.screen === 'explore') {
        if (s.readingLog) s.closeLog();
        else if (s.menu) s.setMenu(null);
        else if (!s.dialogue && !s.transition) s.setMenu('pause');
        return true;
      }
      return s.screen !== 'title';
    });
    return () => sub.remove();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {screen === 'title' && <TitleScreen />}
      {screen === 'intro' && <IntroScreen />}
      {screen === 'explore' && <ExploreScreen />}
      {screen === 'battle' && <BattleScreen />}
      {screen === 'gameover' && <GameOverScreen />}
      {screen === 'ending' && <EndingScreen />}
    </View>
  );
}
