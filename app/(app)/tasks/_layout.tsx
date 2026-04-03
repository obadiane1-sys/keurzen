import { Stack } from 'expo-router';
import { Colors } from '../../../src/constants/tokens';

export default function TasksLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen
        name="create"
        options={{
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}
