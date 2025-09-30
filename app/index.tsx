import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function FrontPage() {
  const router = useRouter();
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [loaded] = useFonts({
    Agbalumo: require('../assets/fonts/Agbalumo-Regular.ttf'),
    Tinos: require('../assets/fonts/Tinos-Regular.ttf'),
    IrishGrover: require('../assets/fonts/IrishGrover-Regular.ttf'),
    Roboto: require('../assets/fonts/Roboto.ttf'),
  });

  useEffect(() => {
    // Fonts loaded, but navigation is now handled by buttons
  }, [loaded]);

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7965AF" />
      </View>
    );
  }

  return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
        <Image
          source={require('../assets/images/logo2.png')}
          style={{ width: 250, height: 200, marginTop: 50 }}
        />
        <Text style={{
          textAlign: 'center',
          fontSize: 60,
          fontWeight: '600',
          color: '#4F21A2',
          fontFamily: 'Agbalumo',
          letterSpacing: -1,
        }}>
          C.A.L.M
        </Text>
        <Text style={{
          marginTop: -19,
          textAlign: 'center',
          fontSize: 60,
          color: '#4F21A2',
          fontFamily: 'Agbalumo'
        }}>
          Companion
        </Text>
        <Text
          style={{
            marginTop: 15,
            fontSize: 20,
            fontWeight: 'bold',
            color: '#4F21A2',
            textAlign: 'center',
            fontFamily: 'Tinos'
          }}
        >
          Powered By{"\n"}
          C.A.L.M Spaces{"\n"}
          CEAPS, SGT UNIVERSITY{"\n"}
          Cultivating Awareness, Lightness & Movement
        </Text>

        {/* Login and Register Buttons */}
        <View style={{ marginTop: 40, width: '80%', alignItems: 'center' }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#4F21A2',
              paddingVertical: 15,
              paddingHorizontal: 40,
              borderRadius: 25,
              marginBottom: 15,
              width: '100%',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
            onPress={() => setLoginModalVisible(true)}
          >
            <Text style={{
              color: 'white',
              fontSize: 18,
              fontWeight: 'bold',
              fontFamily: 'Tinos'
            }}>
              Login
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: 'transparent',
              borderWidth: 2,
              borderColor: '#4F21A2',
              paddingVertical: 15,
              paddingHorizontal: 40,
              borderRadius: 25,
              width: '100%',
              alignItems: 'center',
            }}
            onPress={() => router.push('/select2')}
          >
            <Text style={{
              color: '#4F21A2',
              fontSize: 18,
              fontWeight: 'bold',
              fontFamily: 'Tinos'
            }}>
              Register
            </Text>
          </TouchableOpacity>
        </View>

        {/* Login Modal */}
        <Modal
          visible={loginModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setLoginModalVisible(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 30,
              width: '90%',
              maxWidth: 400,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 10,
            }}>
              <Text style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: '#4F21A2',
                textAlign: 'center',
                marginBottom: 20,
                fontFamily: 'Tinos'
              }}>
                Login
              </Text>

              <Text style={{
                fontSize: 16,
                color: '#666',
                marginBottom: 8,
                fontFamily: 'Tinos'
              }}>
                Registration No / Email
              </Text>
              <TextInput
                style={{
                  borderWidth: 2,
                  borderColor: '#4F21A2',
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 16,
                  marginBottom: 15,
                  fontFamily: 'Tinos'
                }}
                placeholder="Enter registration number or email"
                value={loginInput}
                onChangeText={setLoginInput}
                autoCapitalize="none"
              />

              <Text style={{
                fontSize: 16,
                color: '#666',
                marginBottom: 8,
                fontFamily: 'Tinos'
              }}>
                Password
              </Text>
              <TextInput
                style={{
                  borderWidth: 2,
                  borderColor: '#4F21A2',
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 16,
                  marginBottom: 20,
                  fontFamily: 'Tinos'
                }}
                placeholder="Enter password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
              />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderColor: '#4F21A2',
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 10,
                    flex: 0.45,
                  }}
                  onPress={() => {
                    setLoginModalVisible(false);
                    setLoginInput('');
                    setPassword('');
                  }}
                >
                  <Text style={{
                    color: '#4F21A2',
                    fontSize: 16,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    fontFamily: 'Tinos'
                  }}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    backgroundColor: '#4F21A2',
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                    borderRadius: 10,
                    flex: 0.45,
                  }}
                  onPress={async () => {
                    if (loginInput.trim() && password.trim()) {
                      setIsLoading(true);
                      
                      try {
                        // Check admin credentials first
                        if (loginInput.trim() === '241302262' && password.trim() === 'Calmspaces@741') {
                          await AsyncStorage.setItem('userType', 'admin');
                          await AsyncStorage.setItem('currentAdminData', JSON.stringify({
                            registration: '241302262',
                            role: 'admin'
                          }));
                          setLoginModalVisible(false);
                          setLoginInput('');
                          setPassword('');
                          router.push('/admin/admin-home');
                          setIsLoading(false);
                          return;
                        }

                        // Check students table
                        const { data: studentData, error: studentError } = await supabase
                          .from('students')
                          .select('*')
                          .or(`registration.eq.${loginInput.trim()},email.eq.${loginInput.trim()}`)
                          .eq('password', password.trim())
                          .single();

                        if (studentData && !studentError) {
                          await AsyncStorage.setItem('userType', 'student');
                          await AsyncStorage.setItem('currentStudentData', JSON.stringify(studentData));
                          await AsyncStorage.setItem('currentStudentReg', studentData.registration);
                          setLoginModalVisible(false);
                          setLoginInput('');
                          setPassword('');
                          router.push(`/student/student-home?registration=${studentData.registration}`);
                          setIsLoading(false);
                          return;
                        }

                        // Check experts table
                        const { data: expertData, error: expertError } = await supabase
                          .from('experts')
                          .select('*')
                          .or(`registration.eq.${loginInput.trim()},email.eq.${loginInput.trim()}`)
                          .eq('password', password.trim())
                          .single();

                        if (expertData && !expertError) {
                          await AsyncStorage.setItem('userType', 'expert');
                          await AsyncStorage.setItem('currentExpertData', JSON.stringify(expertData));
                          await AsyncStorage.setItem('currentExpertReg', expertData.registration);
                          setLoginModalVisible(false);
                          setLoginInput('');
                          setPassword('');
                          router.push(`/expert/expert-home?registration=${expertData.registration}`);
                          setIsLoading(false);
                          return;
                        }

                        // Check peer_listeners table
                        const { data: peerData, error: peerError } = await supabase
                          .from('peer_listeners')
                          .select('*')
                          .or(`registration.eq.${loginInput.trim()},email.eq.${loginInput.trim()}`)
                          .eq('password', password.trim())
                          .single();

                        if (peerData && !peerError) {
                          await AsyncStorage.setItem('userType', 'peer_listener');
                          await AsyncStorage.setItem('currentPeerData', JSON.stringify(peerData));
                          await AsyncStorage.setItem('currentPeerReg', peerData.registration);
                          setLoginModalVisible(false);
                          setLoginInput('');
                          setPassword('');
                          // Add peer listener home route when available
                          router.push('/peer-listener-login'); // Fallback route
                          setIsLoading(false);
                          return;
                        }

                        // No match found
                        Alert.alert('Login Failed', 'Invalid registration number/email or password. Please check your credentials and try again.');
                        setIsLoading(false);
                        
                      } catch (error) {
                        console.error('Login error:', error);
                        Alert.alert('Error', 'An error occurred during login. Please try again.');
                        setIsLoading(false);
                      }
                    } else {
                      Alert.alert('Error', 'Please fill in both fields');
                    }
                  }}
                >
                  <Text style={{
                    color: 'white',
                    fontSize: 16,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    fontFamily: 'Tinos'
                  }}>
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
  );
}
