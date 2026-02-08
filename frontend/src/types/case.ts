export interface CaseComplainant {
  user: number;
  is_confirmed: boolean;
}

export interface Case {
  id: number;
  title: string;
  description: string;
  crime_level: number;
  status: string;
  status_label: string;
  level_label: string;
  creator: number;
  complainants: number[];
  complainant_details?: CaseComplainant[];
  created_at: string;
  submission_attempts: number;
  review_notes: string | null;
  scene_data?: {
    occurrence_time: string;
    location: string;
    witnesses: Array<{ phone: string; national_code: string }>;
  };
}

export interface ReviewRequest {
  approved: boolean;
  notes?: string;
  confirmed_complainants?: number[];
}

export interface CreateCaseRequest {
  title: string;
  description: string;
  crime_level: number;
}

export interface SceneWitness {
  phone: string;
  national_code: string;
}

export interface CreateCaseFromSceneRequest extends CreateCaseRequest {
  location: string;
  occurrence_time: string;
  witnesses: SceneWitness[];
}

export const CRIME_LEVELS = [
  { value: 3, label: 'سطح ۳ (جرائم خرد)' },
  { value: 2, label: 'سطح ۲ (جرائم بزرگ)' },
  { value: 1, label: 'سطح ۱ (جرائم کلان)' },
  { value: 0, label: 'سطح بحرانی' },
];

export const CASE_STATUS = {
  'PT': 'در انتظار بررسی کارآموز',
  'PO': 'در انتظار تایید افسر',
  'AC': 'در جریان',
  'PS': 'در انتظار تایید گروهبان',
  'PC': 'در انتظار تایید نهایی',
  'RE': 'نیازمند اصلاح',
  'CA': 'باطل شده',
  'SO': 'مختومه',
};
