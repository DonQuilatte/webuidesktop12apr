/**
 * API service for backend communication
 * Handles all HTTP requests to the backend API and local storage via Tauri
 */
import { invoke } from '@tauri-apps/api/core';

const API_BASE_URL = 'http://127.0.0.1:5002';

export interface Preferences {
  telemetry: boolean;
  theme: 'light' | 'dark';
}

export interface TelemetryEvent {
  event: string;
  details: Record<string, unknown>;
}

/**
 * Fetch preferences from local storage via Tauri
 */
export const fetchPreferences = async (): Promise<Preferences> => {
  try {
    const result = await invoke<{ preferences: Preferences | null }>('get_preferences');
    
    if (result?.preferences) {
      return result.preferences;
    }
    
    return {
      telemetry: false,
      theme: 'light'
    };
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return {
      telemetry: false,
      theme: 'light'
    };
  }
};

/**
 * Save preferences to local storage via Tauri
 */
export const savePreferences = async (preferences: Preferences): Promise<{ success: boolean }> => {
  try {
    return await invoke<{ success: boolean }>('save_preferences', { preferences });
  } catch (error) {
    console.error('Error saving preferences:', error);
    throw error;
  }
};

/**
 * Save onboarding data to local storage via Tauri
 */
export const saveOnboardingData = async (data: Preferences): Promise<{ success: boolean }> => {
  try {
    return await invoke<{ success: boolean }>('save_onboarding_data', { data });
  } catch (error) {
    console.error('Error saving onboarding data:', error);
    throw error;
  }
};

/**
 * Submit telemetry event to the backend if online, otherwise queue for later
 */
export const submitTelemetry = async (
  event: string, 
  details: Record<string, unknown> = {}
): Promise<{ success: boolean }> => {
  try {
    const isOnline = await invoke<boolean>('check_network_status');
    
    if (isOnline) {
      try {
        const response = await fetch(`${API_BASE_URL}/telemetry`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ event, details }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to submit telemetry: ${response.status} ${response.statusText}`);
        }
        
        return { success: true };
      } catch (error) {
        console.warn('Backend telemetry failed, storing locally:', error);
        return await invoke<{ success: boolean }>('store_telemetry_event', { event, details });
      }
    } else {
      return await invoke<{ success: boolean }>('store_telemetry_event', { event, details });
    }
  } catch (error) {
    console.error('Error submitting telemetry:', error);
    return { success: false };
  }
};

/**
 * Check health status of the backend
 */
export const checkHealth = async (): Promise<{ status: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking health:', error);
    throw error;
  }
};
