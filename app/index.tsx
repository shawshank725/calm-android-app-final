import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function FrontPage() {
  const router = useRouter();
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');

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
                  onPress={() => {
                    if (loginInput.trim() && password.trim()) {
                      // Handle login logic here
                      Alert.alert('Login', `Attempting login with: ${loginInput}`);
                      setLoginModalVisible(false);
                      setLoginInput('');
                      setPassword('');
                      // You can add actual authentication logic here
                      router.push('/select');
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
                    Login
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
  );
}
