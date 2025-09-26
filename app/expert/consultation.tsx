import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { supabase } from '../../lib/supabase';

interface Student {
    id: string;
    user_name: string;
    registration_number: string;
    email: string;
    course: string;
}

export default function ConsultationPage() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        studentName?: string;
        studentReg?: string;
        studentEmail?: string;
        expertReg?: string;
    }>();

    const [searchText, setSearchText] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [expertInfo, setExpertInfo] = useState({
        name: '',
        registration: ''
    });

    // Load expert info and students on component mount
    useEffect(() => {
        loadExpertInfo();
        loadStudents();
    }, []);

    // Filter students based on search text
    useEffect(() => {
        if (searchText.trim() === '') {
            setFilteredStudents(students);
        } else {
            const filtered = students.filter(student =>
                student.registration_number.toLowerCase().includes(searchText.toLowerCase()) ||
                student.user_name.toLowerCase().includes(searchText.toLowerCase()) ||
                student.email.toLowerCase().includes(searchText.toLowerCase())
            );
            setFilteredStudents(filtered);
        }
    }, [searchText, students]);

    const loadExpertInfo = async () => {
        try {
            let regNo = params.expertReg;
            if (!regNo) {
                const storedReg = await AsyncStorage.getItem('currentExpertReg');
                if (storedReg) regNo = storedReg;
            }

            if (regNo) {
                const storedName = await AsyncStorage.getItem('currentExpertName');
                setExpertInfo({
                    name: storedName || 'Expert',
                    registration: regNo
                });
            }
        } catch (error) {
            console.error('Error loading expert info:', error);
        }
    };

    const loadStudents = async () => {
        try {
            // Load students from Supabase
            const { data: studentsData, error } = await supabase
                .from('students')
                .select('*')
                .order('user_name');

            if (error) {
                console.error('Error loading students:', error);
                setStudents([]);
            } else if (studentsData) {
                setStudents(studentsData);
                setFilteredStudents(studentsData);
            }
        } catch (error) {
            console.error('Error loading students:', error);
            setStudents([]);
        }
    };

    const handleSearch = () => {
        if (searchText.trim() === '') {
            Alert.alert('Search', 'Please enter a roll number or name to search');
            return;
        }

        const resultCount = filteredStudents.length;
        Alert.alert(
            'Search Results',
            `Found ${resultCount} student${resultCount !== 1 ? 's' : ''} matching "${searchText}"`
        );
    };

    const selectStudent = (student: Student) => {
        // Navigate to dedicated chat page with student information
        router.push({
            pathname: './expert-chat',
            params: {
                studentId: student.id,
                studentName: student.user_name,
                studentReg: student.registration_number,
                studentEmail: student.email,
                studentCourse: student.course,
                expertReg: expertInfo.registration,
                expertName: expertInfo.name
            }
        });
    };

    const renderStudentItem = ({ item }: { item: Student }) => (
        <TouchableOpacity
            style={styles.studentItem}
            onPress={() => selectStudent(item)}
        >
            <View style={styles.studentInfo}>
                <Text style={styles.studentName}>👨‍🎓 {item.user_name}</Text>
                <Text style={styles.studentDetails}>
                    Roll No: {item.registration_number}
                </Text>
                <Text style={styles.studentDetails}>
                    Course: {item.course || 'N/A'}
                </Text>
                <Text style={styles.studentDetails}>
                    Email: {item.email || 'N/A'}
                </Text>
            </View>
            <Text style={styles.selectButton}>💬 Chat</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>🔍 Find Students</Text>
                <Text style={styles.headerSubtitle}>
                    Search by roll number or name
                </Text>
            </View>

            {/* Search Section */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by roll number or name..."
                        placeholderTextColor="#999"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    <TouchableOpacity
                        style={styles.searchButton}
                        onPress={handleSearch}
                    >
                        <Text style={styles.searchButtonText}>Search</Text>
                    </TouchableOpacity>
                </View>
                {searchText.length > 0 && (
                    <TouchableOpacity
                        onPress={() => setSearchText('')}
                        style={styles.clearSearchButton}
                    >
                        <Text style={styles.clearSearchText}>Clear Search</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Students List */}
            <View style={styles.messagesArea}>
                {filteredStudents.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        {searchText.length > 0 ? (
                            <>
                                <Text style={styles.emptyIcon}>🔍</Text>
                                <Text style={styles.emptyTitle}>No Students Found</Text>
                                <Text style={styles.emptyText}>
                                    No students found matching "{searchText}"
                                </Text>
                            </>
                        ) : (
                            <>
                                <Text style={styles.emptyIcon}>👨‍🎓</Text>
                                <Text style={styles.emptyTitle}>Find Students</Text>
                                <Text style={styles.emptyText}>
                                    Search for students by their roll number or name to start a conversation.
                                </Text>
                            </>
                        )}
                    </View>
                ) : (
                    <FlatList
                        data={filteredStudents}
                        renderItem={renderStudentItem}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        style={styles.messagesList}
                    />
                )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    {searchText ? `${filteredStudents.length} students found` : `${students.length} total students`}
                </Text>
            </View>
        </View>
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
    searchContainer: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    searchIcon: {
        fontSize: 18,
        marginRight: 10,
        color: '#666',
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    searchButton: {
        backgroundColor: '#7b1fa2',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        marginLeft: 10,
    },
    searchButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    clearSearchButton: {
        alignSelf: 'center',
        marginTop: 10,
        padding: 5,
    },
    clearSearchText: {
        color: '#7b1fa2',
        fontSize: 14,
        fontWeight: 'bold',
    },
    messagesArea: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    messagesList: {
        flex: 1,
        paddingHorizontal: 20,
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
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
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
    studentItem: {
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingHorizontal: 20,
        paddingVertical: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    studentDetails: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    selectButton: {
        backgroundColor: '#7b1fa2',
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        textAlign: 'center',
        overflow: 'hidden',
    },
});
