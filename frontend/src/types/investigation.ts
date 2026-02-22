export interface Suspect {
  id: number;
  case: number;
  name: string;
  first_name: string;
  last_name: string;
  national_code: string;
  image?: string;
  details: string;
  is_main_suspect: boolean;
  is_on_board: boolean;
  is_arrested?: boolean;
  status?: "IDENTIFIED" | "UNDER_ARREST" | "ARRESTED";
  interrogations?: Interrogation[];
}

export interface Interrogation {
  id: number;
  suspect: number;
  interrogator: number;
  interrogator_name?: string;
  supervisor?: number;
  supervisor_name?: string;
  transcript: string;
  interrogator_score: number;
  supervisor_score?: number;
  is_interrogator_confirmed?: boolean;
  is_supervisor_confirmed?: boolean;
  final_score: number;
  feedback?: InterrogationFeedback;
  created_at: string;
}

export interface InterrogationFeedback {
  id: number;
  interrogation: number;
  captain: number;
  captain_name?: string;
  is_confirmed: boolean;
  decision?: 'INNOCENT' | 'GUILTY';
  decision_display?: string;
  notes?: string;
  is_chief_confirmed?: boolean;
  chief_notes?: string;
  chief?: number;
  chief_name?: string;
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
  first_name: string;
  last_name: string;
  national_code?: string;
  details: string;
  is_main_suspect?: boolean;
}

export interface CreateInterrogationRequest {
  suspect: number;
  transcript: string;
  interrogator_score: number;
}

export interface CreateBoardConnectionRequest {
  case: number;
  from_evidence?: number;
  from_suspect?: number;
  to_evidence?: number;
  to_suspect?: number;
  description?: string;
}
