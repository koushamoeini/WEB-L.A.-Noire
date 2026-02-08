export interface User {
  id: number;
  username: string;
  email: string;
  is_superuser?: boolean;
  roles?: Role[];
}

export interface Role {
  id: number;
  code: string;
  name: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  phone: string;
  national_code: string;
}

export interface RegisterResponse {
  id: number;
  username: string;
  access: string;
  refresh: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  id: number;
  username: string;
  is_superuser: boolean;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}
