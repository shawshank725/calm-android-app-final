import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Animated, Easing, Image, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';

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

export default function PeerHome() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [peerName, setPeerName] = useState('Peer Listener');
  const [selectedProfilePic, setSelectedProfilePic] = useState(0);
  const [activeStudents, setActiveStudents] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Load peer listener data
  useEffect(() => {
    const loadPeerData = async () => {
      try {
        let regNo = params.registration as string;

        if (!regNo) {
          const storedReg = await AsyncStorage.getItem('currentPeerReg');
          if (storedReg) regNo = storedReg;
        }

        if (regNo) {

          // Load name and profile data
          const [storedName, picIdx] = await Promise.all([
            AsyncStorage.getItem('currentPeerName'),
            AsyncStorage.getItem(`peerProfilePic_${regNo}`)
          ]);

          if (storedName) setPeerName(storedName);
          if (picIdx !== null) setSelectedProfilePic(parseInt(picIdx, 10));

          // Load peer listener statistics
          await loadPeerStats(regNo);
        }
      } catch (error) {
        console.error('Error loading peer data:', error);
      }
    };

    loadPeerData();
  }, [params.registration]);

  const loadPeerStats = async (regNo: string) => {
    try {
      // Get active students count
      const { data: sessions, error: sessionsError } = await supabase
        .from('peer_sessions')
        .select('*')
        .eq('peer_reg', regNo)
        .eq('status', 'active');

      if (!sessionsError && sessions) {
        setActiveStudents(sessions.length);
      }

      // Get total sessions count
      const { data: totalSessionsData, error: totalError } = await supabase
        .from('peer_sessions')
        .select('*')
        .eq('peer_reg', regNo);

      if (!totalError && totalSessionsData) {
        setTotalSessions(totalSessionsData.length);
      }

      // Get pending requests count
      const { data: requests, error: requestsError } = await supabase
        .from('peer_requests')
        .select('*')
        .eq('peer_reg', regNo)
        .eq('status', 'pending');

      if (!requestsError && requests) {
        setPendingRequests(requests.length);
      }
    } catch (error) {
      console.error('Error loading peer stats:', error);
    }
  };

  // Animate in on focus
  useFocusEffect(
    useCallback(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }, [fadeAnim])
  );

  const quickActions = [
    {
      icon: 'people-outline',
      title: 'Connect with Student',
      subtitle: 'Start a new session',
      onPress: () => router.push('/peer/peer-connect' as any),
      color: Colors.primary,
    },
    {
      icon: 'chatbubbles-outline',
      title: 'Active Chats',
      subtitle: `${activeStudents} ongoing`,
      onPress: () => router.push('/peer/peer-chat' as any),
      color: Colors.secondary,
    },
    {
      icon: 'calendar-outline',
      title: 'My Schedule',
      subtitle: 'View availability',
      onPress: () => router.push('/peer/peer-schedule' as any),
      color: Colors.accent,
    },
    {
      icon: 'book-outline',
      title: 'Resources',
      subtitle: 'Help materials',
      onPress: () => router.push('/peer/peer-resources' as any),
      color: Colors.success,
    },
  ];

  return (
    <LinearGradient
      colors={[Colors.primary + '20', Colors.background]}
      style={{ flex: 1 }}
    >
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {/* Header */}
          <View style={{
            paddingTop: Platform.OS === 'ios' ? 60 : 40,
            paddingHorizontal: 20,
            paddingBottom: 20,
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={profilePics[selectedProfilePic]}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    marginRight: 15,
                  }}
                />
                <View>
                  <Text style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: Colors.text,
                  }}>
                    Hi, {peerName}!
                  </Text>
                  <Text style={{
                    fontSize: 16,
                    color: Colors.textSecondary,
                  }}>
                    Ready to help today?
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => router.push('/peer/peer-setting' as any)}
                style={{
                  padding: 8,
                  borderRadius: 20,
                  backgroundColor: Colors.backgroundLight,
                }}
              >
                <Ionicons name="settings-outline" size={24} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Stats Cards */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}>
              <View style={{
                flex: 1,
                backgroundColor: Colors.backgroundLight,
                padding: 15,
                borderRadius: 12,
                marginRight: 8,
                alignItems: 'center',
              }}>
                <Text style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: Colors.primary,
                }}>
                  {activeStudents}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: Colors.textSecondary,
                  textAlign: 'center',
                }}>
                  Active Students
                </Text>
              </View>

              <View style={{
                flex: 1,
                backgroundColor: Colors.backgroundLight,
                padding: 15,
                borderRadius: 12,
                marginHorizontal: 4,
                alignItems: 'center',
              }}>
                <Text style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: Colors.secondary,
                }}>
                  {totalSessions}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: Colors.textSecondary,
                  textAlign: 'center',
                }}>
                  Total Sessions
                </Text>
              </View>

              <View style={{
                flex: 1,
                backgroundColor: Colors.backgroundLight,
                padding: 15,
                borderRadius: 12,
                marginLeft: 8,
                alignItems: 'center',
              }}>
                <Text style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: Colors.accent,
                }}>
                  {pendingRequests}
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: Colors.textSecondary,
                  textAlign: 'center',
                }}>
                  Pending Requests
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: Colors.text,
              marginBottom: 15,
            }}>
              Quick Actions
            </Text>

            <View style={{ gap: 12 }}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={action.onPress}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: Colors.backgroundLight,
                    padding: 16,
                    borderRadius: 12,
                    shadowColor: Colors.shadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: action.color + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 15,
                  }}>
                    <Ionicons name={action.icon as any} size={24} color={action.color} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: Colors.text,
                      marginBottom: 2,
                    }}>
                      {action.title}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: Colors.textSecondary,
                    }}>
                      {action.subtitle}
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bottom spacing */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </Animated.View>
    </LinearGradient>
  );
}
