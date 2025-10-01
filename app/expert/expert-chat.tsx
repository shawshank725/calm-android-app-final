import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { supabase } from '../../lib/supabase';

interface ChatMessage {
    id: string;
    sender_id: string;
    receiver_id: string;
    sender_name: string;
    sender_type: 'EXPERT' | 'STUDENT' | 'PEER' | 'ADMIN';
    message: string;
    created_at: string;
    is_read?: boolean;
}

export default function ExpertChatPage() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        studentId?: string;
        studentName?: string;
        studentReg?: string;
        studentEmail?: string;
        studentCourse?: string;
        expertReg?: string;
        expertName?: string;
    }>();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        loadMessages();

        // Set up periodic refresh to ensure messages are always up to date
        const refreshInterval = setInterval(() => {
            loadMessages();
        }, 30000); // Refresh every 30 seconds

        return () => clearInterval(refreshInterval);
    }, []);

    // Set up real-time subscription for chat messages
    useEffect(() => {
        if (!params.expertReg || !params.studentReg) return;

        const channel = supabase
            .channel(`expert_chat_${params.expertReg}_${params.studentReg}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `or(and(sender_id.eq.${params.expertReg},receiver_id.eq.${params.studentReg}),and(sender_id.eq.${params.studentReg},receiver_id.eq.${params.expertReg}))`,
                },
                (payload) => {
                    console.log('New message received:', payload);
                    const newMessage = payload.new as ChatMessage;

                    // Prevent duplicate messages
                    setMessages(prev => {
                        const exists = prev.some(msg => msg.id === newMessage.id);
                        if (exists) return prev;
                        return [...prev, newMessage];
                    });

                    // Auto-scroll to bottom when new message arrives
                    setTimeout(() => {
                        flatListRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [params.expertReg, params.studentReg]);

    const getConversationKey = () => {
        return `conversation_${params.expertReg}_${params.studentReg}`;
    };

    const loadMessages = async () => {
        setLoading(true);
        try {
            const expertReg = params.expertReg;
            const studentReg = params.studentReg;

            if (!expertReg || !studentReg) {
                console.error('Missing expert or student registration');
                setMessages([]);
                return;
            }

            // Fetch messages between expert and student from Supabase
            const { data: messages, error } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${expertReg},receiver_id.eq.${studentReg}),and(sender_id.eq.${studentReg},receiver_id.eq.${expertReg})`)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error loading messages:', error);
                setMessages([]);
                return;
            }

            if (messages) {
                setMessages(prev => {
                    // Only update if messages have changed
                    if (JSON.stringify(prev) !== JSON.stringify(messages)) {
                        // Auto-scroll to bottom after loading new messages
                        setTimeout(() => {
                            flatListRef.current?.scrollToEnd({ animated: false });
                        }, 100);
                        return messages;
                    }
                    return prev;
                });
            } else {
                setMessages([]);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (newMessage.trim() === '') {
            Alert.alert('Error', 'Please enter a message');
            return;
        }

        if (!params.expertReg || !params.studentReg) {
            Alert.alert('Error', 'Missing expert or student information');
            console.error('Missing params:', params);
            return;
        }

        if (!params.expertName) {
            Alert.alert('Error', 'Missing expert name');
            console.error('Missing expert name in params:', params);
            return;
        }

        const messageData = {
            sender_id: params.expertReg,
            receiver_id: params.studentReg,
            sender_name: params.expertName || 'Expert',
            sender_type: 'EXPERT' as const,
            message: newMessage.trim(),
            created_at: new Date(),
        };

        console.log('Sending message with data:', messageData);
        console.log('Params received:', params);

        try {
            // First, let's test if we can read from the messages table
            const { data: testData, error: testError } = await supabase
                .from('messages')
                .select('*')
                .limit(1);

            if (testError) {
                console.error('Cannot access messages table:', testError);
                Alert.alert('Error', `Database access error: ${testError.message || JSON.stringify(testError)}`);
                return;
            }

            // Try to save to Supabase with better error handling
            const { data, error } = await supabase
                .from('messages')
                .insert([messageData])
                .select()
                .single();

            console.log('Supabase response:', { data, error });

            if (error) {
                console.error('Error sending message:', error);

                // If it's an RLS error, provide more helpful message
                if (error.code === '42501') {
                    Alert.alert(
                        'Database Security Error',
                        'Row Level Security is blocking this operation. Please check the RLS_FIX_INSTRUCTIONS.md file for how to fix this.',
                        [
                            { text: 'OK' }
                        ]
                    );
                } else {
                    Alert.alert('Error', `Failed to send message: ${error.message || error.details || JSON.stringify(error)}`);
                }
                return;
            }

            // Add to local state for immediate UI update
            if (data) {
                setMessages(prev => [...prev, data]);
                // Auto-scroll to bottom when expert sends message
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
            }

            setNewMessage('');
        } catch (error: any) {
            console.error('Error sending message:', error);
            const errorMessage = error?.message || error?.details || error?.error_description || 'Unknown error occurred';
            Alert.alert('Error', `Failed to send message: ${errorMessage}`);
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const messageDate = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            const diffInMinutes = Math.floor(diffInHours * 60);
            return `${diffInMinutes}m ago`;
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else {
            return messageDate.toLocaleDateString();
        }
    };

    const renderMessageItem = ({ item }: { item: ChatMessage }) => (
        <View style={[
            styles.messageItem,
            item.sender_type === 'EXPERT' ? styles.expertMessage : styles.studentMessage
        ]}>
            <View style={styles.messageHeader}>
                <Text style={styles.senderName}>
                    {item.sender_type === 'EXPERT' ? '👨‍⚕️' : '👨‍🎓'} {item.sender_name}
                </Text>
                <Text style={styles.timestamp}>{formatTimestamp(item.created_at)}</Text>
            </View>
            <Text style={styles.messageText}>{item.message}</Text>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>💬 Chat</Text>
                <Text style={styles.headerSubtitle}>
                    {params.studentName} ({params.studentReg})
                </Text>
            </View>

            {/* Student Info Card */}
            <View style={styles.studentInfoCard}>
                <Text style={styles.studentInfoTitle}>Student Information</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Name:</Text>
                    <Text style={styles.infoValue}>{params.studentName}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Registration:</Text>
                    <Text style={styles.infoValue}>{params.studentReg}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Course:</Text>
                    <Text style={styles.infoValue}>{params.studentCourse || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email:</Text>
                    <Text style={styles.infoValue}>{params.studentEmail || 'N/A'}</Text>
                </View>
            </View>

            {/* Messages Area */}
            <View style={styles.messagesArea}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Loading messages...</Text>
                    </View>
                ) : messages.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>💬</Text>
                        <Text style={styles.emptyTitle}>Start Conversation</Text>
                        <Text style={styles.emptyText}>
                            No messages yet with {params.studentName}.
                            Send the first message to start the conversation!
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessageItem}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        style={styles.messagesList}
                        contentContainerStyle={styles.messagesContainer}
                    />
                )}
            </View>

            {/* Message Input */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.messageInput}
                    placeholder="Type your message..."
                    placeholderTextColor="#999"
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                    maxLength={500}
                />
                <TouchableOpacity
                    style={styles.sendButton}
                    onPress={sendMessage}
                >
                    <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
            </View>

            {/* Message Count */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    {messages.length} message{messages.length !== 1 ? 's' : ''} • Chat with {params.studentName}
                </Text>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        backgroundColor: '#7b1fa2',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    backButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 25,
        alignSelf: 'flex-start',
        marginBottom: 15,
    },
    backButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerTitle: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5,
    },
    headerSubtitle: {
        color: '#e1bee7',
        fontSize: 16,
        textAlign: 'center',
    },
    studentInfoCard: {
        backgroundColor: '#ffffff',
        margin: 20,
        padding: 15,
        borderRadius: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    studentInfoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#7b1fa2',
        marginBottom: 10,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
        flex: 1,
    },
    infoValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: 'bold',
        flex: 2,
        textAlign: 'right',
    },
    messagesArea: {
        flex: 1,
        backgroundColor: '#ffffff',
        marginHorizontal: 20,
        marginBottom: 10,
        borderRadius: 15,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        fontStyle: 'italic',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    },
    messagesList: {
        flex: 1,
    },
    messagesContainer: {
        padding: 20,
    },
    messageItem: {
        marginVertical: 8,
        padding: 15,
        borderRadius: 15,
        maxWidth: '80%',
    },
    expertMessage: {
        backgroundColor: '#e3f2fd',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 5,
    },
    studentMessage: {
        backgroundColor: '#f1f8e9',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 5,
    },
    messageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    senderName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    timestamp: {
        fontSize: 12,
        color: '#999',
    },
    messageText: {
        fontSize: 16,
        color: '#333',
        lineHeight: 22,
    },
    inputContainer: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        alignItems: 'flex-end',
    },
    messageInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontSize: 16,
        maxHeight: 100,
        backgroundColor: '#f8f9fa',
    },
    sendButton: {
        backgroundColor: '#7b1fa2',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        marginLeft: 10,
    },
    sendButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        backgroundColor: '#f8f9fa',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    footerText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
});
