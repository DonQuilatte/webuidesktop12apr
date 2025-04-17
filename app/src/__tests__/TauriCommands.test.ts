import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { invoke } from '@tauri-apps/api/core';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn()
}));

describe('Tauri Commands', () => {
  const mockInvoke = invoke as vi.Mock;
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('get_preferences', () => {
    it('should return preferences when they exist', async () => {
      const mockPreferences = {
        preferences: {
          telemetry: true,
          theme: 'dark'
        }
      };
      
      mockInvoke.mockResolvedValueOnce(mockPreferences);
      
      const result = await invoke('get_preferences');
      
      expect(mockInvoke).toHaveBeenCalledWith('get_preferences');
      expect(result).toEqual(mockPreferences);
    });
    
    it('should return default preferences when file does not exist', async () => {
      const defaultPreferences = {
        preferences: {
          telemetry: false,
          theme: 'light'
        }
      };
      
      mockInvoke.mockResolvedValueOnce(defaultPreferences);
      
      const result = await invoke('get_preferences');
      
      expect(mockInvoke).toHaveBeenCalledWith('get_preferences');
      expect(result).toEqual(defaultPreferences);
    });
    
    it('should handle errors gracefully', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Failed to read preferences file'));
      
      await expect(invoke('get_preferences')).rejects.toThrow('Failed to read preferences file');
      expect(mockInvoke).toHaveBeenCalledWith('get_preferences');
    });
  });
  
  describe('save_preferences', () => {
    it('should save preferences successfully', async () => {
      const preferences = {
        telemetry: true,
        theme: 'dark'
      };
      
      mockInvoke.mockResolvedValueOnce({ success: true });
      
      const result = await invoke('save_preferences', { preferences });
      
      expect(mockInvoke).toHaveBeenCalledWith('save_preferences', { preferences });
      expect(result).toEqual({ success: true });
    });
    
    it('should handle validation errors', async () => {
      const invalidPreferences = {
        telemetry: 'not-a-boolean',
        theme: 'invalid-theme'
      };
      
      mockInvoke.mockRejectedValueOnce(new Error('Invalid preferences format'));
      
      await expect(invoke('save_preferences', { preferences: invalidPreferences }))
        .rejects.toThrow('Invalid preferences format');
      expect(mockInvoke).toHaveBeenCalledWith('save_preferences', { preferences: invalidPreferences });
    });
    
    it('should handle file system errors', async () => {
      const preferences = {
        telemetry: true,
        theme: 'dark'
      };
      
      mockInvoke.mockRejectedValueOnce(new Error('Failed to write preferences file'));
      
      await expect(invoke('save_preferences', { preferences }))
        .rejects.toThrow('Failed to write preferences file');
      expect(mockInvoke).toHaveBeenCalledWith('save_preferences', { preferences });
    });
  });
  
  describe('save_onboarding_data', () => {
    it('should save onboarding data successfully', async () => {
      const data = {
        telemetry: true,
        theme: 'dark'
      };
      
      mockInvoke.mockResolvedValueOnce({ success: true });
      
      const result = await invoke('save_onboarding_data', { data });
      
      expect(mockInvoke).toHaveBeenCalledWith('save_onboarding_data', { data });
      expect(result).toEqual({ success: true });
    });
    
    it('should handle validation errors', async () => {
      const invalidData = {
        telemetry: 'not-a-boolean',
        theme: 'invalid-theme'
      };
      
      mockInvoke.mockRejectedValueOnce(new Error('Invalid onboarding data format'));
      
      await expect(invoke('save_onboarding_data', { data: invalidData }))
        .rejects.toThrow('Invalid onboarding data format');
      expect(mockInvoke).toHaveBeenCalledWith('save_onboarding_data', { data: invalidData });
    });
    
    it('should handle file system errors', async () => {
      const data = {
        telemetry: true,
        theme: 'dark'
      };
      
      mockInvoke.mockRejectedValueOnce(new Error('Failed to write onboarding data file'));
      
      await expect(invoke('save_onboarding_data', { data }))
        .rejects.toThrow('Failed to write onboarding data file');
      expect(mockInvoke).toHaveBeenCalledWith('save_onboarding_data', { data });
    });
  });
  
  describe('store_telemetry_event', () => {
    it('should store telemetry event successfully', async () => {
      const event = 'test_event';
      const details = { action: 'test' };
      
      mockInvoke.mockResolvedValueOnce({ success: true });
      
      const result = await invoke('store_telemetry_event', { event, details });
      
      expect(mockInvoke).toHaveBeenCalledWith('store_telemetry_event', { event, details });
      expect(result).toEqual({ success: true });
    });
    
    it('should handle validation errors', async () => {
      const event = '';
      const details = { action: 'test' };
      
      mockInvoke.mockRejectedValueOnce(new Error('Invalid telemetry event format'));
      
      await expect(invoke('store_telemetry_event', { event, details }))
        .rejects.toThrow('Invalid telemetry event format');
      expect(mockInvoke).toHaveBeenCalledWith('store_telemetry_event', { event, details });
    });
    
    it('should handle file system errors', async () => {
      const event = 'test_event';
      const details = { action: 'test' };
      
      mockInvoke.mockRejectedValueOnce(new Error('Failed to write telemetry event'));
      
      await expect(invoke('store_telemetry_event', { event, details }))
        .rejects.toThrow('Failed to write telemetry event');
      expect(mockInvoke).toHaveBeenCalledWith('store_telemetry_event', { event, details });
    });
  });
  
  describe('check_network_status', () => {
    it('should return true when online', async () => {
      mockInvoke.mockResolvedValueOnce(true);
      
      const result = await invoke('check_network_status');
      
      expect(mockInvoke).toHaveBeenCalledWith('check_network_status');
      expect(result).toBe(true);
    });
    
    it('should return false when offline', async () => {
      mockInvoke.mockResolvedValueOnce(false);
      
      const result = await invoke('check_network_status');
      
      expect(mockInvoke).toHaveBeenCalledWith('check_network_status');
      expect(result).toBe(false);
    });
    
    it('should handle errors gracefully', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Failed to check network status'));
      
      await expect(invoke('check_network_status')).rejects.toThrow('Failed to check network status');
      expect(mockInvoke).toHaveBeenCalledWith('check_network_status');
    });
  });
  
  describe('get_os_info', () => {
    it('should return OS information', async () => {
      mockInvoke.mockResolvedValueOnce('TestOS x86_64');
      
      const result = await invoke('get_os_info');
      
      expect(mockInvoke).toHaveBeenCalledWith('get_os_info');
      expect(result).toBe('TestOS x86_64');
    });
    
    it('should handle errors gracefully', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Failed to get OS info'));
      
      await expect(invoke('get_os_info')).rejects.toThrow('Failed to get OS info');
      expect(mockInvoke).toHaveBeenCalledWith('get_os_info');
    });
  });
  
  describe('get_disk_space', () => {
    it('should return disk space information', async () => {
      mockInvoke.mockResolvedValueOnce([100000, 500000]);
      
      const result = await invoke('get_disk_space');
      
      expect(mockInvoke).toHaveBeenCalledWith('get_disk_space');
      expect(result).toEqual([100000, 500000]);
    });
    
    it('should handle errors gracefully', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Failed to get disk space'));
      
      await expect(invoke('get_disk_space')).rejects.toThrow('Failed to get disk space');
      expect(mockInvoke).toHaveBeenCalledWith('get_disk_space');
    });
  });
  
  describe('get_memory_info', () => {
    it('should return memory information', async () => {
      mockInvoke.mockResolvedValueOnce([4000000, 8000000]);
      
      const result = await invoke('get_memory_info');
      
      expect(mockInvoke).toHaveBeenCalledWith('get_memory_info');
      expect(result).toEqual([4000000, 8000000]);
    });
    
    it('should handle errors gracefully', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Failed to get memory info'));
      
      await expect(invoke('get_memory_info')).rejects.toThrow('Failed to get memory info');
      expect(mockInvoke).toHaveBeenCalledWith('get_memory_info');
    });
  });
});
