import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function FontProvider({ children }: { children: React.ReactNode }) {
  const [loaded] = useFonts({
    Tinos: require('@/assets/fonts/Tinos-Regular.ttf'),
    'Tinos-Bold': require('@/assets/fonts/Tinos-Bold.ttf'),
    IrishGrover: require('@/assets/fonts/IrishGrover-Regular.ttf'),
    Roboto: require('@/assets/fonts/Roboto.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <>{children}</>;
}
