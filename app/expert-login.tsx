import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ImageBackground, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function ExpertLogin() {
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleRegistrationChange = useCallback((text: string) => {
    setRegistrationNumber(text);
  }, []);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
  }, []);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  const handleLogin = async () => {
    if (!registrationNumber || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      // First check if expert exists in experts table
      const { data: expertData, error: expertError } = await supabase
        .from('experts')
        .select('*')
        .eq('registration_number', registrationNumber)
        .eq('password', password)
        .single();

      if (expertError || !expertData) {
        Alert.alert('Error', 'Invalid credentials or expert not found');
        return;
      }

      // Update last login timestamp
      await supabase
        .from('experts')
        .update({ last_login: new Date().toISOString() })
        .eq('id', expertData.id);

      // Store expert data
      await AsyncStorage.setItem('currentExpertReg', registrationNumber);
      await AsyncStorage.setItem('currentExpertName', expertData.user_name || 'Expert');

      // Navigate to expert home
      router.replace(`./expert/expert-home?registration=${registrationNumber}`);

    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Login failed. Please try again.');
    }
  };

  return (
    <ImageBackground
      style={{ flex: 1, backgroundColor: '#D8BFD8' }} // Set light purple background
      resizeMode="cover"
    >
      {/* Back Button - Top Left */}
      <View style={{ position: 'absolute', top: 50, left: 20, zIndex: 10 }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#884adaff',
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 20,
            elevation: 4,
            shadowColor: '#e8b4ff',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          }}
          onPress={handleBackPress}
          activeOpacity={0.3}
          delayPressIn={0}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={{
        flex: 1,
        backgroundColor: '#d1bbd1ff',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24
      }}>
        <View style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 20,
          padding: 30,
          width: '100%',
          maxWidth: 400,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
        }}>
          <Text style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: '#884adaff',
            textAlign: 'center',
            marginBottom: 10
          }}>
            Expert Login
          </Text>
          <Text style={{
            fontSize: 16,
            color: '#666',
            textAlign: 'center',
            marginBottom: 30
          }}>
            Mental Health Professional Access
          </Text>

          <TextInput
            style={{
              borderWidth: 2,
              borderColor: '#884adaff',
              borderRadius: 15,
              padding: 15,
              fontSize: 16,
              marginBottom: 20,
              backgroundColor: '#fff'
            }}
            placeholder="Expert Registration Number"
            value={registrationNumber}
            onChangeText={handleRegistrationChange}
            autoCorrect={false}
            spellCheck={false}
            returnKeyType="next"
            autoCapitalize="none"
          />

          <View style={{ position: 'relative', width: '100%', marginBottom: 30 }}>
            <TextInput
              style={{
                borderWidth: 2,
                borderColor: '#884adaff',
                borderRadius: 15,
                padding: 15,
                paddingRight: 50, // Make space for the eye icon
                fontSize: 16,
                backgroundColor: '#fff'
              }}
              placeholder="Password"
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry={!showPassword}
              autoCorrect={false}
              spellCheck={false}
              returnKeyType="done"
            />
            <TouchableOpacity
              onPress={togglePasswordVisibility}
              style={{
                position: 'absolute',
                right: 15,
                top: '50%',
                transform: [{ translateY: -10 }],
              }}
              activeOpacity={0.3}
              delayPressIn={0}
            >
              <Text style={{ color: '#884adaff', fontSize: 16 }}>
                {showPassword ? '🙈' : '👁️'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: '#884adaff',
              borderRadius: 15,
              padding: 18,
              alignItems: 'center',
              marginBottom: 15,
              elevation: 5,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.2,
              shadowRadius: 5,
            }}
            onPress={handleLogin}
            activeOpacity={0.3}
            delayPressIn={0}
          >
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
              Login as Expert
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('./forget')}
            style={{ alignItems: 'center', marginBottom: 20 }}
            activeOpacity={0.3}
            delayPressIn={0}
          >
            <Text style={{ color: '#884adaff', fontSize: 16, textDecorationLine: 'underline' }}>
              Forgot your password?
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}
