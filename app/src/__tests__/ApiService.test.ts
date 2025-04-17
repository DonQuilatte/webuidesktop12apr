import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import {
  fetchPreferences,
  savePreferences,
  saveOnboardingData,
  submitTelemetry,
  checkHealth
} from '../services/api';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

// Mock global fetch
global.fetch = vi.fn();

describe('API Service', () => {
  const mockInvoke = invoke as vi.Mock;
  const mockFetch = global.fetch as vi.Mock;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockInvoke.mockImplementation((cmd: string) => {
      switch (cmd) {
        case 'get_preferences':
          return Promise.resolve({ 
            preferences: { telemetry: false, theme: 'light' } 
          });
        case 'save_preferences':
          return Promise.resolve({ success: true });
        case 'save_onboarding_data':
          return Promise.resolve({ success: true });
        case 'store_telemetry_event':
          return Promise.resolve({ success: true });
        case 'check_network_status':
          return Promise.resolve(true);
        default:
          return Promise.resolve({ success: true });
      }
    });
    
    mockFetch.mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'ok' })
      })
    );
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('fetchPreferences', () => {
    it('should fetch preferences successfully', async () => {
      const result = await fetchPreferences();
      
      expect(mockInvoke).toHaveBeenCalledWith('get_preferences');
      expect(result).toEqual({ telemetry: false, theme: 'light' });
    });
    
    it('should return default preferences when no preferences are found', async () => {
      mockInvoke.mockResolvedValueOnce({ preferences: null });
      
      const result = await fetchPreferences();
      
      expect(mockInvoke).toHaveBeenCalledWith('get_preferences');
      expect(result).toEqual({ telemetry: false, theme: 'light' });
    });
    
    it('should return default preferences on error', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Failed to get preferences'));
      
      const result = await fetchPreferences();
      
      expect(mockInvoke).toHaveBeenCalledWith('get_preferences');
      expect(result).toEqual({ telemetry: false, theme: 'light' });
    });
  });
  
  describe('savePreferences', () => {
    it('should save preferences successfully', async () => {
      const preferences = { telemetry: true, theme: 'dark' };
      
      const result = await savePreferences(preferences);
      
      expect(mockInvoke).toHaveBeenCalledWith('save_preferences', { preferences });
      expect(result).toEqual({ success: true });
    });
    
    it('should throw error when save fails', async () => {
      const preferences = { telemetry: true, theme: 'dark' };
      mockInvoke.mockRejectedValueOnce(new Error('Failed to save preferences'));
      
      await expect(savePreferences(preferences)).rejects.toThrow('Failed to save preferences');
      expect(mockInvoke).toHaveBeenCalledWith('save_preferences', { preferences });
    });
  });
  
  describe('saveOnboardingData', () => {
    it('should save onboarding data successfully', async () => {
      const data = { telemetry: true, theme: 'dark' };
      
      const result = await saveOnboardingData(data);
      
      expect(mockInvoke).toHaveBeenCalledWith('save_onboarding_data', { data });
      expect(result).toEqual({ success: true });
    });
    
    it('should throw error when save fails', async () => {
      const data = { telemetry: true, theme: 'dark' };
      mockInvoke.mockRejectedValueOnce(new Error('Failed to save onboarding data'));
      
      await expect(saveOnboardingData(data)).rejects.toThrow('Failed to save onboarding data');
      expect(mockInvoke).toHaveBeenCalledWith('save_onboarding_data', { data });
    });
  });
  
  describe('submitTelemetry', () => {
    it('should submit telemetry to backend when online', async () => {
      mockInvoke.mockResolvedValueOnce(true); // check_network_status
      
      const event = 'test_event';
      const details = { action: 'test' };
      
      const result = await submitTelemetry(event, details);
      
      expect(mockInvoke).toHaveBeenCalledWith('check_network_status');
      expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:5002/telemetry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ event, details }),
      });
      expect(result).toEqual({ success: true });
    });
    
    it('should store telemetry locally when offline', async () => {
      mockInvoke.mockResolvedValueOnce(false); // check_network_status
      
      const event = 'test_event';
      const details = { action: 'test' };
      
      const result = await submitTelemetry(event, details);
      
      expect(mockInvoke).toHaveBeenCalledWith('check_network_status');
      expect(mockInvoke).toHaveBeenCalledWith('store_telemetry_event', { event, details });
      expect(mockFetch).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
    
    it('should store telemetry locally when backend request fails', async () => {
      mockInvoke.mockResolvedValueOnce(true); // check_network_status
      mockFetch.mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        })
      );
      
      const event = 'test_event';
      const details = { action: 'test' };
      
      const result = await submitTelemetry(event, details);
      
      expect(mockInvoke).toHaveBeenCalledWith('check_network_status');
      expect(mockFetch).toHaveBeenCalled();
      expect(mockInvoke).toHaveBeenCalledWith('store_telemetry_event', { event, details });
      expect(result).toEqual({ success: true });
    });
    
    it('should handle network errors gracefully', async () => {
      mockInvoke.mockResolvedValueOnce(true); // check_network_status
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      const event = 'test_event';
      const details = { action: 'test' };
      
      const result = await submitTelemetry(event, details);
      
      expect(mockInvoke).toHaveBeenCalledWith('check_network_status');
      expect(mockFetch).toHaveBeenCalled();
      expect(mockInvoke).toHaveBeenCalledWith('store_telemetry_event', { event, details });
      expect(result).toEqual({ success: true });
    });
    
    it('should return failure status on error', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Failed to check network status'));
      
      const event = 'test_event';
      const details = { action: 'test' };
      
      const result = await submitTelemetry(event, details);
      
      expect(mockInvoke).toHaveBeenCalledWith('check_network_status');
      expect(result).toEqual({ success: false });
    });
  });
  
  describe('checkHealth', () => {
    it('should check health successfully', async () => {
      mockFetch.mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'healthy' })
        })
      );
      
      const result = await checkHealth();
      
      expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:5002/health');
      expect(result).toEqual({ status: 'healthy' });
    });
    
    it('should throw error when health check fails', async () => {
      mockFetch.mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        })
      );
      
      await expect(checkHealth()).rejects.toThrow('Health check failed: 500 Internal Server Error');
      expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:5002/health');
    });
    
    it('should throw error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      await expect(checkHealth()).rejects.toThrow('Network error');
      expect(mockFetch).toHaveBeenCalledWith('http://127.0.0.1:5002/health');
    });
  });
});
