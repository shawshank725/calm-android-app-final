import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { ExpertPeerSlot } from "../../types/ExpertPeer";


export const useExpertPeerSlots = (userId: number) => {
    return useQuery<ExpertPeerSlot[]>({
        queryKey: ['expert-peer-slot', userId],
        queryFn: async () => {
        const {data, error} = await supabase.from("expert_peer_slots").select("*").eq("expert_peer_id", userId).order("start_time", {ascending: true});
        if (error) {
            throw new Error(error.message);
        }
        return data;
        },
        enabled: !!userId,
    })
};


export const useAllExpertPeerSlots = () => {
    return useQuery<ExpertPeerSlot[]>({
        queryKey: ['all-expert-slots'],
        queryFn: async () => {
        const {data, error} = await supabase.from("expert_peer_slots").select("*").order("start_time", {ascending: true});
        if (error) {
            throw new Error(error.message);
        }
        return data;
        }
    })
};



export const useInsertSlot = () => {
    return useMutation({
        async mutationFn(data:any) {
            const result = await supabase.from('expert_peer_slots').insert({
                expert_peer_id: data.expert_peer_id,
                start_time: data.start_time,
                end_time:data.end_time,
            }).select().single();
            if (result.error) {
                throw new Error(result.error.message);
            }
            return result.data;
        },
    });
};

export const useDeleteSlot = () => {
    return useMutation({
        async mutationFn(data:ExpertPeerSlot) {
            const result = await supabase.from('expert_peer_slots').delete().match({"start_time": data.start_time});
            if (result.error) {
                throw new Error(result.error.message);
            }
            return result.data;
        },
    });
}


// getting expert and peer id and their profile
export const useGetExpertPeerProfiles = () => {
    return useQuery({
        queryKey: ["expert-profile"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("*");
            if (error){
                console.log(error);
            }
            else {
                return data;
            }
        }
    })
}

// this is to get all the sessions of an expert - all sessions that are booked with him/her
export const useGetExpertSessions = (expertId: number) => {
    return useQuery({
        queryKey: ["expert-sessions", expertId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("sessions")
                .select("*")
                .eq("expert_peer_id", expertId);
            if (error){
                console.log(error);
            }
            else {
                return data;
            }
        },
        enabled: !!expertId,
    });
}


export const useStudentProfilesByExpert = (expertId: number) => {
    return useQuery({
        queryKey: ['student-profiles', expertId],
        enabled: !!expertId,
        queryFn: async () => {
            const { data: sessions, error: sErr } = await supabase
                .from('sessions')
                .select('student_id')
                .eq('expert_id', expertId);

            if (sErr) throw sErr;

            const studentIds = sessions?.map((row) => row.student_id) ?? [];

            if (studentIds.length === 0) return [];

            const { data: profiles, error: pErr } = await supabase
                .from('profiles')
                .select('*')
                .in('id', studentIds);

            if (pErr) throw pErr;

            return profiles;
        },
    });
};
