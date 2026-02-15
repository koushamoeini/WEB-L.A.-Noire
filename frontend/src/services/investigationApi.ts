import api from './api';
import type {
  Suspect,
  Interrogation,
  Board,
  BoardConnection,
  CreateSuspectRequest,
  CreateInterrogationRequest,
  CreateBoardConnectionRequest,
} from '../types/investigation';

export const investigationAPI = {
  // Suspects
  listSuspects: async (caseId?: number): Promise<Suspect[]> => {
    const url = caseId ? `/investigation/suspects/?case=${caseId}` : '/investigation/suspects/';
    const response = await api.get(url);
    return response.data;
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

  toggleSuspectBoard: async (id: number): Promise<{ is_on_board: boolean }> => {
    const response = await api.post(`/investigation/suspects/${id}/toggle_board/`);
    return response.data;
  },

  // Interrogations
  listInterrogations: async (): Promise<Interrogation[]> => {
    const response = await api.get('/investigation/interrogations/');
    return response.data;
  },

  createInterrogation: async (data: CreateInterrogationRequest): Promise<Interrogation> => {
    const response = await api.post('/investigation/interrogations/', data);
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
};
