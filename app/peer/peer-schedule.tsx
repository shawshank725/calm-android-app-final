import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function PeerSchedule() {
  const router = useRouter();

  const [availabilitySlots, setAvailabilitySlots] = useState([
    { day: 'Monday', time: '9:00 AM - 5:00 PM', available: true },
    { day: 'Tuesday', time: '9:00 AM - 5:00 PM', available: true },
    { day: 'Wednesday', time: '9:00 AM - 5:00 PM', available: true },
    { day: 'Thursday', time: '9:00 AM - 5:00 PM', available: true },
    { day: 'Friday', time: '9:00 AM - 5:00 PM', available: true },
    { day: 'Saturday', time: '10:00 AM - 2:00 PM', available: false },
    { day: 'Sunday', time: 'Off', available: false },
  ]);



  const toggleAvailability = (index: number) => {
    const updatedSlots = [...availabilitySlots];
    updatedSlots[index].available = !updatedSlots[index].available;
    setAvailabilitySlots(updatedSlots);
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
          My Schedule
        </Text>

        <TouchableOpacity
          style={{
            padding: 8,
            borderRadius: 20,
            backgroundColor: Colors.backgroundLight,
          }}
        >
          <Ionicons name="calendar" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Availability Settings */}
        <View style={{ paddingHorizontal: 20, marginBottom: 30 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: Colors.text,
            marginBottom: 15,
          }}>
            Weekly Availability
          </Text>

          {availabilitySlots.map((slot, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => toggleAvailability(index)}
              style={{
                backgroundColor: Colors.backgroundLight,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                shadowColor: Colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: Colors.text,
                  marginBottom: 4,
                }}>
                  {slot.day}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: Colors.textSecondary,
                }}>
                  {slot.time}
                </Text>
              </View>

              <View style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: slot.available ? Colors.primary : Colors.textSecondary,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Ionicons
                  name={slot.available ? "checkmark" : "close"}
                  size={16}
                  color={Colors.background}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: 20, marginBottom: 30 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: Colors.text,
            marginBottom: 15,
          }}>
            Quick Actions
          </Text>

          <TouchableOpacity
            style={{
              backgroundColor: Colors.backgroundLight,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
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
              backgroundColor: Colors.primary + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 15,
            }}>
              <Ionicons name="time-outline" size={24} color={Colors.primary} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: Colors.text,
                marginBottom: 2,
              }}>
                Set Break Time
              </Text>
              <Text style={{
                fontSize: 14,
                color: Colors.textSecondary,
              }}>
                Take a break from sessions
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: Colors.backgroundLight,
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
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
              backgroundColor: Colors.secondary + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 15,
            }}>
              <Ionicons name="notifications-outline" size={24} color={Colors.secondary} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: Colors.text,
                marginBottom: 2,
              }}>
                Notification Settings
              </Text>
              <Text style={{
                fontSize: 14,
                color: Colors.textSecondary,
              }}>
                Manage session alerts
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
