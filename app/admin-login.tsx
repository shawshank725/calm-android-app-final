import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUsernameChange = useCallback((text: string) => {
    setUsername(text);
  }, []);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
  }, []);

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password.');
      return;
    }

    setIsLoading(true);

    try {
      // Simple authentication with your specific credentials
      if (username.trim() === '241302262' && password === '9266563155') {
        // Store admin session
        await AsyncStorage.setItem('adminUser', JSON.stringify({
          id: 1,
          username: '241302262',
          email: 'admin@app.com',
          role: 'admin'
        }));

        Alert.alert('Login Success', 'Welcome, Admin!', [
          {
            text: 'Continue',
            onPress: () => router.replace('/admin/admin-home')
          }
        ]);
      } else {
        Alert.alert('Error', 'Invalid credentials. Please check your username and password.');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Back Button - Top Left */}
      <View style={{ position: 'absolute', top: 50, left: 20, zIndex: 10 }}>
        <TouchableOpacity
          style={{
            backgroundColor: Colors.buttonPrimary,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 20,
            elevation: 4,
            shadowColor: Colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          }}
          onPress={() => router.back()}
        >
          <Text style={{ color: Colors.white, fontSize: 16, fontWeight: 'bold', fontFamily: 'Agbalumo' }}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
          paddingTop: 100,
          marginTop: -200
        }}
        showsVerticalScrollIndicator={false}
      >
        <Image source={require('../assets/images/logo2.png')} style={{ width: 200, height: 150, marginBottom: 12, transform: [{ translateY: -10 }] }} />
        <Text style={{
        color: Colors.white,
        fontSize: 50,
        fontWeight: 'bold',
        marginBottom: 32,
        fontFamily: 'Agbalumo',
        textShadowColor: Colors.black,
        textShadowOffset: { width: 3, height: 3 },
        textShadowRadius: 3
      }}>
        Admin Login
      </Text>
      <TextInput
        placeholder="Username"
        placeholderTextColor={Colors.tertiary}
        value={username}
        onChangeText={setUsername}
        style={{
          width: 280,
          backgroundColor: Colors.primary,
          color: Colors.white,
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
        }}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor={Colors.tertiary}
        value={password}
        onChangeText={setPassword}
        style={{
          width: 280,
          backgroundColor: Colors.primary,
          color: Colors.white,
          borderRadius: 8,
          padding: 12,
          marginBottom: 24,
        }}
        secureTextEntry
      />
      <TouchableOpacity
        onPress={handleLogin}
        disabled={isLoading}
        style={{
          backgroundColor: isLoading ? Colors.buttonDisabled : Colors.buttonPrimary,
          paddingVertical: 14,
          paddingHorizontal: 40,
          borderRadius: 8,
          marginBottom: 24,
        }}
      >
        <Text style={{ color: Colors.white, fontSize: 18, fontWeight: 'bold' }}>
          {isLoading ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>

        <Text style={{ color: Colors.white, fontSize: 12, textAlign: 'center', marginTop: 20 }}>
          Admin Access Only
        </Text>
      </ScrollView>
    </View>
  );
}
