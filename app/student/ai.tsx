import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import {
  AIChatMessage,
  clearChatHistoryFromSupabase,
  saveConversationPair,
  syncChatHistory
} from '../../lib/aiChatStorage';

// Using AIChatMessage from aiChatStorage.ts for consistency
type Message = AIChatMessage;

interface CustomPrompt {
  id: string;
  question: string;
  answer: string;
}

const AI = () => {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your CALM companion AI. I'm here to help you with mental wellness, stress management, and emotional support. How are you feeling today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customPrompts, setCustomPrompts] = useState<CustomPrompt[]>([]);
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadCustomPrompts();
    loadAndSyncChatHistory();
    checkServerStatus();
  }, []);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const checkServerStatus = async () => {
    try {
      const response = await fetch('http://localhost:8000/health', {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      setIsServerOnline(response.ok);
    } catch (error) {
      setIsServerOnline(false);
    }
  };

  const loadCustomPrompts = async () => {
    try {
      const stored = await AsyncStorage.getItem('customPrompts');
      if (stored) {
        setCustomPrompts(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading custom prompts:', error);
    }
  };

  const loadAndSyncChatHistory = async () => {
    try {
      setIsSyncing(true);

      // First load local chat history
      const localHistory = await loadLocalChatHistory();

      // Try to sync with Supabase
      const syncedMessages = await syncChatHistory(localHistory);

      if (syncedMessages.length > 0) {
        setMessages(syncedMessages);
        await saveChatHistoryLocally(syncedMessages);
      } else {
        // If no synced messages, use local history
        setMessages(localHistory);
      }

      console.log(`Loaded ${syncedMessages.length || localHistory.length} messages`);
    } catch (error) {
      console.error('Error loading and syncing chat history:', error);
      // Fallback to local history only
      const localHistory = await loadLocalChatHistory();
      setMessages(localHistory);
    } finally {
      setIsSyncing(false);
    }
  };

  const loadLocalChatHistory = async (): Promise<Message[]> => {
    try {
      const stored = await AsyncStorage.getItem('chatHistory');
      if (stored) {
        const history = JSON.parse(stored);
        return history.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading local chat history:', error);
    }
    return [];
  };

  const saveChatHistoryLocally = async (messagesToSave: Message[]) => {
    try {
      await AsyncStorage.setItem('chatHistory', JSON.stringify(messagesToSave));
    } catch (error) {
      console.error('Error saving chat history locally:', error);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    const messageText = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      let aiResponse = '';
      let category = '';
      let wellness_tip = '';

      if (isServerOnline) {
        // Use our AI server
        const response = await fetch('http://localhost:8000/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: messageText,
            user_id: 'student'
          }),
        });

        if (response.ok) {
          const data = await response.json();
          aiResponse = data.response;
          category = data.category;
          wellness_tip = data.wellness_tip;
        } else {
          throw new Error('Server error');
        }
      } else {
        // Fallback to local custom prompts
        const matchingPrompt = customPrompts.find(prompt =>
          messageText.toLowerCase().includes(prompt.question.toLowerCase()) ||
          prompt.question.toLowerCase().includes(messageText.toLowerCase())
        );

        if (matchingPrompt) {
          aiResponse = matchingPrompt.answer;
        } else {
          // Default responses for common mental health topics
          const lowerMessage = messageText.toLowerCase();
          if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety') || lowerMessage.includes('worried')) {
            aiResponse = "I understand you're feeling anxious. Try the 4-7-8 breathing technique: breathe in for 4, hold for 7, exhale for 8. Remember, this feeling is temporary.";
            category = 'anxiety';
          } else if (lowerMessage.includes('stressed') || lowerMessage.includes('stress') || lowerMessage.includes('overwhelmed')) {
            aiResponse = "Stress can be really challenging. Have you tried breaking down what's stressing you into smaller, manageable parts? Sometimes a short walk or deep breathing can help.";
            category = 'stress';
          } else if (lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('down')) {
            aiResponse = "I'm sorry you're feeling sad. Your emotions are valid, and it's okay to sit with these feelings for a moment. Would you like to talk about what's making you feel this way?";
            category = 'sad';
          } else if (lowerMessage.includes('sleep') || lowerMessage.includes('tired') || lowerMessage.includes('insomnia')) {
            aiResponse = "Good sleep is so important for mental health. Have you tried a bedtime routine with no screens 30 minutes before sleep? Creating a calm environment helps - cool, dark, and quiet.";
            category = 'sleep';
          } else {
            aiResponse = "I'm here to listen and support you. What's on your mind today? Feel free to share what you're feeling - whether it's stress, anxiety, sadness, or anything else.";
            category = 'general';
          }
        }
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
        category,
        wellness_tip
      };

      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);

      // Save locally first for immediate access
      await saveChatHistoryLocally(finalMessages);

      // Save conversation pair to Supabase for cross-device sync
      try {
        const success = await saveConversationPair(userMessage, aiMessage);
        if (success) {
          console.log('Successfully synced conversation to Supabase');
        } else {
          console.log('Failed to sync to Supabase, but saved locally');
        }
      } catch (error) {
        console.error('Error syncing to Supabase:', error);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: "I'm sorry, I'm having trouble responding right now. Please try again later or contact support if this continues.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    Alert.alert(
      'Clear Chat History',
      'This will delete all your chat history from this device and cloud storage. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSyncing(true);

              // Clear from Supabase
              const supabaseCleared = await clearChatHistoryFromSupabase();

              // Clear locally
              await AsyncStorage.removeItem('chatHistory');

              // Reset to initial message
              const initialMessage: Message = {
                id: '1',
                text: "Hello! I'm your CALM companion AI. I'm here to help you with mental wellness, stress management, and emotional support. How are you feeling today?",
                isUser: false,
                timestamp: new Date()
              };

              setMessages([initialMessage]);

              if (supabaseCleared) {
                Alert.alert('Success', 'Chat history cleared from all devices');
              } else {
                Alert.alert('Partially Cleared', 'Local history cleared, but there was an issue clearing cloud storage');
              }
            } catch (error) {
              console.error('Error clearing chat:', error);
              Alert.alert('Error', 'Failed to clear chat history completely');
            } finally {
              setIsSyncing(false);
            }
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Companion</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={loadAndSyncChatHistory} style={styles.syncButton} disabled={isSyncing}>
            <Text style={styles.syncButtonText}>{isSyncing ? '🔄' : '↻'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Server Status */}
      <View style={[styles.statusBar, { backgroundColor: isServerOnline ? '#e8f5e8' : '#ffebee' }]}>
        <Text style={[styles.statusText, { color: isServerOnline ? '#2d5a2d' : '#c62828' }]}>
          {isServerOnline ? '✅ AI Server Online - Enhanced responses available' : '⚠️ Offline Mode - Basic responses only'}
        </Text>
        {isSyncing && (
          <Text style={[styles.statusText, { color: '#6c5ce7', fontSize: 10, marginTop: 2 }]}>
            🔄 Syncing with cloud storage...
          </Text>
        )}
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message) => (
          <View key={message.id} style={styles.messageContainer}>
            <View style={[
              styles.messageBubble,
              message.isUser ? styles.userMessage : styles.aiMessage
            ]}>
              <Text style={[
                styles.messageText,
                message.isUser ? styles.userMessageText : styles.aiMessageText
              ]}>
                {message.text}
              </Text>

              {/* Show wellness tip if available */}
              {!message.isUser && message.wellness_tip && (
                <View style={styles.wellnessTip}>
                  <Text style={styles.wellnessTipText}>{message.wellness_tip}</Text>
                </View>
              )}

              <Text style={[
                styles.timestamp,
                message.isUser ? styles.userTimestamp : styles.aiTimestamp
              ]}>
                {message.timestamp.toLocaleTimeString()}
              </Text>
            </View>
          </View>
        ))}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#666" />
            <Text style={styles.loadingText}>AI is thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message here..."
          multiline
          maxLength={500}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[styles.sendButton, { opacity: isLoading ? 0.6 : 1 }]}
          onPress={handleSend}
          disabled={isLoading || !inputText.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#2d3436',
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 36,
    alignItems: 'center',
  },
  syncButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBar: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    elevation: 1,
  },
  userMessage: {
    backgroundColor: '#2d3436',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    backgroundColor: 'white',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  aiMessageText: {
    color: '#333',
  },
  wellnessTip: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#e8f4fd',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6c5ce7',
  },
  wellnessTipText: {
    fontSize: 12,
    color: '#333',
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  aiTimestamp: {
    color: '#999',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#f8f9fa',
  },
  sendButton: {
    backgroundColor: '#2d3436',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AI;
