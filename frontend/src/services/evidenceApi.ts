import api from './api';
import type {
  Evidence,
  WitnessTestimony,
  BiologicalEvidence,
  VehicleEvidence,
  IdentificationDocument,
  OtherEvidence,
  CreateWitnessTestimonyRequest,
  CreateBiologicalEvidenceRequest,
  CreateVehicleEvidenceRequest,
  CreateIdentificationDocumentRequest,
  CreateOtherEvidenceRequest,
} from '../types/evidence';

export interface VerifyBiologicalEvidenceRequest {
  medical_follow_up?: string;
  database_follow_up?: string;
}

export const evidenceAPI = {
  // List all evidence (optionally filtered by case)
  listAllEvidence: async (caseId?: number): Promise<Evidence[]> => {
    const url = caseId ? `/evidence/all/?case=${caseId}` : '/evidence/all/';
    const response = await api.get(url);
    return response.data;
  },

  // Witness Testimony
  listWitnessTestimonies: async (caseId?: number): Promise<WitnessTestimony[]> => {
    const url = caseId ? `/evidence/witness/?case=${caseId}` : '/evidence/witness/';
    const response = await api.get(url);
    return response.data;
  },

  getWitnessTestimony: async (id: number): Promise<WitnessTestimony> => {
    const response = await api.get(`/evidence/witness/${id}/`);
    return response.data;
  },

  updateWitnessTestimony: async (id: number, data: Partial<CreateWitnessTestimonyRequest>): Promise<WitnessTestimony> => {
    const formData = new FormData();
    if (data.case) formData.append('case', data.case.toString());
    if (data.title) formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.transcript) formData.append('transcript', data.transcript);
    if (data.media) formData.append('media', data.media);

    const response = await api.patch(`/evidence/witness/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  createWitnessTestimony: async (data: CreateWitnessTestimonyRequest): Promise<WitnessTestimony> => {
    const formData = new FormData();
    formData.append('case', data.case.toString());
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('transcript', data.transcript);
    if (data.media) {
      formData.append('media', data.media);
    }

    const response = await api.post('/evidence/witness/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Biological Evidence
  listBiologicalEvidence: async (caseId?: number): Promise<BiologicalEvidence[]> => {
    const url = caseId ? `/evidence/biological/?case=${caseId}` : '/evidence/biological/';
    const response = await api.get(url);
    return response.data;
  },

  createBiologicalEvidence: async (data: CreateBiologicalEvidenceRequest): Promise<BiologicalEvidence> => {
    const response = await api.post('/evidence/biological/', data);
    return response.data;
  },

  getBiologicalEvidence: async (id: number): Promise<BiologicalEvidence> => {
    const response = await api.get(`/evidence/biological/${id}/`);
    return response.data;
  },

  updateBiologicalEvidence: async (id: number, data: Partial<BiologicalEvidence>): Promise<BiologicalEvidence> => {
    const response = await api.patch(`/evidence/biological/${id}/`, data);
    return response.data;
  },

  // Forensic doctor verification
  verifyBiologicalEvidence: async (
    id: number,
    data: VerifyBiologicalEvidenceRequest
  ): Promise<{ status: string; id: number }> => {
    const response = await api.post(`/evidence/biological/${id}/verify/`, data);
    return response.data;
  },

  // Vehicle Evidence
  listVehicleEvidence: async (caseId?: number): Promise<VehicleEvidence[]> => {
    const url = caseId ? `/evidence/vehicle/?case=${caseId}` : '/evidence/vehicle/';
    const response = await api.get(url);
    return response.data;
  },

  createVehicleEvidence: async (data: CreateVehicleEvidenceRequest): Promise<VehicleEvidence> => {
    const response = await api.post('/evidence/vehicle/', data);
    return response.data;
  },

  getVehicleEvidence: async (id: number): Promise<VehicleEvidence> => {
    const response = await api.get(`/evidence/vehicle/${id}/`);
    return response.data;
  },

  updateVehicleEvidence: async (id: number, data: Partial<VehicleEvidence>): Promise<VehicleEvidence> => {
    const response = await api.patch(`/evidence/vehicle/${id}/`, data);
    return response.data;
  },

  // Identification Documents
  listIdentificationDocuments: async (caseId?: number): Promise<IdentificationDocument[]> => {
    const url = caseId ? `/evidence/id-document/?case=${caseId}` : '/evidence/id-document/';
    const response = await api.get(url);
    return response.data;
  },

  createIdentificationDocument: async (data: CreateIdentificationDocumentRequest): Promise<IdentificationDocument> => {
    const response = await api.post('/evidence/id-document/', data);
    return response.data;
  },

  getIdentificationDocument: async (id: number): Promise<IdentificationDocument> => {
    const response = await api.get(`/evidence/id-document/${id}/`);
    return response.data;
  },

  updateIdentificationDocument: async (id: number, data: Partial<IdentificationDocument>): Promise<IdentificationDocument> => {
    const response = await api.patch(`/evidence/id-document/${id}/`, data);
    return response.data;
  },

  // Other Evidence
  listOtherEvidence: async (caseId?: number): Promise<OtherEvidence[]> => {
    const url = caseId ? `/evidence/other/?case=${caseId}` : '/evidence/other/';
    const response = await api.get(url);
    return response.data;
  },

  createOtherEvidence: async (data: CreateOtherEvidenceRequest): Promise<OtherEvidence> => {
    const response = await api.post('/evidence/other/', data);
    return response.data;
  },

  getOtherEvidence: async (id: number): Promise<OtherEvidence> => {
    const response = await api.get(`/evidence/other/${id}/`);
    return response.data;
  },

  updateOtherEvidence: async (id: number, data: Partial<OtherEvidence>): Promise<OtherEvidence> => {
    const response = await api.patch(`/evidence/other/${id}/`, data);
    return response.data;
  },

  // Toggle evidence on board
  toggleBoard: async (type: string, id: number): Promise<{ is_on_board: boolean }> => {
    const response = await api.post(`/evidence/${type}/${id}/toggle_board/`);
    return response.data;
  },

  // Upload images to evidence
  uploadImages: async (type: string, id: number, images: File[]): Promise<void> => {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append('images', image);
    });

    await api.post(`/evidence/${type}/${id}/upload_image/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Delete evidence
  deleteEvidence: async (type: string, id: number): Promise<void> => {
    // Correct type mapping since andpoints are /witness/, /biological/, etc.
    // The 'type' passed from front might be 'witness', 'biological', 'vehicle', 'identification', 'other'
    let endpoint = type;
    if (type === 'identification') endpoint = 'id-document';
    
    await api.delete(`/evidence/${endpoint}/${id}/`);
  },
};
