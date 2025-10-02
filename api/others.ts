import Toast from "react-native-toast-message";
import { UseMutateAsyncFunction, UseQueryResult } from "@tanstack/react-query";
import { ExpertPeerSlot } from "../types/ExpertPeer";
import { Sessions } from "../types/Sessions";
import { supabase } from "../lib/supabase";

type RefetchFn<T> = UseQueryResult<T>['refetch'];

type RefetchSessions = () => Promise<{
  data?: Sessions[] | undefined;
  error?: unknown;
}>;

type InsertSlotMutation = UseMutateAsyncFunction<
  Sessions,  // success return type
  Error,     // error type
  Sessions   // variable (input) type
>;

export const toTitleCase = (word: string) => {
  const first_letter = word.charAt(0).toLocaleUpperCase();
  const rest_of_the_word = word.substring(1).toLocaleLowerCase();
  return first_letter + rest_of_the_word;
}


export function returnNewSlot(expertPeerSlot: ExpertPeerSlot, groupType: string): ExpertPeerSlot[] {
  const start = new Date(expertPeerSlot.start_time);
  const end = new Date(expertPeerSlot.end_time);
  const slots: ExpertPeerSlot[] = [];
  if (groupType === "PEER") {
    const diffMs = end.getTime() - start.getTime();
    const chunkMs = 30 * 60 * 1000; // 30 minutes in ms

    if (diffMs <= chunkMs) {
      slots.push(expertPeerSlot);
      return slots;
    }

    let current = new Date(start);
    let i = 0;

    while (current.getTime() + chunkMs <= end.getTime()) {
      const chunkStart = new Date(current);
      const chunkEnd = new Date(current.getTime() + chunkMs);

      slots.push({     // keep expert_peer_id, group, etc.
        id: i,
        expert_peer_id: expertPeerSlot.expert_peer_id,
        start_time: chunkStart,
        end_time: chunkEnd,
        group: expertPeerSlot.group
      });

      current = chunkEnd;
      i++;
    }
  }

  else if (groupType === "EXPERT") {
    const diffHours = end.getHours() - start.getHours();

    if (diffHours <= 1) {
      slots.push(expertPeerSlot);
      return slots;
    }

    let current = new Date(start);

    for (let i = 0; i < diffHours; i++) {
      const chunkStart = new Date(current);
      const chunkEnd = new Date(current);
      chunkEnd.setHours(chunkEnd.getHours() + 1);

      slots.push({
        id: i,
        expert_peer_id: expertPeerSlot.expert_peer_id,
        start_time: chunkStart,
        end_time: chunkEnd,
        group: expertPeerSlot.group,
      });
      current.setHours(current.getHours() + 1);
    }
  }
  return slots;
}


export function isOverlapping(slotStart: Date, slotEnd: Date, sessionStart: Date, sessionEnd: Date) {
  return slotStart < sessionEnd && sessionStart < slotEnd;
}


export function getFreeSlots(
  expertPeerSlots: ExpertPeerSlot[],
  sessionsByDate: Sessions[]
) {
  let allChunks: ExpertPeerSlot[] = [];
  for (const slot of expertPeerSlots) {
    const chunks = returnNewSlot(slot, slot.group);
    allChunks.push(...chunks);
  }

  if (!sessionsByDate.length) return allChunks;

  const freeChunks = allChunks.filter(chunk => {
    const chunkStart = new Date(chunk.start_time);
    const chunkEnd = new Date(chunk.end_time);

    // check against every session
    for (const s of sessionsByDate) {
      const sStart = new Date(s.start_time);
      const sEnd = new Date(s.end_time);

      if (isOverlapping(chunkStart, chunkEnd, sStart, sEnd)) {
        return false; // busy
      }
    }
    return true; // free
  });

  return freeChunks;
}

export async function bookASession(userId: number, expertPeerSlot: ExpertPeerSlot,
  insertSlotMutation: InsertSlotMutation,
  refetchSessions: RefetchSessions,
  refetchExpertPeerSlots: RefetchFn<ExpertPeerSlot[]>) {
    console.log("OUTSIDE IF STATEMENT");
    if (userId && expertPeerSlot.expert_peer_id) {
    const sessionSlot: Sessions = {
      id: Math.floor((Math.random() * 100) + 1),
      student_id: userId,
      expert_peer_id: expertPeerSlot.expert_peer_id,
      start_time: new Date(expertPeerSlot.start_time),
      end_time: new Date(expertPeerSlot.end_time),
      status: "PENDING",
    };
    console.log("this is the object of session - " + JSON.stringify(sessionSlot));

    try {
      await insertSlotMutation(sessionSlot);
      Toast.show({
        type: 'success', // 'success' | 'error' | 'info'
        text1: 'Applied for session! Waiting for expert to approve it.',
        position: 'bottom', // or 'bottom'
        visibilityTime: 1500
      });
      refetchSessions();
      refetchExpertPeerSlots();
    }
    catch (error) {
      console.log(error);
      Toast.show({
        type: 'error', // 'success' | 'error' | 'info'
        text1: 'Could not apply for session.',
        position: 'bottom', // or 'bottom'
        visibilityTime: 1500
      });
    }
  } else {
    console.warn("Missing student or expert id");
  }
}

export function formatTime(date:Date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(date: Date) {
  return new Date(date).toLocaleDateString([], {
    year: 'numeric',
    month: 'short', // or '2-digit'
    day: '2-digit'
  });
}


export const acceptDenySessionAction = async (
  sessionId: number,
  action: 'APPROVED' | 'DENIED',
  setDisableButton: (value: boolean) => void,
  refetchExpertSessions: () => void
) => {
  setDisableButton(true);

  try {
    const { error } = await supabase
      .from('sessions')
      .update({ status: action })
      .eq('id', sessionId);

    if (error) throw error;

    Toast.show({
      type: 'success',
      text1:
        action === 'APPROVED'
          ? 'Session accepted successfully'
          : 'Session denied successfully',
      position: 'bottom',
      visibilityTime: 1500,
    });
  } catch (e) {
    Toast.show({
      type: 'error',
      text1:
        action === 'APPROVED'
          ? 'Could not accept the session.'
          : 'Could not deny the session.',
      position: 'bottom',
      visibilityTime: 1500,
    });
  } finally {
    setDisableButton(false);
    refetchExpertSessions();
  }
};
