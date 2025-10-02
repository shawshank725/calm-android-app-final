import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from 'react';
import { Alert, Button, Modal, StyleSheet, Text, View } from 'react-native';
import { DataTable } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { useExpertPeerSlots, useInsertSlot } from '../../api/expert-peer/expert-peer';
import { supabase } from '../../lib/supabase';
import { ExpertPeerSlot } from '../../types/ExpertPeer';

export default function ExpertSlotScreen() {
    const [expertRegistrationNumber, setExpertRegistrationNumber] = useState("");

    useEffect(() => {
        const getExpertId = async () => {
            const id = await AsyncStorage.getItem("currentExpertReg");
            if (id) setExpertRegistrationNumber(id);
        };

        getExpertId();
    }, []);

    const { data: expertSlots, isLoading: isExpertSlotLoading, refetch: refetchExpertPeerSlots } = useExpertPeerSlots(Number(expertRegistrationNumber));
    const [showModal, setShowModal] = useState<boolean>(false);
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());
    const [showStartTimePicker, setShowStartTimePicker] = useState<boolean>(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState<boolean>(false);
    const { mutate: insertMutate } = useInsertSlot();
    const [disabledButton, setDisabledButton] = useState<boolean>(false);

    const validateSlot = () => {
        if (!expertSlots) return true; // no slots yet, valid

        // normalize function: set all dates to same arbitrary day
        const normalize = (date: Date) => new Date(1970, 0, 1, date.getHours(), date.getMinutes());

        const newStart = normalize(startTime);
        const newEnd = normalize(endTime);

        if (newStart.getTime() === newEnd.getTime()) {
            Alert.alert("Starting and ending time cannot be the same.");
            return false;
        }
        if (newStart > newEnd) {
            Alert.alert("Start time cannot be greater than end time.");
            return false;
        }

        for (const slot of expertSlots) {
            const existingStart = normalize(new Date(slot.start_time));
            const existingEnd = normalize(new Date(slot.end_time));

            const overlap = newStart < existingEnd && existingStart < newEnd;

            if (overlap) {
                Alert.alert(
                    `This time conflicts with an existing slot from ${existingStart.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} to ${existingEnd.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}.`
                );
                return false;
            }
        }

        return true;
    };

    const insertSlot = () => {
        if (!validateSlot()) {
            console.log("slot is not valid");
            return;
        }

        setDisabledButton(true);

        insertMutate(
            {
                expert_peer_id: Number.parseInt(expertRegistrationNumber),
                start_time: startTime,
                end_time: endTime,
            },
            {
                onSuccess: (data) => {
                    setShowModal(false);
                    Toast.show({
                        type: 'success',
                        text1: 'Added slot successfully',
                        position: 'bottom',
                        visibilityTime: 1500,
                    });
                    setDisabledButton(false);
                    refetchExpertPeerSlots();
                    console.log("Slot inserted:", data);
                },
                onError: (error: any) => {
                    console.log("Insert error:", error);
                    Toast.show({
                        type: 'error',
                        text1: 'Failed to add slot',
                        position: 'bottom',
                        visibilityTime: 1500,
                    });
                    setDisabledButton(false);
                },
            }
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.slotContainer}>
                {expertSlots?.length === 0 ? (
                    <>
                        <Text style={styles.noSlotsText}>No slots found.</Text>
                        <Text style={styles.instructionText}>Click on the below button to add a new slot.</Text>
                    </>
                ) : (
                    <DataTable>
                        <DataTable.Header>
                            <DataTable.Title>S. No</DataTable.Title>
                            <DataTable.Title>Start Time</DataTable.Title>
                            <DataTable.Title>End Time</DataTable.Title>
                            <DataTable.Title>Delete</DataTable.Title>
                        </DataTable.Header>
                        {expertSlots?.map((slot: ExpertPeerSlot, index: number) => (
                            <DataTable.Row key={slot.id}>
                                <DataTable.Cell>{index + 1}</DataTable.Cell>
                                <DataTable.Cell>
                                    {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </DataTable.Cell>
                                <DataTable.Cell>
                                    {new Date(slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </DataTable.Cell>
                                <DataTable.Cell>
                                    <Ionicons
                                        name="trash-outline"
                                        size={22}
                                        color="red"
                                        onPress={async () => {
                                            const result = await supabase.from('expert_peer_slots').delete().match({ id: slot.id });
                                            if (!result.error) {
                                                Toast.show({
                                                    type: 'success',
                                                    text1: 'Deleted the slot',
                                                    position: 'bottom',
                                                    visibilityTime: 1500
                                                });
                                                refetchExpertPeerSlots();
                                            } else {
                                                Toast.show({
                                                    type: 'error',
                                                    text1: 'Could not delete slot',
                                                    position: 'bottom',
                                                    visibilityTime: 1500
                                                });
                                            }
                                        }}
                                    />
                                </DataTable.Cell>
                            </DataTable.Row>
                        ))}
                    </DataTable>
                )}
                <Button title="Add new slot" onPress={() => setShowModal(true)} />
            </View>
            <Modal
                visible={showModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add new slot</Text>
                            <Ionicons name="close" size={28} color="black" onPress={() => setShowModal(false)} />
                        </View>
                        <View style={styles.modalBody}>
                            <Text style={styles.timeText}>Start Time: {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                            <Button title="Select start time" onPress={() => setShowStartTimePicker(true)} />
                            {showStartTimePicker && (
                                <DateTimePicker
                                    value={startTime}
                                    mode="time"
                                    display="default"
                                    onChange={(_, date) => {
                                        setShowStartTimePicker(false);
                                        if (date) setStartTime(date);
                                    }}
                                />
                            )}

                            <Text style={styles.timeText}>End Time: {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                            <Button title="Select end time" onPress={() => setShowEndTimePicker(true)} />
                            {showEndTimePicker && (
                                <DateTimePicker
                                    value={endTime}
                                    mode="time"
                                    display="default"
                                    onChange={(_, date) => {
                                        setShowEndTimePicker(false);
                                        if (date) setEndTime(date);
                                    }}
                                />
                            )}

                            <View style={styles.addButtonContainer}>
                                <Text disabled={disabledButton} style={[styles.addButton, disabledButton && styles.disabledButton]} onPress={()=> {
                                        insertSlot();
                                }}>
                                    Add this slot
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f8f9fa',
    },
    slotContainer: {
        marginBottom: 20,
    },
    noSlotsText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
        textAlign: 'center',
    },
    instructionText: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 12,
        color: '#555',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalBody: {
        marginTop: 8,
    },
    timeText: {
        fontSize: 16,
        marginVertical: 8,
    },
    addButtonContainer: {
        marginTop: 16,
        alignItems: 'center',
    },
    addButton: {
        fontSize: 16,
        color: '#fff',
        backgroundColor: '#007bff',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 6,
        overflow: 'hidden',
    },
    disabledButton: {
        backgroundColor: '#aaa',
    },
});

