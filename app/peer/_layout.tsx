import { Tabs } from 'expo-router';
import { Image } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function PeerLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="peer-home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Image
              source={require('../../assets/images/home.png')}
              style={{
                width: 24,
                height: 24,
                tintColor: color,
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="peer-connect"
        options={{
          title: 'Connect',
          tabBarIcon: ({ color }) => (
            <Image
              source={require('../../assets/images/home.png')}
              style={{
                width: 24,
                height: 24,
                tintColor: color,
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="peer-chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => (
            <Image
              source={require('../../assets/images/home.png')}
              style={{
                width: 24,
                height: 24,
                tintColor: color,
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="peer-setting"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Image
              source={require('../../assets/images/setting.png')}
              style={{
                width: 24,
                height: 24,
                tintColor: color,
              }}
            />
          ),
        }}
      />
    </Tabs>
  );
}
