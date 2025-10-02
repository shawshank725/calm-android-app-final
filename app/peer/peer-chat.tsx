import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';

interface ChatMessage {
  id: string;
  sender_reg: string;
  sender_name: string;
  sender_type: 'peer' | 'student';
  message: string;
  created_at: string;
}

export default function PeerChat() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [peerRegNo, setPeerRegNo] = useState('');
  const [peerName, setPeerName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [studentName, setStudentName] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        const [regNo, name] = await Promise.all([
          AsyncStorage.getItem('currentPeerReg'),
          AsyncStorage.getItem('currentPeerName')
        ]);

        if (regNo) setPeerRegNo(regNo);
        if (name) setPeerName(name);

        const sessionIdParam = params.sessionId as string;
        const studentNameParam = params.studentName as string;

        if (sessionIdParam) setSessionId(sessionIdParam);
        if (studentNameParam) setStudentName(studentNameParam);

        if (sessionIdParam) {
          await loadChatMessages(sessionIdParam);
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
      }
    };

    initializeChat();
  }, [params]);

  const loadChatMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading chat messages:', error);
      } else {
        setMessages(data || []);
        // Scroll to bottom when messages load
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !sessionId || !peerRegNo) return;

    try {
      const newMessage = {
        session_id: sessionId,
        sender_reg: peerRegNo,
        sender_name: peerName,
        sender_type: 'peer',
        message: inputText.trim(),
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('chat_messages')
        .insert(newMessage);

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      // Add message to local state immediately
      setMessages(prev => [...prev, { ...newMessage, id: Date.now().toString() } as ChatMessage]);
      setInputText('');

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Refresh messages from server
      await loadChatMessages(sessionId);

    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMyMessage = item.sender_type === 'peer';

    return (
      <View style={{
        alignSelf: isMyMessage ? 'flex-end' : 'flex-start',
        backgroundColor: isMyMessage ? Colors.primary : Colors.backgroundLight,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        borderBottomRightRadius: isMyMessage ? 4 : 16,
        borderBottomLeftRadius: isMyMessage ? 16 : 4,
        marginBottom: 12,
        maxWidth: '80%',
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
      }}>
        <Text style={{
          fontSize: 16,
          color: isMyMessage ? Colors.background : Colors.text,
          lineHeight: 20,
        }}>
          {item.message}
        </Text>
        <Text style={{
          fontSize: 12,
          color: isMyMessage ? Colors.background + '80' : Colors.textSecondary,
          marginTop: 4,
          textAlign: 'right',
        }}>
          {new Date(item.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={[Colors.primary + '10', Colors.background]}
      style={{ flex: 1 }}
    >
      {/* Header */}
      <View style={{
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
        paddingBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.backgroundLight,
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            padding: 8,
            borderRadius: 20,
            backgroundColor: Colors.background,
          }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: Colors.text,
          }}>
            {studentName || 'Student'}
          </Text>
          <Text style={{
            fontSize: 14,
            color: Colors.textSecondary,
          }}>
            Peer Support Session
          </Text>
        </View>

        <TouchableOpacity
          style={{
            padding: 8,
            borderRadius: 20,
            backgroundColor: Colors.background,
          }}
        >
          <Ionicons name="ellipsis-vertical" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20 }}>
        {messages.length === 0 ? (
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
              Start the conversation with {studentName || 'the student'}.{'\n'}
              Your support can make a difference!
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
          />
        )}
      </View>

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{
          paddingHorizontal: 20,
          paddingVertical: 15,
          backgroundColor: Colors.backgroundLight,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
        }}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 12,
        }}>
          <View style={{
            flex: 1,
            backgroundColor: Colors.background,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: Colors.border,
            minHeight: 40,
            maxHeight: 100,
            justifyContent: 'center',
          }}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                fontSize: 16,
                color: Colors.text,
                lineHeight: 20,
              }}
            />
          </View>

          <TouchableOpacity
            onPress={sendMessage}
            disabled={!inputText.trim()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: inputText.trim() ? Colors.primary : Colors.textSecondary,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="send" size={20} color={Colors.background} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
