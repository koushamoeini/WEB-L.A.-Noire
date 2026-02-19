import type { Case } from './case';
import type { Evidence } from './evidence';
import type { Interrogation, Verdict } from './investigation';

export interface ReportSuspect {
  id: number;
  case: number;
  name: string;
  details: string;
  is_main_suspect: boolean;
  is_on_board: boolean;
  interrogations?: Interrogation[];
}

export interface TrialHistoryReport {
  case: Case;
  evidence: Evidence[];
  suspects: ReportSuspect[];
  verdicts: Verdict[];
  officers_involved: string[];
}
