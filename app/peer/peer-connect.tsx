import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';

interface StudentRequest {
  id: string;
  student_reg: string;
  student_name: string;
  message: string;
  urgency_level: 'low' | 'medium' | 'high';
  created_at: string;
  status: 'pending' | 'accepted' | 'declined';
}

interface ActiveSession {
  id: string;
  student_reg: string;
  student_name: string;
  started_at: string;
  status: 'active' | 'paused' | 'ended';
}

export default function PeerConnect() {
  const router = useRouter();
  const [peerRegNo, setPeerRegNo] = useState('');
  const [peerName, setPeerName] = useState('');
  const [activeTab, setActiveTab] = useState<'requests' | 'sessions' | 'connect'>('requests');
  const [pendingRequests, setPendingRequests] = useState<StudentRequest[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [connectCode, setConnectCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPeerData = async () => {
      try {
        const [regNo, name] = await Promise.all([
          AsyncStorage.getItem('currentPeerReg'),
          AsyncStorage.getItem('currentPeerName')
        ]);

        if (regNo) setPeerRegNo(regNo);
        if (name) setPeerName(name);

        if (regNo) {
          await loadPendingRequests(regNo);
          await loadActiveSessions(regNo);
        }
      } catch (error) {
        console.error('Error loading peer data:', error);
      }
    };

    loadPeerData();
  }, []);

  const loadPendingRequests = async (peerReg: string) => {
    try {
      const { data, error } = await supabase
        .from('peer_requests')
        .select('*')
        .eq('peer_reg', peerReg)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading pending requests:', error);
      } else {
        setPendingRequests(data || []);
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  const loadActiveSessions = async (peerReg: string) => {
    try {
      const { data, error } = await supabase
        .from('peer_sessions')
        .select('*')
        .eq('peer_reg', peerReg)
        .eq('status', 'active')
        .order('started_at', { ascending: false });

      if (error) {
        console.error('Error loading active sessions:', error);
      } else {
        setActiveSessions(data || []);
      }
    } catch (error) {
      console.error('Error loading active sessions:', error);
    }
  };

  const handleAcceptRequest = async (requestId: string, studentReg: string, studentName: string) => {
    try {
      setLoading(true);

      // Update request status
      const { error: updateError } = await supabase
        .from('peer_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) {
        throw updateError;
      }

      // Create new session
      const { error: sessionError } = await supabase
        .from('peer_sessions')
        .insert({
          peer_reg: peerRegNo,
          peer_name: peerName,
          student_reg: studentReg,
          student_name: studentName,
          status: 'active',
          started_at: new Date().toISOString(),
        });

      if (sessionError) {
        throw sessionError;
      }

      Alert.alert('Success', 'Request accepted! Session started.');

      // Refresh data
      await loadPendingRequests(peerRegNo);
      await loadActiveSessions(peerRegNo);

    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('peer_requests')
        .update({ status: 'declined' })
        .eq('id', requestId);

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Request declined.');
      await loadPendingRequests(peerRegNo);

    } catch (error) {
      console.error('Error declining request:', error);
      Alert.alert('Error', 'Failed to decline request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWithCode = async () => {
    if (!connectCode.trim()) {
      Alert.alert('Error', 'Please enter a connection code.');
      return;
    }

    try {
      setLoading(true);

      // Find student by connection code
      const { data: studentData, error: studentError } = await supabase
        .from('user_requests')
        .select('*')
        .eq('registration_number', connectCode.trim())
        .eq('user_type', 'Student')
        .single();

      if (studentError || !studentData) {
        Alert.alert('Error', 'Invalid connection code. Student not found.');
        return;
      }

      // Create new session
      const { error: sessionError } = await supabase
        .from('peer_sessions')
        .insert({
          peer_reg: peerRegNo,
          peer_name: peerName,
          student_reg: studentData.registration_number,
          student_name: studentData.user_name || studentData.name || 'Student',
          status: 'active',
          started_at: new Date().toISOString(),
        });

      if (sessionError) {
        throw sessionError;
      }

      Alert.alert('Success', `Connected with ${studentData.user_name || 'Student'}!`);
      setConnectCode('');
      await loadActiveSessions(peerRegNo);

    } catch (error) {
      console.error('Error connecting with code:', error);
      Alert.alert('Error', 'Failed to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = (sessionId: string, studentName: string) => {
    router.push(`/peer/peer-chat?sessionId=${sessionId}&studentName=${studentName}` as any);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return '#ff5252';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return Colors.textSecondary;
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'warning';
      case 'medium': return 'alert-circle';
      case 'low': return 'information-circle';
      default: return 'help-circle';
    }
  };

  const renderRequestItem = ({ item }: { item: StudentRequest }) => (
    <View style={{
      backgroundColor: Colors.backgroundLight,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: Colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: Colors.text,
            marginBottom: 4,
          }}>
            {item.student_name}
          </Text>
          <Text style={{
            fontSize: 14,
            color: Colors.textSecondary,
            marginBottom: 8,
          }}>
            {item.student_reg}
          </Text>
          <Text style={{
            fontSize: 14,
            color: Colors.text,
            marginBottom: 12,
          }}>
            {item.message}
          </Text>
        </View>

        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: getUrgencyColor(item.urgency_level) + '20',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
        }}>
          <Ionicons
            name={getUrgencyIcon(item.urgency_level) as any}
            size={16}
            color={getUrgencyColor(item.urgency_level)}
          />
          <Text style={{
            fontSize: 12,
            color: getUrgencyColor(item.urgency_level),
            fontWeight: '600',
            marginLeft: 4,
            textTransform: 'uppercase',
          }}>
            {item.urgency_level}
          </Text>
        </View>
      </View>

      <View style={{
        flexDirection: 'row',
        gap: 8,
      }}>
        <TouchableOpacity
          onPress={() => handleAcceptRequest(item.id, item.student_reg, item.student_name)}
          disabled={loading}
          style={{
            flex: 1,
            backgroundColor: Colors.primary,
            borderRadius: 8,
            paddingVertical: 12,
            alignItems: 'center',
          }}
        >
          <Text style={{
            color: Colors.background,
            fontSize: 14,
            fontWeight: '600',
          }}>
            Accept
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleDeclineRequest(item.id)}
          disabled={loading}
          style={{
            flex: 1,
            backgroundColor: Colors.backgroundLight,
            borderRadius: 8,
            paddingVertical: 12,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <Text style={{
            color: Colors.textSecondary,
            fontSize: 14,
            fontWeight: '600',
          }}>
            Decline
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSessionItem = ({ item }: { item: ActiveSession }) => (
    <View style={{
      backgroundColor: Colors.backgroundLight,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: Colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: Colors.text,
            marginBottom: 4,
          }}>
            {item.student_name}
          </Text>
          <Text style={{
            fontSize: 14,
            color: Colors.textSecondary,
            marginBottom: 4,
          }}>
            {item.student_reg}
          </Text>
          <Text style={{
            fontSize: 12,
            color: Colors.textSecondary,
          }}>
            Started: {new Date(item.started_at).toLocaleTimeString()}
          </Text>
        </View>

        <View style={{
          backgroundColor: Colors.primary + '20',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
        }}>
          <Text style={{
            fontSize: 12,
            color: Colors.primary,
            fontWeight: '600',
            textTransform: 'uppercase',
          }}>
            Active
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => handleStartChat(item.id, item.student_name)}
        style={{
          backgroundColor: Colors.primary,
          borderRadius: 8,
          paddingVertical: 12,
          alignItems: 'center',
        }}
      >
        <Text style={{
          color: Colors.background,
          fontSize: 14,
          fontWeight: '600',
        }}>
          Continue Chat
        </Text>
      </TouchableOpacity>
    </View>
  );

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
      }}>
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: Colors.text,
          textAlign: 'center',
        }}>
          Connect & Support
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={{
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
      }}>
        {[
          { key: 'requests', title: 'Requests', count: pendingRequests.length },
          { key: 'sessions', title: 'Sessions', count: activeSessions.length },
          { key: 'connect', title: 'Connect', count: null },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key as any)}
            style={{
              flex: 1,
              backgroundColor: activeTab === tab.key ? Colors.primary : Colors.backgroundLight,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              marginHorizontal: 4,
              alignItems: 'center',
            }}
          >
            <Text style={{
              color: activeTab === tab.key ? Colors.background : Colors.text,
              fontSize: 14,
              fontWeight: '600',
            }}>
              {tab.title}
              {tab.count !== null && tab.count > 0 && ` (${tab.count})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {activeTab === 'requests' && (
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: Colors.text,
              marginBottom: 15,
            }}>
              Pending Requests ({pendingRequests.length})
            </Text>

            {pendingRequests.length === 0 ? (
              <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Ionicons name="time-outline" size={48} color={Colors.textSecondary} />
                <Text style={{
                  fontSize: 16,
                  color: Colors.textSecondary,
                  textAlign: 'center',
                  marginTop: 16,
                }}>
                  No pending requests at the moment.
                </Text>
              </View>
            ) : (
              <FlatList
                data={pendingRequests}
                keyExtractor={(item) => item.id}
                renderItem={renderRequestItem}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        )}

        {activeTab === 'sessions' && (
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: Colors.text,
              marginBottom: 15,
            }}>
              Active Sessions ({activeSessions.length})
            </Text>

            {activeSessions.length === 0 ? (
              <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Ionicons name="chatbubbles-outline" size={48} color={Colors.textSecondary} />
                <Text style={{
                  fontSize: 16,
                  color: Colors.textSecondary,
                  textAlign: 'center',
                  marginTop: 16,
                }}>
                  No active sessions at the moment.
                </Text>
              </View>
            ) : (
              <FlatList
                data={activeSessions}
                keyExtractor={(item) => item.id}
                renderItem={renderSessionItem}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        )}

        {activeTab === 'connect' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: Colors.text,
              marginBottom: 15,
            }}>
              Connect with Student
            </Text>

            <View style={{
              backgroundColor: Colors.backgroundLight,
              borderRadius: 12,
              padding: 20,
              marginBottom: 20,
            }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: Colors.text,
                marginBottom: 12,
              }}>
                Enter Student Registration Number
              </Text>

              <TextInput
                value={connectCode}
                onChangeText={setConnectCode}
                placeholder="Enter registration number..."
                style={{
                  backgroundColor: Colors.background,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  color: Colors.text,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}
                placeholderTextColor={Colors.textSecondary}
              />

              <TouchableOpacity
                onPress={handleConnectWithCode}
                disabled={loading || !connectCode.trim()}
                style={{
                  backgroundColor: Colors.primary,
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: 'center',
                  opacity: loading || !connectCode.trim() ? 0.6 : 1,
                }}
              >
                <Text style={{
                  color: Colors.background,
                  fontSize: 16,
                  fontWeight: '600',
                }}>
                  {loading ? 'Connecting...' : 'Connect'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{
              backgroundColor: Colors.backgroundLight,
              borderRadius: 12,
              padding: 20,
            }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: Colors.text,
                marginBottom: 12,
              }}>
                How it works:
              </Text>

              <Text style={{
                fontSize: 14,
                color: Colors.textSecondary,
                lineHeight: 20,
              }}>
                1. Students can send you connection requests{'\n'}
                2. You can accept or decline requests{'\n'}
                3. Use registration numbers to connect directly{'\n'}
                4. Manage all active sessions from one place
              </Text>
            </View>
          </ScrollView>
        )}
      </View>
    </LinearGradient>
  );
}
