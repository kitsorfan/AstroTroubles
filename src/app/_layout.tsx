import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar hidden style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: '#03040a' } }} />
    </>
  );
}
