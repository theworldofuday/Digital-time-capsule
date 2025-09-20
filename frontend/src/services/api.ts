import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  User, 
  TimeCapsule, 
  LoginCredentials, 
  RegisterData, 
  CreateCapsuleData,
  CapsuleListResponse 
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Helper method to handle responses
  private handleResponse<T>(response: AxiosResponse<T>): T {
    return response.data;
  }

  // Auth API
  public authApi = {
    login: async (credentials: LoginCredentials) => {
      console.log('API: Sending login request with:', credentials);
      const response = await this.client.post('/auth/login', credentials);
      console.log('API: Login response:', response);
      return this.handleResponse(response);
    },

    register: async (userData: RegisterData) => {
      const response = await this.client.post('/auth/register', userData);
      return this.handleResponse(response);
    },

    verifyToken: async (token: string) => {
      const response = await this.client.get('/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return this.handleResponse(response);
    },

    getProfile: async () => {
      const response = await this.client.get('/auth/profile');
      return this.handleResponse(response);
    },

    updateProfile: async (userData: Partial<User>) => {
      const response = await this.client.put('/auth/profile', userData);
      return this.handleResponse(response);
    },

    logout: async () => {
      const response = await this.client.post('/auth/logout');
      return this.handleResponse(response);
    }
  };

  // Capsules API
  public capsulesApi = {
    getAll: async (params?: {
      page?: number;
      limit?: number;
      category?: string;
      status?: string;
      sort?: string;
      search?: string;
    }): Promise<CapsuleListResponse> => {
      const response = await this.client.get('/capsules', { params });
      return this.handleResponse(response);
    },

    getById: async (id: string): Promise<TimeCapsule> => {
      const response = await this.client.get(`/capsules/${id}`);
      return this.handleResponse(response);
    },

    create: async (capsuleData: CreateCapsuleData) => {
      const formData = new FormData();
      
      // Append text fields
      formData.append('title', capsuleData.title);
      formData.append('description', capsuleData.description);
      formData.append('revealDate', capsuleData.revealDate);
      formData.append('category', capsuleData.category);
      formData.append('isPublic', capsuleData.isPublic.toString());
      
      if (capsuleData.message) {
        formData.append('message', capsuleData.message);
      }
      
      // Append tags
      capsuleData.tags.forEach(tag => {
        formData.append('tags[]', tag);
      });
      
      // Append files
      if (capsuleData.files) {
        capsuleData.files.forEach(file => {
          formData.append('files', file);
        });
      }

      const response = await this.client.post('/capsules', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return this.handleResponse(response);
    },

    like: async (id: string) => {
      const response = await this.client.post(`/capsules/${id}/like`);
      return this.handleResponse(response);
    },

    addComment: async (id: string, text: string) => {
      const response = await this.client.post(`/capsules/${id}/comments`, { text });
      return this.handleResponse(response);
    },

    getUserCapsules: async (params?: { page?: number; limit?: number }) => {
      const response = await this.client.get('/capsules/user/my-capsules', { params });
      return this.handleResponse(response);
    },

    delete: async (id: string) => {
      const response = await this.client.delete(`/capsules/${id}`);
      return this.handleResponse(response);
    }
  };

  // Users API
  public usersApi = {
    getProfile: async (username: string) => {
      const response = await this.client.get(`/users/${username}`);
      return this.handleResponse(response);
    },

    getLeaderboard: async (limit?: number) => {
      const response = await this.client.get('/users/leaderboard/top', {
        params: { limit }
      });
      return this.handleResponse(response);
    }
  };
}

const apiService = new ApiService();

export const { authApi, capsulesApi, usersApi } = apiService;
export default apiService;