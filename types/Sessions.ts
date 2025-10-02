export type SessionStatus ="APPROVED" | "DENIED" | "PENDING";

export type Sessions = {
    id: number;
    expert_peer_id: number;
    student_id: number;
    start_time: Date;
    end_time: Date;
    status: SessionStatus;
};
