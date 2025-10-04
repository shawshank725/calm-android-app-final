import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';

interface TimeSlot {
  id?: string;
  expert_registration: string;
  expert_name: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  booked_by?: string;
  created_at?: string;
}

// Generate default time slots from 9:00 AM to 3:50 PM (50-minute sessions)
const generateDefaultSlots = (): Array<{ start: string; end: string }> => {
  const slots = [];
  for (let hour = 9; hour <= 15; hour++) {
    if (hour === 15) {
      // Last slot 3:00-3:50 PM
      slots.push({ start: '15:00:00', end: '15:50:00' });
    } else {
      slots.push({
        start: `${hour.toString().padStart(2, '0')}:00:00`,
        end: `${hour.toString().padStart(2, '0')}:50:00`
      });
    }
  }
  return slots;
};

const DEFAULT_SLOTS = generateDefaultSlots();

export default function ExpertSchedulePage() {
  const router = useRouter();
  const [expertName, setExpertName] = useState('');
  const [expertRegNo, setExpertRegNo] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [allSchedules, setAllSchedules] = useState<Map<string, TimeSlot[]>>(new Map());

  useEffect(() => {
    loadExpertInfo();
  }, []);

  useEffect(() => {
    if (expertRegNo) {
      loadAllSchedules();
    }
  }, [expertRegNo, currentMonth]);

  const loadExpertInfo = async () => {
    try {
      const storedReg = await AsyncStorage.getItem('currentExpertReg');
      const storedName = await AsyncStorage.getItem('currentExpertName');
      if (storedReg) setExpertRegNo(storedReg);
      if (storedName) setExpertName(storedName);
    } catch (error) {
      console.error('Error loading expert info:', error);
    }
  };

  const loadAllSchedules = async () => {
    try {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('expert_schedule')
        .select('*')
        .eq('expert_registration', expertRegNo)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0]);

      if (error) {
        console.error('Error loading schedules:', error);
      } else if (data) {
        const scheduleMap = new Map<string, TimeSlot[]>();
        data.forEach((slot: TimeSlot) => {
          const dateKey = slot.date;
          if (!scheduleMap.has(dateKey)) {
            scheduleMap.set(dateKey, []);
          }
          scheduleMap.get(dateKey)?.push(slot);
        });
        setAllSchedules(scheduleMap);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const loadSlotsForDate = async (date: Date) => {
    setLoading(true);
    try {
      const dateString = date.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('expert_schedule')
        .select('*')
        .eq('expert_registration', expertRegNo)
        .eq('date', dateString)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error loading slots:', error);
        setSlots([]);
      } else {
        setSlots(data || []);
      }
    } catch (error) {
      console.error('Error loading slots:', error);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDatePress = async (date: Date) => {
    setSelectedDate(date);
    await loadSlotsForDate(date);
    setModalVisible(true);
  };

  const handleAddDefaultSlots = async () => {
    if (!selectedDate) return;

    Alert.alert(
      'Add Default Slots',
      'Add all default time slots (9:00 AM - 3:50 PM) for this date?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: async () => {
            setLoading(true);
            try {
              const dateString = selectedDate.toISOString().split('T')[0];
              const slotsToAdd = DEFAULT_SLOTS.map(slot => ({
                expert_registration: expertRegNo,
                expert_name: expertName,
                date: dateString,
                start_time: slot.start,
                end_time: slot.end,
                is_available: true
              }));

              const { error } = await supabase
                .from('expert_schedule')
                .insert(slotsToAdd);

              if (error) {
                console.error('Error adding slots:', error);
                Alert.alert('Error', 'Failed to add slots. Some slots may already exist.');
              } else {
                Alert.alert('Success', 'Default slots added successfully!');
                await loadSlotsForDate(selectedDate);
                await loadAllSchedules();
              }
            } catch (error) {
              console.error('Error:', error);
              Alert.alert('Error', 'An error occurred while adding slots.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteSlot = async (slotId: string) => {
    Alert.alert(
      'Delete Slot',
      'Are you sure you want to delete this time slot?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase
                .from('expert_schedule')
                .delete()
                .eq('id', slotId);

              if (error) {
                console.error('Error deleting slot:', error);
                Alert.alert('Error', 'Failed to delete slot.');
              } else {
                Alert.alert('Success', 'Slot deleted successfully!');
                if (selectedDate) {
                  await loadSlotsForDate(selectedDate);
                  await loadAllSchedules();
                }
              }
            } catch (error) {
              console.error('Error:', error);
              Alert.alert('Error', 'An error occurred while deleting slot.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteAllSlots = async () => {
    if (!selectedDate) return;

    Alert.alert(
      'Delete All Slots',
      `Delete all time slots for ${selectedDate.toLocaleDateString()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const dateString = selectedDate.toISOString().split('T')[0];
              const { error } = await supabase
                .from('expert_schedule')
                .delete()
                .eq('expert_registration', expertRegNo)
                .eq('date', dateString);

              if (error) {
                console.error('Error deleting slots:', error);
                Alert.alert('Error', 'Failed to delete slots.');
              } else {
                Alert.alert('Success', 'All slots deleted successfully!');
                setSlots([]);
                await loadAllSchedules();
              }
            } catch (error) {
              console.error('Error:', error);
              Alert.alert('Error', 'An error occurred while deleting slots.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const hasSchedule = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return allSchedules.has(dateString) && (allSchedules.get(dateString)?.length || 0) > 0;
  };

  const renderCalendar = () => {
    const days = getDaysInMonth(currentMonth);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <View style={styles.calendar}>
        {/* Month Header */}
        <View style={styles.monthHeader}>
          <TouchableOpacity
            onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            style={styles.monthButton}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity
            onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            style={styles.monthButton}
          >
            <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Week Days */}
        <View style={styles.weekDays}>
          {weekDays.map(day => (
            <View key={day} style={styles.weekDayCell}>
              <Text style={styles.weekDayText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Days */}
        <View style={styles.daysGrid}>
          {days.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                !day && styles.emptyCell,
                day && isToday(day) && styles.todayCell,
                day && hasSchedule(day) && styles.scheduledCell
              ]}
              onPress={() => day && handleDatePress(day)}
              disabled={!day}
            >
              {day && (
                <>
                  <Text style={[
                    styles.dayText,
                    isToday(day) && styles.todayText,
                    hasSchedule(day) && styles.scheduledText
                  ]}>
                    {day.getDate()}
                  </Text>
                  {hasSchedule(day) && <View style={styles.scheduleDot} />}
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderSlotModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedDate?.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.addBtn]}
              onPress={handleAddDefaultSlots}
              disabled={loading}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Add Default Slots</Text>
            </TouchableOpacity>
            {slots.length > 0 && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.deleteAllBtn]}
                onPress={handleDeleteAllSlots}
                disabled={loading}
              >
                <Ionicons name="trash" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Delete All</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Slots List */}
          <ScrollView style={styles.slotsList} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : slots.length === 0 ? (
              <View style={styles.emptySlots}>
                <Ionicons name="calendar-outline" size={60} color="#ccc" />
                <Text style={styles.emptySlotsText}>No time slots scheduled</Text>
                <Text style={styles.emptySlotsHint}>Tap "Add Default Slots" to add schedule</Text>
              </View>
            ) : (
              slots.map((slot, index) => (
                <View key={slot.id || index} style={styles.slotCard}>
                  <View style={styles.slotInfo}>
                    <View style={styles.slotTimeContainer}>
                      <Ionicons name="time-outline" size={20} color={Colors.primary} />
                      <Text style={styles.slotTime}>
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </Text>
                    </View>
                    <View style={[
                      styles.slotStatus,
                      { backgroundColor: slot.is_available ? '#E8F5E9' : '#FFEBEE' }
                    ]}>
                      <Text style={[
                        styles.slotStatusText,
                        { color: slot.is_available ? '#4CAF50' : '#F44336' }
                      ]}>
                        {slot.is_available ? 'Available' : 'Booked'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteSlotBtn}
                    onPress={() => slot.id && handleDeleteSlot(slot.id)}
                    disabled={loading}
                  >
                    <Ionicons name="trash-outline" size={20} color="#F44336" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Schedule</Text>
          <Text style={styles.headerSubtitle}>{expertName}</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={Colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Schedule Management</Text>
            <Text style={styles.infoText}>
              Tap on any date to add or manage time slots. Default slots run from 9:00 AM to 3:50 PM.
            </Text>
          </View>
        </View>

        {/* Calendar */}
        {renderCalendar()}

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Legend:</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: Colors.primary + '20' }]} />
              <Text style={styles.legendText}>Today</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#E8F5E9' }]} />
              <Text style={styles.legendText}>Has Schedule</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Slot Management Modal */}
      {renderSlotModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backButton: {
    marginRight: 15,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  calendar: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthButton: {
    padding: 5,
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
    position: 'relative',
  },
  emptyCell: {
    opacity: 0,
  },
  todayCell: {
    backgroundColor: Colors.primary + '20',
    borderRadius: 8,
  },
  scheduledCell: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  dayText: {
    fontSize: 16,
    color: '#333',
  },
  todayText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  scheduledText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  scheduleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4CAF50',
    position: 'absolute',
    bottom: 5,
  },
  legend: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  legendItems: {
    flexDirection: 'row',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  addBtn: {
    backgroundColor: Colors.primary,
  },
  deleteAllBtn: {
    backgroundColor: '#F44336',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  slotsList: {
    flex: 1,
    padding: 15,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptySlots: {
    alignItems: 'center',
    padding: 40,
  },
  emptySlotsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 15,
  },
  emptySlotsHint: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  slotCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotInfo: {
    flex: 1,
    gap: 8,
  },
  slotTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  slotStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  slotStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteSlotBtn: {
    padding: 8,
  },
});
