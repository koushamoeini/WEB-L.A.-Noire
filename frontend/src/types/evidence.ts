export interface Evidence {
  id: number;
  case: number;
  title: string;
  description: string;
  recorded_at: string;
  recorder: number;
  recorder_name: string;
  is_on_board: boolean;
  type_display: string;
  images?: EvidenceImage[];
}

export interface EvidenceImage {
  id: number;
  image: string;
}

export interface WitnessTestimony extends Evidence {
  transcript: string;
  media?: File | string;
}

export interface BiologicalEvidence extends Evidence {
  is_verified: boolean;
  medical_follow_up?: string;
  database_follow_up?: string;
}

export interface VehicleEvidence extends Evidence {
  model_name: string;
  color: string;
  license_plate?: string;
  serial_number?: string;
}

export interface IdentificationDocument extends Evidence {
  owner_full_name: string;
  extra_info?: Record<string, any>;
}

export interface OtherEvidence extends Evidence {}

// Request types for creating evidence
export interface CreateWitnessTestimonyRequest {
  case: number;
  title: string;
  description: string;
  transcript: string;
  media?: File;
}

export interface CreateBiologicalEvidenceRequest {
  case: number;
  title: string;
  description: string;
  is_verified?: boolean;
  medical_follow_up?: string;
  database_follow_up?: string;
}

export interface CreateVehicleEvidenceRequest {
  case: number;
  title: string;
  description: string;
  model_name: string;
  color: string;
  license_plate?: string;
  serial_number?: string;
}

export interface CreateIdentificationDocumentRequest {
  case: number;
  title: string;
  description: string;
  owner_full_name: string;
  extra_info?: Record<string, any>;
}

export interface CreateOtherEvidenceRequest {
  case: number;
  title: string;
  description: string;
}

export const EVIDENCE_TYPES = {
  WITNESS: 'witness',
  BIOLOGICAL: 'biological',
  VEHICLE: 'vehicle',
  ID_DOCUMENT: 'id-document',
  OTHER: 'other',
} as const;

export const EVIDENCE_TYPE_LABELS: Record<string, string> = {
  [EVIDENCE_TYPES.WITNESS]: 'استشهاد شاهد',
  [EVIDENCE_TYPES.BIOLOGICAL]: 'شواهد زیستی و پزشکی',
  [EVIDENCE_TYPES.VEHICLE]: 'وسایل نقلیه',
  [EVIDENCE_TYPES.ID_DOCUMENT]: 'مدارک شناسایی',
  [EVIDENCE_TYPES.OTHER]: 'سایر موارد',
};
