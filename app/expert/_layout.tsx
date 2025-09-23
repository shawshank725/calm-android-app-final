import { Stack } from 'expo-router';
import React from 'react';

export default function ExpertLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="expert-home" />
      <Stack.Screen name="calm" />
    </Stack>
  );
}
