import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Modal, Platform, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';

export default function PeerSetting() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [peerRegNo, setPeerRegNo] = useState('');
  const [peerName, setPeerName] = useState('Peer Listener');

  const profilePics = [
    require('../../assets/images/profile/pic1.png'),
    require('../../assets/images/profile/pic2.png'),
    require('../../assets/images/profile/pic3.png'),
    require('../../assets/images/profile/pic4.png'),
    require('../../assets/images/profile/pic5.png'),
    require('../../assets/images/profile/pic6.png'),
    require('../../assets/images/profile/pic7.png'),
    require('../../assets/images/profile/pic8.png'),
    require('../../assets/images/profile/pic9.png'),
    require('../../assets/images/profile/pic10.png'),
    require('../../assets/images/profile/pic11.png'),
    require('../../assets/images/profile/pic12.png'),
    require('../../assets/images/profile/pic13.png'),
  ];

  const [selectedProfilePic, setSelectedProfilePic] = useState(0);
  const [choosePicModal, setChoosePicModal] = useState(false);


  // Peer profile states
  const [peerProfile, setPeerProfile] = useState({
    bio: '',
    email: '',
    specialization: '',
    availability: '',
  });

  useEffect(() => {
    const loadPeerData = async () => {
      try {
        let regNo = params.registration as string;

        if (!regNo) {
          const storedReg = await AsyncStorage.getItem('currentPeerReg');
          if (storedReg) regNo = storedReg;
        }

        if (regNo) {
          setPeerRegNo(regNo);

          // Load name and profile data
          const [storedName, picIdx] = await Promise.all([
            AsyncStorage.getItem('currentPeerName'),
            AsyncStorage.getItem(`peerProfilePic_${regNo}`)
          ]);

          if (storedName) {
            setPeerName(storedName);
          }

          if (picIdx !== null) {
            setSelectedProfilePic(parseInt(picIdx, 10));
          }

          // Load peer data from database
          try {
            const { data: peerUserData, error } = await supabase
              .from('user_requests')
              .select('*')
              .eq('registration_number', regNo)
              .eq('user_type', 'Peer Listener')
              .single();

            if (error) {
              console.error('Error loading peer from user_requests table:', error);
            } else if (peerUserData) {
              console.log('Successfully loaded peer data:', peerUserData);

              if (peerUserData.user_name) {
                setPeerName(peerUserData.user_name);
                await AsyncStorage.setItem('currentPeerName', peerUserData.user_name);
              }

              setPeerProfile({
                bio: peerUserData.bio || `Peer Listener specializing in ${peerUserData.specialization || 'Mental Health Support'}`,
                email: peerUserData.email || '',
                specialization: peerUserData.specialization || 'Mental Health Support',
                availability: peerUserData.availability || 'Available',
              });
            }
          } catch (dbError) {
            console.error('Database error loading peer:', dbError);
          }
        }
      } catch (error) {
        console.error('Error loading peer data:', error);
      }
    };

    loadPeerData();
  }, [params.registration]);

  const handleProfilePicChange = async (index: number) => {
    setSelectedProfilePic(index);
    setChoosePicModal(false);

    if (peerRegNo) {
      await AsyncStorage.setItem(`peerProfilePic_${peerRegNo}`, index.toString());
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'currentPeerReg',
                'currentPeerName',
                'userType',
              ]);
              router.replace('/');
            } catch (error) {
              console.error('Error during logout:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={[Colors.primary + '20', Colors.background]}
      style={{ flex: 1 }}
    >
      {/* Header */}
      <View style={{
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            padding: 8,
            borderRadius: 20,
            backgroundColor: Colors.backgroundLight,
          }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>

        <Text style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: Colors.text,
        }}>
          Settings
        </Text>

        <TouchableOpacity
          onPress={() => {/* Add refresh functionality */}}
          style={{
            padding: 8,
            borderRadius: 20,
            backgroundColor: Colors.backgroundLight,
          }}
        >
          <Ionicons name="refresh" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Profile Section */}
      <View style={{
        paddingHorizontal: 20,
        marginBottom: 30,
      }}>
        <View style={{
          backgroundColor: Colors.backgroundLight,
          borderRadius: 16,
          padding: 20,
          shadowColor: Colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}>
          {/* Profile Picture */}
          <TouchableOpacity
            onPress={() => setChoosePicModal(true)}
            style={{
              alignSelf: 'center',
              marginBottom: 15,
            }}
          >
            <Image
              source={profilePics[selectedProfilePic]}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                borderWidth: 3,
                borderColor: Colors.primary,
              }}
            />
            <View style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              backgroundColor: Colors.primary,
              borderRadius: 15,
              width: 30,
              height: 30,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Ionicons name="camera" size={16} color={Colors.background} />
            </View>
          </TouchableOpacity>

          {/* Profile Info */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: Colors.text,
              marginBottom: 5,
            }}>
              {peerName}
            </Text>
            <Text style={{
              fontSize: 16,
              color: Colors.textSecondary,
              marginBottom: 5,
            }}>
              Peer Listener • {peerRegNo}
            </Text>
            <Text style={{
              fontSize: 14,
              color: Colors.primary,
              fontWeight: '600',
            }}>
              {peerProfile.specialization}
            </Text>
          </View>

          {/* Profile Details */}
          <View style={{ gap: 12 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              paddingHorizontal: 16,
              backgroundColor: Colors.backgroundLight,
              borderRadius: 12,
              marginBottom: 8,
            }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: Colors.accentLight,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}>
                <Ionicons name="person-outline" size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: Colors.primary,
                  fontSize: 14,
                  fontWeight: '600',
                  marginBottom: 2,
                }}>
                  Bio
                </Text>
                <Text style={{
                  color: Colors.text,
                  fontSize: 16,
                  fontWeight: '500',
                }}>
                  {peerProfile.bio}
                </Text>
              </View>
            </View>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              paddingHorizontal: 16,
              backgroundColor: Colors.backgroundLight,
              borderRadius: 12,
              marginBottom: 8,
            }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: Colors.accentLight,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}>
                <Ionicons name="mail-outline" size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: Colors.primary,
                  fontSize: 14,
                  fontWeight: '600',
                  marginBottom: 2,
                }}>
                  Email
                </Text>
                <Text style={{
                  color: Colors.text,
                  fontSize: 16,
                  fontWeight: '500',
                }}>
                  {peerProfile.email || 'Not provided'}
                </Text>
              </View>
            </View>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              paddingHorizontal: 16,
              backgroundColor: Colors.backgroundLight,
              borderRadius: 12,
              marginBottom: 8,
            }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: Colors.accentLight,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}>
                <Ionicons name="time-outline" size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: Colors.primary,
                  fontSize: 14,
                  fontWeight: '600',
                  marginBottom: 2,
                }}>
                  Availability
                </Text>
                <Text style={{
                  color: Colors.text,
                  fontSize: 16,
                  fontWeight: '500',
                }}>
                  {peerProfile.availability}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Logout Button */}
      <View style={{ paddingHorizontal: 20 }}>
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: '#ffebee',
            borderRadius: 16,
            paddingVertical: 16,
            paddingHorizontal: 24,
            marginTop: 20,
            shadowColor: Colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
            width: '100%',
            alignItems: 'center',
          }}
        >
          <Text style={{
            color: '#d84315',
            fontSize: 16,
            fontWeight: '600',
          }}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>

      {/* Profile Picture Selection Modal */}
      <Modal
        visible={choosePicModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setChoosePicModal(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}>
          <View style={{
            backgroundColor: Colors.background,
            borderRadius: 20,
            padding: 20,
            width: '90%',
            maxHeight: '70%',
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: Colors.text,
              marginBottom: 20,
              textAlign: 'center',
            }}>
              Choose Profile Picture
            </Text>

            <FlatList
              data={profilePics}
              numColumns={3}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onPress={() => handleProfilePicChange(index)}
                  style={{
                    flex: 1,
                    margin: 8,
                    alignItems: 'center',
                  }}
                >
                  <Image
                    source={item}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      borderWidth: selectedProfilePic === index ? 3 : 0,
                      borderColor: Colors.primary,
                    }}
                  />
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              onPress={() => setChoosePicModal(false)}
              style={{
                backgroundColor: Colors.primary,
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: 'center',
                marginTop: 20,
              }}
            >
              <Text style={{
                color: Colors.background,
                fontSize: 16,
                fontWeight: '600',
              }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}
