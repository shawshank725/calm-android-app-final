
export type SessionStatus ="ACCEPTED" | "DENIED" | "PENDING";

export type Sessions = {
    id: number;
    expert_peer_id: string;
    student_id: string;
    start_time: Date;
    end_time: Date;
    status: SessionStatus;
};
