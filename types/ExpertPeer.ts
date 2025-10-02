export type ExpertPeer = "EXPERT" | "PEER";

export type ExpertPeerSlot = {
    id: number;
    expert_peer_id: number;
    start_time: Date;
    end_time: Date;
    group: ExpertPeer;
};
