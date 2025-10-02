import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function PeerResources() {
  const router = useRouter();

  const resources = [
    {
      category: 'Crisis Intervention',
      items: [
        { title: 'Suicide Prevention Guidelines', icon: 'shield-checkmark-outline' },
        { title: 'Emergency Contact Protocols', icon: 'call-outline' },
        { title: 'De-escalation Techniques', icon: 'volume-low-outline' },
      ]
    },
    {
      category: 'Active Listening',
      items: [
        { title: 'Effective Listening Skills', icon: 'ear-outline' },
        { title: 'Empathy Building', icon: 'heart-outline' },
        { title: 'Non-judgmental Communication', icon: 'chatbubbles-outline' },
      ]
    },
    {
      category: 'Mental Health Basics',
      items: [
        { title: 'Understanding Anxiety', icon: 'pulse-outline' },
        { title: 'Depression Support', icon: 'sunny-outline' },
        { title: 'Stress Management', icon: 'leaf-outline' },
      ]
    },
    {
      category: 'Self-Care',
      items: [
        { title: 'Preventing Burnout', icon: 'battery-charging-outline' },
        { title: 'Setting Boundaries', icon: 'construct-outline' },
        { title: 'Peer Support Networks', icon: 'people-outline' },
      ]
    },
  ];

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
          Resources
        </Text>

        <TouchableOpacity
          style={{
            padding: 8,
            borderRadius: 20,
            backgroundColor: Colors.backgroundLight,
          }}
        >
          <Ionicons name="bookmark-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Emergency Contacts */}
        <View style={{ paddingHorizontal: 20, marginBottom: 30 }}>
          <View style={{
            backgroundColor: '#ffebee',
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            borderLeftWidth: 4,
            borderLeftColor: '#d32f2f',
          }}>
            <Text style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: '#d32f2f',
              marginBottom: 8,
            }}>
              Emergency Contacts
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#5d4037',
              marginBottom: 8,
            }}>
              • Crisis Hotline: 988
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#5d4037',
              marginBottom: 8,
            }}>
              • Campus Security: [Your Campus Number]
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#5d4037',
            }}>
              • Supervisor: [Supervisor Contact]
            </Text>
          </View>
        </View>

        {/* Resource Categories */}
        {resources.map((category, categoryIndex) => (
          <View key={categoryIndex} style={{ paddingHorizontal: 20, marginBottom: 30 }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: Colors.text,
              marginBottom: 15,
            }}>
              {category.category}
            </Text>

            {category.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
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
                  <Ionicons name={item.icon as any} size={24} color={Colors.primary} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: Colors.text,
                  }}>
                    {item.title}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Additional Resources */}
        <View style={{ paddingHorizontal: 20, marginBottom: 50 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: Colors.text,
            marginBottom: 15,
          }}>
            Additional Resources
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
              backgroundColor: Colors.secondary + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 15,
            }}>
              <Ionicons name="library-outline" size={24} color={Colors.secondary} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: Colors.text,
                marginBottom: 2,
              }}>
                Training Materials
              </Text>
              <Text style={{
                fontSize: 14,
                color: Colors.textSecondary,
              }}>
                Access training videos and guides
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
              backgroundColor: Colors.accent + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 15,
            }}>
              <Ionicons name="help-circle-outline" size={24} color={Colors.accent} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: Colors.text,
                marginBottom: 2,
              }}>
                FAQ & Support
              </Text>
              <Text style={{
                fontSize: 14,
                color: Colors.textSecondary,
              }}>
                Common questions and answers
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
