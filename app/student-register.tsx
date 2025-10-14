import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';

const COURSES = [
  'Faculty of Commerce and Management',
  'Faculty of Hotel and Tourism Management',
  'Faculty of Allied Health Sciences',
  'Faculty of Agricultural Sciences',
  'Faculty of Applied and Basic Sciences',
  'Faculty of Design',
  'Faculty of Mass Communications and Media Technology',
  'Faculty of Behavioural Sciences',
  'Faculty of Law',
  'Faculty of Education',
  'Faculty of Dental Sciences',
  'Faculty of Naturopathy and Yogic Sciences',
  'Faculty of Indian Medical Sciences',
  'Faculty of Nursing',
  'SGT College Of Pharmacy',
  'Faculty of Physiotherapy',
  'Faculty of Medical Health Sciences',
  'Faculty of Engineering Technology',
  'Faculty of Humanities Social Sciences, and Liberal Arts',
];

export default function StudentRegister() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [course, setCourse] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [courseModalVisible, setCourseModalVisible] = useState(false);

  const handleNameChange = useCallback((text: string) => setName(text), []);
  const handleUsernameChange = useCallback((text: string) => setUsername(text), []);
  const handleRegistrationChange = useCallback((text: string) => setRegistrationNumber(text), []);
  const handleCourseChange = useCallback((text: string) => setCourse(text), []);
  const handlePhoneChange = useCallback((text: string) => setPhone(text), []);
  const handleDobChange = useCallback((text: string) => setDob(text), []);
  const handleEmailChange = useCallback((text: string) => setEmail(text), []);
  const handlePasswordChange = useCallback((text: string) => setPassword(text), []);

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  const handleRegister = async () => {
    if (name && username && registrationNumber && course && phone && dob && email && password) {
      try {
        // Check if registration number, email, or username already exists in user_requests table
        const { data: existingUser, error: userError } = await supabase
          .from('user_requests')
          .select('*')
          .or(`registration_number.eq.${registrationNumber},email.eq.${email},username.eq.${username}`);

        if (userError) {
          Alert.alert('Error', userError.message);
          return;
        }

        if (existingUser && existingUser.length > 0) {
          Alert.alert('Error', 'Registration number, email, or username already exists.');
          return;
        }

        // Check if there's already a request for this registration number
        const { data: existingRequest, error: requestError } = await supabase
          .from('user_requests')
          .select('*')
          .eq('registration_number', registrationNumber);

        if (requestError) {
          Alert.alert('Error', requestError.message);
          return;
        }

        if (existingRequest && existingRequest.length > 0) {
          Alert.alert('Already Registered', 'This registration number is already registered. Please try logging in.');
          return;
        }

        // Insert into user_requests table with auto-approved status
        const { error: requestInsertError } = await supabase
          .from('user_requests')
          .insert([
            {
              user_name: name,
              username: username,
              user_type: 'Student',
              registration_number: registrationNumber,
              email: email,
              course: course,
              password: password,
              phone: phone,
              dob: dob,
              created_at: new Date().toISOString()
            }
          ]);

        if (requestInsertError) {
          Alert.alert('Error', requestInsertError.message);
          return;
        }

        Alert.alert(
          '✅ Registration Successful',
          `Welcome ${name}! Your student account has been created successfully. You can now log in with your credentials.`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to login page
                router.replace('/');
              }
            }
          ]
        );
      } catch (error) {
        console.error('Registration error:', error);
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    } else {
      Alert.alert('Error', 'Please fill all fields.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <Svg
        height="100%"
        width="100%"
        style={{ position: 'absolute', top: '20%' }}
        viewBox="0 0 100 100"
      >
        <Path
          d="M0,20 C30,40 70,0 100,20 L100,100 L0,100 Z"
          fill="#D8BFD8"
        />
      </Svg>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: 50,
          paddingHorizontal: 20,
          paddingBottom: 15,
          backgroundColor: 'transparent',
        }}>
          <TouchableOpacity
            style={{
              backgroundColor: Colors.white,
              paddingVertical: 8,
              paddingHorizontal: 15,
              borderRadius: 20,
              marginRight: 15,
              elevation: 4,
              shadowColor: Colors.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              borderWidth: 2,
              borderColor: Colors.primary,
            }}
            onPress={() => router.back()}
          >
            <Text style={{ color: Colors.primary, fontSize: 16, fontWeight: 'bold' }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{
            color: Colors.white,
            fontSize: 20,
            fontWeight: 'bold',
            flex: 1,
            textShadowColor: Colors.black,
            textShadowOffset: { width: 2, height: 2 },
            textShadowRadius: 3,
          }}>Student Registration</Text>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={{ paddingHorizontal: 20, paddingBottom: 30 }}>
            <View style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 25,
              marginTop: 20,
              elevation: 8,
              shadowColor: Colors.shadow,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}>

              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.primary, marginBottom: 8 }}>Full Name *</Text>
                <TextInput
                  style={{
                    backgroundColor: '#f5f5f5',
                    borderRadius: 10,
                    padding: 14,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: '#e0e0e0',
                  }}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#a8a8a8"
                />
              </View>

              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.primary, marginBottom: 8 }}>Email Address *</Text>
                <TextInput
                  style={{
                    backgroundColor: '#f5f5f5',
                    borderRadius: 10,
                    padding: 14,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: '#e0e0e0',
                  }}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="#a8a8a8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.primary, marginBottom: 8 }}>Phone Number *</Text>
                <TextInput
                  style={{
                    backgroundColor: '#f5f5f5',
                    borderRadius: 10,
                    padding: 14,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: '#e0e0e0',
                  }}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#a8a8a8"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.primary, marginBottom: 8 }}>Username *</Text>
                <TextInput
                  style={{
                    backgroundColor: '#f5f5f5',
                    borderRadius: 10,
                    padding: 14,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: '#e0e0e0',
                  }}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Choose a username"
                  placeholderTextColor="#a8a8a8"
                  autoCapitalize="none"
                />
              </View>

              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.primary, marginBottom: 8 }}>Registration Number *</Text>
                <TextInput
                  style={{
                    backgroundColor: '#f5f5f5',
                    borderRadius: 10,
                    padding: 14,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: '#e0e0e0',
                  }}
                  value={registrationNumber}
                  onChangeText={setRegistrationNumber}
                  placeholder="Enter your registration number"
                  placeholderTextColor="#a8a8a8"
                />
              </View>

              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.primary, marginBottom: 8 }}>Course/Program *</Text>
                <TouchableOpacity
                  onPress={() => setCourseModalVisible(true)}
                  style={{
                    backgroundColor: '#f5f5f5',
                    borderRadius: 10,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: '#e0e0e0',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    color: course ? '#333' : '#a8a8a8',
                    fontSize: 16,
                    flex: 1,
                  }}>
                    {course || 'Select your course or program'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.primary, marginBottom: 8 }}>Date of Birth *</Text>
                <TextInput
                  style={{
                    backgroundColor: '#f5f5f5',
                    borderRadius: 10,
                    padding: 14,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: '#e0e0e0',
                  }}
                  value={dob}
                  onChangeText={setDob}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#a8a8a8"
                />
              </View>

              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.primary, marginBottom: 8 }}>Password *</Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    style={{
                      backgroundColor: '#f5f5f5',
                      borderRadius: 10,
                      padding: 14,
                      paddingRight: 45,
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: '#e0e0e0',
                    }}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Create a password (min 6 characters)"
                    placeholderTextColor="#a8a8a8"
                    secureTextEntry={!passwordVisible}
                  />
                  <TouchableOpacity
                    onPress={() => setPasswordVisible(!passwordVisible)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: 14,
                      padding: 4
                    }}
                  >
                    <Ionicons
                      name={passwordVisible ? 'eye-off' : 'eye'}
                      size={24}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: Colors.primary,
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  marginTop: 10,
                  elevation: 3,
                  shadowColor: Colors.shadow,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                }}
                onPress={handleRegister}
              >
                <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Course Selection Modal */}
      <Modal
        visible={courseModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCourseModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: 'white',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '70%',
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 20,
              borderBottomWidth: 1,
              borderBottomColor: '#e0e0e0',
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: Colors.primary,
              }}>Select Faculty</Text>
              <TouchableOpacity onPress={() => setCourseModalVisible(false)}>
                <Ionicons name="close" size={28} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: '100%' }}>
              {COURSES.map((courseItem, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setCourse(courseItem);
                    setCourseModalVisible(false);
                  }}
                  style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: '#f0f0f0',
                    backgroundColor: course === courseItem ? Colors.accentLight : 'white',
                  }}
                >
                  <Text style={{
                    fontSize: 16,
                    color: course === courseItem ? Colors.primary : '#333',
                    fontWeight: course === courseItem ? 'bold' : 'normal',
                  }}>
                    {index + 1}. {courseItem}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

