/**
 * API Service Helper
 * Provides utility functions for making API calls to the Django backend
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_CONFIG } from './apiConfig';

class APIService {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      ...API_CONFIG,
    });

    // Add interceptor to include auth token in requests
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          console.error('Unauthorized access');
        }
        return Promise.reject(error);
      }
    );

    // Load token from localStorage on initialization (client-side only)
    if (typeof window !== 'undefined') {
      this.loadToken();
    }
  }

  /**
   * Set authentication token
   */
  setToken(token: string) {
    this.token = token;
    // Only save to localStorage in browser environment
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  /**
   * Load token from localStorage
   */
  private loadToken() {
    // Only load from localStorage in browser environment
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        this.token = token;
      }
    }
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    this.token = null;
    // Only clear from localStorage in browser environment
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }

  /**
   * Generic GET request
   */
  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(endpoint, config);
    return response.data;
  }

  /**
   * Generic POST request
   */
  async post<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(endpoint, data, config);
    return response.data;
  }

  /**
   * Generic PUT request
   */
  async put<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(endpoint, data, config);
    return response.data;
  }

  /**
   * Generic PATCH request
   */
  async patch<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(endpoint, data, config);
    return response.data;
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(endpoint, config);
    return response.data;
  }

  /**
   * Login with credentials
   */
  async login(username: string, password: string) {
    const response = await this.post<{ access: string; refresh?: string }>('/api/auth/login/', {
      username,
      password,
    });
    if (response.access) {
      this.setToken(response.access);
    }
    return response;
  }

  /**
   * Logout
   */
  logout() {
    this.clearToken();
  }
}

// Export singleton instance
export const apiService = new APIService();
export default apiService;
