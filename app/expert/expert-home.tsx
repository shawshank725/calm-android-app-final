import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { uploadFile } from '../../api/Library';
import { supabase } from '../../lib/supabase';

export default function ExpertHome() {
  const router = useRouter();
  const params = useLocalSearchParams<{ registration?: string }>();
  const [expertName, setExpertName] = useState('');
  const [expertRegNo, setExpertRegNo] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'patients' | 'connect' | 'profile' | 'settings'>('home');
  const [patients, setPatients] = useState<any[]>([]);
  const [bookedSessions, setBookedSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'Academic Resources',
  });

  const categories = [
    'Academic Resources',
    'Study Guides',
    'Mental Health',
    'Career Support',
    'Life Skills'
  ];

  useEffect(() => {
    const loadExpertData = async () => {
      try {
        let regNo = params.registration;
        if (!regNo) {
          const storedReg = await AsyncStorage.getItem('currentExpertReg');
          if (storedReg) regNo = storedReg;
        }

        if (regNo) {
          setExpertRegNo(regNo);
          const storedName = await AsyncStorage.getItem('currentExpertName');
          if (storedName) {
            setExpertName(storedName);
          }
        }
      } catch (error) {
        console.error('Error loading expert data:', error);
      }
    };

    loadExpertData();
  }, [params.registration]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      // Get all students for expert to view
      const { data: studentsData, error } = await supabase
        .from('students')
        .select('*')
        .order('user_name');

      if (error) {
        console.error('Error loading patients:', error);
      } else if (studentsData) {
        setPatients(studentsData);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBookedSessions = async () => {
    setLoading(true);
    try {
      // Get booked sessions from AsyncStorage (in real app, this would be from database)
      const sessionData = await AsyncStorage.getItem('psychologistSessions');
      if (sessionData) {
        const sessions = JSON.parse(sessionData);

        // Filter sessions for current expert based on name
        const expertSessions = sessions.filter((session: any) =>
          session.psychologistName === expertName ||
          session.psychologistId === expertName.toLowerCase().replace(' ', '')
        );

        setBookedSessions(expertSessions);
      } else {
        // No mock data - load real sessions from database
        console.log('No sessions found for expert:', expertName);
        setBookedSessions([]);
      }
    } catch (error) {
      console.error('Error loading booked sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'patients') {
      loadPatients();
    }
  }, [activeTab, expertName]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('currentExpertReg');
      await AsyncStorage.removeItem('currentExpertName');
      router.replace('../select');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleFileSelection = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain',
          'image/jpeg',
          'image/png'
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        // Check file size (max 10MB)
        if (file.size && file.size > 10 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Please select a file smaller than 10MB.');
          return;
        }

        setSelectedFile(file);

        // Auto-populate title if empty
        if (!uploadForm.title.trim() && file.name) {
          const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
          setUploadForm(prev => ({ ...prev, title: fileName }));
        }
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to select file. Please try again.');
    }
  };

  const handleFileUpload = async () => {
    if (!uploadForm.title.trim()) {
      Alert.alert('Error', 'Please enter a title for the resource');
      return;
    }

    if (!uploadForm.description.trim()) {
      Alert.alert('Error', 'Please enter a description for the resource');
      return;
    }

    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file to upload');
      return;
    }

    try {
      setUploadLoading(true);

      // Create resource data for database
      const resourceData = {
        title: uploadForm.title,
        description: uploadForm.description,
        file_url: selectedFile.uri, // In production, this would be the cloud storage URL after upload
        file_name: selectedFile.name,
        file_type: selectedFile.mimeType || 'application/octet-stream',
        file_size: selectedFile.size || 0,
        uploaded_by: expertRegNo,
        uploaded_by_name: expertName,
        uploaded_by_type: 'expert',
        category: uploadForm.category,
        tags: [uploadForm.category.toLowerCase()],
        download_count: 0,
        created_at: new Date().toISOString(),
      };

      // Insert into learning_resources table
      const { data, error } = await supabase
        .from('learning_resources')
        .insert([resourceData])
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        // If table doesn't exist, show helpful message
        if (error.code === '42P01') {
          Alert.alert(
            'Database Setup Required',
            'The learning_resources table needs to be created in Supabase. Please contact your administrator to set up the database schema.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Upload Failed', 'Failed to save resource to database. Please try again.');
        }
        return;
      }

      Alert.alert(
        'Upload Successful!',
        `${uploadForm.title} (${selectedFile.name}) has been uploaded successfully and is now available to students in the Learning Support section. Students will see this resource immediately.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowUploadModal(false);
              setSelectedFile(null);
              setUploadForm({ title: '', description: '', category: 'Academic Resources' });
            }
          }
        ]
      );

    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', 'There was an error uploading the file. Please try again.');
    } finally {
      setUploadLoading(false);
    }
  };

  const openUploadModal = () => {
    setSelectedFile(null);
    setUploadForm({ title: '', description: '', category: 'Academic Resources' });
    setShowUploadModal(true);
  };

  let Content: React.ReactNode = null;

  if (activeTab === 'home') {
    Content = (
      <View style={styles.content}>
        <ScrollView style={styles.scrollView}>
          <Text style={styles.welcomeText}>Welcome, Dr. {expertName}</Text>
          <Text style={styles.subText}>Mental Health Expert Dashboard</Text>

          {/* Quick Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: '#6dd5ed' }]}
              onPress={() => router.push('./calm')}
            >
              <Text style={styles.actionIcon}>🧘‍♀</Text>
              <Text style={styles.actionTitle}>Calm Companion</Text>
              <Text style={styles.actionSubtitle}>Guided meditation tools</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: '#ff6b6b' }]}
              onPress={() => setActiveTab('patients')}
            >
              <Text style={styles.actionIcon}>👥</Text>
              <Text style={styles.actionTitle}>View Patients</Text>
              <Text style={styles.actionSubtitle}>Student mental health data</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: '#4ecdc4' }]}
              onPress={() => Alert.alert('Feature Coming Soon', 'This feature will be available in the next update.')}
            >
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionTitle}>Analytics</Text>
              <Text style={styles.actionSubtitle}>Mental health insights</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: '#45b7d1' }]}
              onPress={() => router.push(`./consultation?expertReg=${encodeURIComponent(expertRegNo)}&studentName=General&studentReg=&studentEmail=`)}
            >
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionTitle}>Consultations</Text>
              <Text style={styles.actionSubtitle}>Chat with students</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: '#9b59b6' }]}
              onPress={openUploadModal}
            >
              <Text style={styles.actionIcon}>📁</Text>
              <Text style={styles.actionTitle}>Upload Resources</Text>
              <Text style={styles.actionSubtitle}>Share learning materials</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: '#f39c12' }]}
              onPress={() => router.push("/expert/schedule")}
            >
              <Text style={styles.actionIcon}>📅</Text>
              <Text style={styles.actionTitle}>Schedule</Text>
              <Text style={styles.actionSubtitle}>Manage appointments</Text>
            </TouchableOpacity>
          </View>

          {/* Expert Info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Expert Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Registration ID:</Text>
              <Text style={styles.infoValue}>{expertRegNo}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Specialization:</Text>
              <Text style={styles.infoValue}>Mental Health Support</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Role:</Text>
              <Text style={styles.infoValue}>Mental Health Expert</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  } else if (activeTab === 'patients') {
    Content = (
      <View style={styles.content}>
        <ScrollView style={styles.scrollView}>
          <Text style={styles.sectionTitle}>Patient Overview</Text>

          {loading ? (
            <Text style={styles.loadingText}>Loading patients...</Text>
          ) : patients.length === 0 ? (
            <Text style={styles.emptyText}>No patients found.</Text>
          ) : (
            patients.map((patient, index) => (
              <View key={`patient-${patient.id}-${index}`} style={styles.patientCard}>
                <View style={styles.patientHeader}>
                  <Text style={styles.patientName}>{patient.user_name}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Active</Text>
                  </View>
                </View>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientDetail}>Reg: {patient.registration_number}</Text>
                  <Text style={styles.patientDetail}>Course: {patient.course || 'N/A'}</Text>
                  <Text style={styles.patientDetail}>Email: {patient.email || 'N/A'}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  } else if (activeTab === 'profile') {
    Content = (
      <View style={styles.content}>
        <ScrollView style={styles.scrollView}>
          <Text style={styles.sectionTitle}>Expert Profile</Text>

          <View style={styles.profileCard}>
            <Text style={styles.profileName}>Dr. {expertName}</Text>
            <Text style={styles.profileRole}>Mental Health Expert</Text>
            <Text style={styles.profileId}>ID: {expertRegNo}</Text>

            <View style={styles.profileStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{patients.length}</Text>
                <Text style={styles.statLabel}>Patients</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>Professional</Text>
                <Text style={styles.statLabel}>Status</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  } else if (activeTab === 'settings') {
    Content = (
      <View style={styles.content}>
        <View style={styles.settingsContainer}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Alert.alert('Feature Coming Soon', 'This feature will be available in the next update.')}
          >
            <Text style={styles.settingText}>Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => Alert.alert('Feature Coming Soon', 'This feature will be available in the next update.')}
          >
            <Text style={styles.settingText}>Notification Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Text style={[styles.settingText, styles.logoutText]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  } else if (activeTab === 'connect') {
    Content = (
      <View style={styles.content}>
        <ScrollView style={styles.scrollView}>
          <Text style={styles.sectionTitle}>Connect with Patients</Text>

          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No active connections found.</Text>
            <Text style={styles.emptySubText}>You can start a new connection or check your requests.</Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push('./expert-connect')}
            >
              <Text style={styles.buttonText}>Start New Connection</Text>
            </TouchableOpacity>
          </View>

          {/* Render active connections if any */}
          {/* {activeConnections.map((connection) => (
            <View key={connection.id} style={styles.connectionCard}>
              <Text style={styles.connectionName}>{connection.patientName}</Text>
              <Text style={styles.connectionStatus}>{connection.status}</Text>
            </View>
          ))} */}
        </ScrollView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {Content}

      {/* Upload Modal */}
      <Modal
        visible={showUploadModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📁 Upload Learning Resource</Text>
              <TouchableOpacity
                onPress={() => setShowUploadModal(false)}
                style={styles.modalCloseButton}
                activeOpacity={0.3}
                delayPressIn={0}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Resource Title *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter resource title..."
                  value={uploadForm.title}
                  onChangeText={(text) => setUploadForm(prev => ({ ...prev, title: text }))}
                  maxLength={100}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description *</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="Describe the learning resource..."
                  value={uploadForm.description}
                  onChangeText={(text) => setUploadForm(prev => ({ ...prev, description: text }))}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category</Text>
                <View style={styles.categorySelector}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryOption,
                        uploadForm.category === category && styles.selectedCategoryOption
                      ]}
                      onPress={() => setUploadForm(prev => ({ ...prev, category }))}
                      activeOpacity={0.3}
                      delayPressIn={0}
                    >
                      <Text style={[
                        styles.categoryOptionText,
                        uploadForm.category === category && styles.selectedCategoryOptionText
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.fileUploadSection}>
                <Text style={styles.formLabel}>File Upload *</Text>
                {selectedFile ? (
                  <View style={styles.selectedFileContainer}>
                    <View style={styles.selectedFileInfo}>
                      <Text style={styles.selectedFileIcon}>📄</Text>
                      <View style={styles.selectedFileDetails}>
                        <Text style={styles.selectedFileName}>{selectedFile.name}</Text>
                        <Text style={styles.selectedFileSize}>
                          {selectedFile.size ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.changeFileButton}
                      onPress={handleFileSelection}
                      activeOpacity={0.3}
                      delayPressIn={0}
                    >
                      <Text style={styles.changeFileButtonText}>Change File</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.fileUploadButton}
                    onPress={handleFileSelection}
                    activeOpacity={0.3}
                    delayPressIn={0}
                  >
                    <Text style={styles.fileUploadIcon}>📄</Text>
                    <Text style={styles.fileUploadText}>Select File (PDF, DOC, etc.)</Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.fileUploadHint}>
                  Supported formats: PDF, DOC, DOCX, PPT, PPTX, TXT, JPG, PNG (Max: 10MB)
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowUploadModal(false)}
                activeOpacity={0.3}
                delayPressIn={0}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalUploadButton, uploadLoading && styles.modalUploadButtonDisabled]}
                onPress={async () => {
                    const uri = selectedFile?.uri;
                    let output_path = "";

                    if (uri) {
                      try {
                        const path = await uploadFile(uri);
                        console.log("OUTPUT PATH - ", path);
                        output_path = path || "";
                      } catch (err) {
                        console.log("Upload failed:", err);
                      }
                    } else {
                      Alert.alert("No file selected.");
                    }
                    const resourceDataToBeUploaded = {
                      resource_title: uploadForm.title,
                      description: uploadForm.description,
                      file_url: output_path, // In production, this would be the cloud storage URL after upload
                      category: uploadForm.category.toUpperCase().replace(" ", "_"),
                    };
                    const {data, error} = await supabase.from("library").insert(resourceDataToBeUploaded);
                    console.log("DATA - ", data);
                    console.log("ERROR - ", error);
                  }}
                disabled={uploadLoading}
                activeOpacity={0.3}
                delayPressIn={0}
              >
                {uploadLoading ? (
                  <View style={styles.uploadLoadingContainer}>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={styles.modalUploadButtonText}>Uploading...</Text>
                  </View>
                ) : (
                  <Text style={styles.modalUploadButtonText}>🚀 Upload Resource</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'home' && styles.activeTabItem]}
          onPress={() => setActiveTab('home')}
        >
          <Text style={[styles.tabIcon, activeTab === 'home' && styles.activeTabIcon]}>🏠</Text>
          <Text style={[styles.tabLabel, activeTab === 'home' && styles.activeTabLabel]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'patients' && styles.activeTabItem]}
          onPress={() => setActiveTab('patients')}
        >
          <Text style={[styles.tabIcon, activeTab === 'patients' && styles.activeTabIcon]}>👥</Text>
          <Text style={[styles.tabLabel, activeTab === 'patients' && styles.activeTabLabel]}>Patients</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'connect' && styles.activeTabItem]}
          onPress={() => router.push('./expert-connect')}
        >
          <Text style={[styles.tabIcon, activeTab === 'connect' && styles.activeTabIcon]}>🔗</Text>
          <Text style={[styles.tabLabel, activeTab === 'connect' && styles.activeTabLabel]}>Connect</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'profile' && styles.activeTabItem]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabIcon, activeTab === 'profile' && styles.activeTabIcon]}>👤</Text>
          <Text style={[styles.tabLabel, activeTab === 'profile' && styles.activeTabLabel]}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'settings' && styles.activeTabItem]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabIcon, activeTab === 'settings' && styles.activeTabIcon]}>⚙</Text>
          <Text style={[styles.tabLabel, activeTab === 'settings' && styles.activeTabLabel]}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef9e7',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#a8e6cf',
    textAlign: 'center',
    marginBottom: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    color: '#6b7c93',
    textAlign: 'center',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionCard: {
    width: '48%',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  actionIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    textAlign:'center'
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 50,
  },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#e8b4ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d5a3d',
  },
  statusBadge: {
    backgroundColor: '#88d8c0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#2d5a3d',
    fontSize: 12,
    fontWeight: 'bold',
  },
  patientInfo: {
    marginTop: 10,
  },
  patientDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7965AF',
    marginBottom: 5,
  },
  profileRole: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  profileId: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7965AF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  settingsContainer: {
    flex: 1,
    padding: 20,
  },
  settingItem: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#ff6b6b',
    marginTop: 30,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 15,
    paddingBottom: 25,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeTabItem: {
    backgroundColor: 'transparent',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
    color: '#b19cd9',
  },
  activeTabIcon: {
    color: '#a8e6cf',
  },
  tabLabel: {
    fontSize: 12,
    color: '#b19cd9',
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#a8e6cf',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#4ecdc4',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  // Session styles for Connect tab
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginVertical: 20,
  },
  emptySubText: {
    fontSize: 14,
    color: '#6b7c93',
    textAlign: 'center',
    marginTop: 5,
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 5,
    shadowColor: '#e8b4ff',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sessionTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d5a3d',
    flex: 1,
  },
  sessionStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    marginLeft: 10,
  },
  sessionStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sessionDetails: {
    marginVertical: 10,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  sessionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d5a3d',
    minWidth: 100,
  },
  sessionValue: {
    fontSize: 14,
    color: '#2d5a3d',
    flex: 1,
    marginLeft: 10,
  },
  sessionActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f8f9fa',
  },
  sessionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  sessionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Upload Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '85%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  modalBody: {
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  formTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryOption: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedCategoryOption: {
    backgroundColor: '#9b59b6',
    borderColor: '#9b59b6',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedCategoryOptionText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  fileUploadSection: {
    marginBottom: 20,
  },
  fileUploadButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: 'center',
    marginBottom: 8,
  },
  fileUploadIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  fileUploadText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  fileUploadHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalCancelButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 0.4,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalUploadButton: {
    backgroundColor: '#9b59b6',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 0.55,
    alignItems: 'center',
  },
  modalUploadButtonDisabled: {
    backgroundColor: '#ccc',
  },
  modalUploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedFileContainer: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 10,
    padding: 15,
    marginBottom: 8,
  },
  selectedFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedFileIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  selectedFileDetails: {
    flex: 1,
  },
  selectedFileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectedFileSize: {
    fontSize: 12,
    color: '#666',
  },
  changeFileButton: {
    backgroundColor: '#9b59b6',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  changeFileButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
