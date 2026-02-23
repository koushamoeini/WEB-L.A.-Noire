import type { Case } from './case';
import type { Evidence } from './evidence';
import type { Interrogation, Verdict } from './investigation';

export interface ReportSuspect {
  id: number;
  case: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  details: string;
  is_main_suspect: boolean;
  is_on_board: boolean;
  interrogations?: Interrogation[];
}

export interface ReportOfficer {
  username?: string;
  full_name?: string;
  roles?: string[];
}

export interface TrialHistoryReport {
  case: Case;
  evidence: Evidence[];
  suspects: ReportSuspect[];
  verdicts: Verdict[];
  officers_involved: Array<string | ReportOfficer>;
}
