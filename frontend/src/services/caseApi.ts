import api from './api';
import type { Case, CreateCaseRequest, CreateCaseFromSceneRequest, ReviewRequest } from '../types/case';
import type { TrialHistoryReport } from '../types/report';

export const caseAPI = {
  // List all cases
  listCases: async (): Promise<Case[]> => {
    const response = await api.get<Case[]>('/cases/');
    return response.data;
  },

  // Get single case
  getCase: async (id: number): Promise<Case> => {
    const response = await api.get<Case>(`/cases/${id}/`);
    return response.data;
  },

  // Create case from complaint (section 2.3.4)
  createCaseFromComplaint: async (data: CreateCaseRequest): Promise<Case> => {
    const response = await api.post<Case>('/cases/', data);
    return response.data;
  },

  // Create case from crime scene (section 2.3.5)
  createCaseFromScene: async (data: CreateCaseFromSceneRequest): Promise<Case> => {
    const response = await api.post<Case>('/cases/create_from_scene/', data);
    return response.data;
  },

  // Resubmit rejected case
  resubmitCase: async (id: number, data: CreateCaseRequest): Promise<Case> => {
    const response = await api.post<Case>(`/cases/${id}/resubmit/`, data);
    return response.data;
  },

  // Trainee review (section 4.2.1)
  traineeReview: async (id: number, data: ReviewRequest): Promise<{ new_status: string }> => {
    const response = await api.post(`/cases/${id}/trainee_review/`, data);
    return response.data;
  },

  // Officer review (section 4.2.1)
  officerReview: async (id: number, data: ReviewRequest): Promise<{ new_status: string }> => {
    const response = await api.post(`/cases/${id}/officer_review/`, data);
    return response.data;
  },

  // Detective submit resolution (section 4.4)
  submitResolution: async (id: number): Promise<{ status: string }> => {
    const response = await api.post(`/cases/${id}/submit_resolution/`);
    return response.data;
  },

  // Sergeant review (section 4.4)
  sergeantReview: async (id: number, data: ReviewRequest): Promise<{ status: string; new_status: string }> => {
    const response = await api.post(`/cases/${id}/sergeant_review/`, data);
    return response.data;
  },

  // Chief review for critical cases (section 5.4)
  chiefReview: async (id: number, data: ReviewRequest): Promise<{ status: string; new_status: string }> => {
    const response = await api.post(`/cases/${id}/chief_review/`, data);
    return response.data;
  },

  // Sergeant confirm arrest after pursuit (part of the new workflow)
  confirmCaseArrest: async (id: number): Promise<{ status: string; message: string }> => {
    const response = await api.post(`/cases/${id}/confirm_case_arrest/`);
    return response.data;
  },

  // Add complainant to case
  addComplainant: async (id: number, identifier: string | number): Promise<{ status: string }> => {
    const response = await api.post(`/cases/${id}/add_complainant/`, { user_id: identifier });
    return response.data;
  },

  // Section 5.7 - Aggregate report for judges/captain/chief
  getTrialHistory: async (id: number): Promise<TrialHistoryReport> => {
    const response = await api.get<TrialHistoryReport>(`/cases/${id}/trial_history/`);
    return response.data;
  },
};

export default caseAPI;
