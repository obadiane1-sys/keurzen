import { Stack } from 'expo-router';
import { Colors } from '../../src/constants/tokens';

export default function AuthCallbackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    />
  );
}
