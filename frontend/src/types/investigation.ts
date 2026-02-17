export interface Suspect {
  id: number;
  case: number;
  name: string;
  details: string;
  is_main_suspect: boolean;
  is_on_board: boolean;
}

export interface Interrogation {
  id: number;
  suspect: number;
  interrogator: number;
  interrogator_name?: string;
  transcript: string;
  score: number;
  created_at: string;
}

export interface InterrogationFeedback {
  id: number;
  interrogation: number;
  captain: number;
  final_score: number;
  is_confirmed: boolean;
  notes?: string;
}

export interface Board {
  id: number;
  case: number;
  created_at: string;
}

export interface BoardConnection {
  id: number;
  case: number;
  from_evidence?: number;
  from_suspect?: number;
  to_evidence?: number;
  to_suspect?: number;
  description?: string;
}

export interface BoardItem {
  id: number;
  type: 'evidence' | 'suspect';
  title: string;
  description?: string;
  is_on_board: boolean;
  position?: { x: number; y: number };
}

export interface Verdict {
  id: number;
  case: number;
  suspect: number;
  judge?: number;
  judge_username?: string;
  title: string;
  result: 'INNOCENT' | 'GUILTY';
  result_display?: string;
  punishment?: string;
  description: string;
  created_at: string;
}

// Request types
export interface CreateSuspectRequest {
  case: number;
  name: string;
  details: string;
  is_main_suspect?: boolean;
}

export interface CreateInterrogationRequest {
  suspect: number;
  transcript: string;
  score: number;
}

export interface CreateBoardConnectionRequest {
  case: number;
  from_evidence?: number;
  from_suspect?: number;
  to_evidence?: number;
  to_suspect?: number;
  description?: string;
}
