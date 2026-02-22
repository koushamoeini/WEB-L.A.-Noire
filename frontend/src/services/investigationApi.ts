import api from './api';
import type {
  Suspect,
  Interrogation,
  Board,
  BoardConnection,
  Verdict,
  CreateSuspectRequest,
  CreateInterrogationRequest,
  CreateBoardConnectionRequest,
} from '../types/investigation';

export const investigationAPI = {
  // Suspects
  listSuspects: async (caseId?: number): Promise<Suspect[]> => {
    const url = caseId ? `/investigation/suspects/?case=${caseId}` : '/investigation/suspects/';
    const response = await api.get(url);
    // Handle both paginated and non-paginated responses
    if (Array.isArray(response.data)) return response.data;
    return response.data?.results || [];
  },

  createSuspect: async (data: CreateSuspectRequest): Promise<Suspect> => {
    const response = await api.post('/investigation/suspects/', data);
    return response.data;
  },

  updateSuspect: async (id: number, data: Partial<Suspect>): Promise<Suspect> => {
    const response = await api.patch(`/investigation/suspects/${id}/`, data);
    return response.data;
  },

  deleteSuspect: async (id: number): Promise<void> => {
    await api.delete(`/investigation/suspects/${id}/`);
  },

  getSuspect: async (id: number): Promise<Suspect> => {
    const response = await api.get(`/investigation/suspects/${id}/`);
    return response.data;
  },

  toggleSuspectBoard: async (id: number): Promise<{ is_on_board: boolean }> => {
    const response = await api.post(`/investigation/suspects/${id}/toggle_board/`);
    return response.data;
  },

  listMostWanted: async (): Promise<any[]> => {
    const response = await api.get('/investigation/suspects/most_wanted/');
    if (Array.isArray(response.data)) return response.data;
    return response.data?.results || [];
  },

  // Interrogations
  listInterrogations: async (): Promise<Interrogation[]> => {
    const response = await api.get('/investigation/interrogations/');
    if (Array.isArray(response.data)) return response.data;
    return response.data?.results || [];
  },

  createInterrogation: async (data: CreateInterrogationRequest): Promise<Interrogation> => {
    const response = await api.post('/investigation/interrogations/', data);
    return response.data;
  },

  updateInterrogation: async (id: number, data: Partial<Interrogation>): Promise<Interrogation> => {
    const response = await api.patch(`/investigation/interrogations/${id}/`, data);
    return response.data;
  },

  deleteInterrogation: async (id: number): Promise<void> => {
    await api.delete(`/investigation/interrogations/${id}/`);
  },

  interrogationFeedback: async (id: number, data: any): Promise<any> => {
    const response = await api.post(`/investigation/interrogations/${id}/feedback/`, data);
    return response.data;
  },

  chiefConfirmInterrogation: async (id: number, data: { is_confirmed: boolean; notes: string }): Promise<any> => {
    const response = await api.post(`/investigation/interrogations/${id}/chief_confirm/`, data);
    return response.data;
  },

  // Boards
  listBoards: async (caseId?: number): Promise<Board[]> => {
    const url = caseId ? `/investigation/boards/?case=${caseId}` : '/investigation/boards/';
    const response = await api.get(url);
    return response.data;
  },

  createBoard: async (caseId: number): Promise<Board> => {
    const response = await api.post('/investigation/boards/', { case: caseId });
    return response.data;
  },

  // Board Connections
  listConnections: async (caseId?: number): Promise<BoardConnection[]> => {
    const url = caseId ? `/investigation/board-connections/?case=${caseId}` : '/investigation/board-connections/';
    const response = await api.get(url);
    return response.data;
  },

  createConnection: async (data: CreateBoardConnectionRequest): Promise<BoardConnection> => {
    const response = await api.post('/investigation/board-connections/', data);
    return response.data;
  },

  deleteConnection: async (id: number): Promise<void> => {
    await api.delete(`/investigation/board-connections/${id}/`);
  },

  // Verdicts
  createVerdict: async (data: any): Promise<Verdict> => {
    const response = await api.post('/investigation/verdicts/', data);
    return response.data;
  },

  listVerdicts: async (caseId: number): Promise<Verdict[]> => {
    const response = await api.get(`/investigation/verdicts/?case=${caseId}`);
    return response.data;
  },

  // Reward Reports
  createRewardReport: async (data: any): Promise<any> => {
    const response = await api.post('/investigation/reward-reports/', data);
    return response.data;
  },

  listRewardReports: async (suspectNationalCode?: string): Promise<any[]> => {
    const url = suspectNationalCode 
      ? `/investigation/reward-reports/?suspect_national_code=${suspectNationalCode}` 
      : '/investigation/reward-reports/';
    const response = await api.get(url);
    return response.data;
  },

  reviewRewardReportOfficer: async (id: number, approved: boolean, notes: string): Promise<any> => {
    const response = await api.post(`/investigation/reward-reports/${id}/officer_review/`, { approved, notes });
    return response.data;
  },

  reviewRewardReportDetective: async (id: number, approved: boolean, notes: string): Promise<any> => {
    const response = await api.post(`/investigation/reward-reports/${id}/detective_review/`, { approved, notes });
    return response.data;
  },

  verifyRewardPayout: async (nationalCode: string, rewardCode: string): Promise<any> => {
    const response = await api.post('/investigation/reward-reports/verify_payout/', { 
      national_code: nationalCode, 
      reward_code: rewardCode 
    });
    return response.data;
  },

  // Bail and Fine Payments
  getVerdict: async (id: number): Promise<Verdict> => {
    const response = await api.get(`/investigation/verdicts/${id}/`);
    return response.data;
  },

  setBailFine: async (verdictId: number, bailAmount: number, fineAmount: number): Promise<any> => {
    const response = await api.post(`/investigation/verdicts/${verdictId}/set_bail_fine/`, {
      bail_amount: bailAmount,
      fine_amount: fineAmount
    });
    return response.data;
  },

  requestBailPayment: (verdictId: number): string => {
    return `${api.defaults.baseURL}/investigation/verdicts/${verdictId}/request_bail_payment/`;
  },

  requestFinePayment: (verdictId: number): string => {
    return `${api.defaults.baseURL}/investigation/verdicts/${verdictId}/request_fine_payment/`;
  },

  getPendingPayments: async (): Promise<Verdict[]> => {
    const response = await api.get('/investigation/verdicts/pending_payments/');
    return response.data;
  },
};
