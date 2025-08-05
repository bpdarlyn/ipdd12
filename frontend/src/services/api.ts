import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import type { LoginRequest, LoginResponse, UserInfo } from '../types/index';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle common errors
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Clear token and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('user_info');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.api.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  }

  async logout(): Promise<void> {
    await this.api.post('/auth/logout');
  }

  async getCurrentUser(): Promise<UserInfo> {
    const response = await this.api.get<UserInfo>('/auth/me');
    return response.data;
  }

  // Person endpoints
  async getPersons(skip = 0, limit = 100) {
    const response = await this.api.get(`/persons?skip=${skip}&limit=${limit}`);
    return response.data;
  }

  async getPerson(id: number) {
    const response = await this.api.get(`/persons/${id}`);
    return response.data;
  }

  async createPerson(person: any) {
    const response = await this.api.post('/persons', person);
    return response.data;
  }

  async updatePerson(id: number, person: any) {
    const response = await this.api.put(`/persons/${id}`, person);
    return response.data;
  }

  async deletePerson(id: number) {
    const response = await this.api.delete(`/persons/${id}`);
    return response.data;
  }

  // Report endpoints
  async getReports(skip = 0, limit = 100) {
    const response = await this.api.get(`/reports?skip=${skip}&limit=${limit}`);
    return response.data;
  }

  async getReport(id: number) {
    const response = await this.api.get(`/reports/${id}`);
    return response.data;
  }

  async createReport(report: any) {
    const response = await this.api.post('/reports', report);
    return response.data;
  }

  async updateReport(id: number, report: any) {
    const response = await this.api.put(`/reports/${id}`, report);
    return response.data;
  }

  async deleteReport(id: number) {
    const response = await this.api.delete(`/reports/${id}`);
    return response.data;
  }

  // Attachment endpoints
  async uploadAttachment(reportId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await this.api.post(`/reports/${reportId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteAttachment(reportId: number, attachmentId: number) {
    const response = await this.api.delete(`/reports/${reportId}/attachments/${attachmentId}`);
    return response.data;
  }

  async getAttachmentDownloadUrl(reportId: number, attachmentId: number) {
    const response = await this.api.get(`/reports/${reportId}/attachments/${attachmentId}/download`, {
      maxRedirects: 0,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Allow redirects
      }
    });
    return response.headers.location || response.request.responseURL;
  }

  // Health check
  async healthCheck() {
    const response = await this.api.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;