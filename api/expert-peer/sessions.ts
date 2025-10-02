import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { Sessions } from "../../types/Sessions";

export const useSessionsByDate = (userId: string, date: Date) => {
  return useQuery<Sessions[]>({
    queryKey: ["sessions", userId, date.toDateString()],
    queryFn: async () => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .gte("start_time", startOfDay.toISOString())
        .lte("start_time", endOfDay.toISOString());

      if (error) throw new Error(error.message);
      return data as Sessions[];
    },
    enabled: !!userId && !!date,
  });
};

export const useInsertSession = () => {
  return useMutation<Sessions, Error, Sessions>({
    mutationFn: async (payload: Sessions) => {
      const { data, error } = await supabase
        .from('sessions')
        .insert([payload])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
  });
};

export const useAllSessionsByUserId = (userId: string) => {
  return useQuery({
    queryKey: ["sessions", userId],
    queryFn: async () => {
      const {data, error} = await supabase.from("sessions").select("*").eq("student_id", userId);
      if (error){
        console.log(error);
      }
      else {
        return data;
      }
    },
    enabled: !!userId,
  })
}
