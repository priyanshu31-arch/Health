// =============================================================================
// 🔧 API CONFIGURATION - USER APP
// =============================================================================
// Change this to your server's IP address when running on a physical device
// For Android Emulator, use: 10.0.2.2
// For iOS Simulator, use: localhost
// For physical device, use your computer's local IP (e.g., 192.168.1.X)
// =============================================================================

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Development Configuration
const DEV_CONFIG = {
    // For Web & iOS Simulator
    WEB_URL: 'http://localhost:5000',
    // For Android Emulator
    ANDROID_EMULATOR_URL: 'http://10.0.2.2:5000',
    // For Physical Device - Replace with your computer's IP
    PHYSICAL_DEVICE_URL: 'http://192.168.1.13:5000',
};

// Production Configuration (when deployed)
const PROD_CONFIG = {
    // URL: 'https://health-hub-main.onrender.com',
    URL: 'http://localhost:5000',
};

// =============================================================================
// 🌐 DETERMINE THE CORRECT BASE URL
// =============================================================================
const getBaseUrl = (): string => {
    // Check if we're in production
    // if (__DEV__ === false) {
    //     return PROD_CONFIG.URL;
    // }

    // For development, detect platform
    if (Platform.OS === 'web') {
        return DEV_CONFIG.WEB_URL;
    }

    if (Platform.OS === 'android') {
        return DEV_CONFIG.ANDROID_EMULATOR_URL;
    }

    // iOS Simulator
    if (Platform.OS === 'ios') {
        return DEV_CONFIG.WEB_URL;
    }

    // Default to physical device URL
    return DEV_CONFIG.PHYSICAL_DEVICE_URL;
};

// Hard override if needed for testing Render specifically:
// const BASE_URL_TO_USE = PROD_CONFIG.URL;
const BASE_URL_TO_USE = getBaseUrl();

// =============================================================================
// 📡 API CONFIGURATION
// =============================================================================
export const API_BASE_URL = BASE_URL_TO_USE;
export const SOCKET_URL = BASE_URL_TO_USE; // Socket server usually runs on same base URL

// =============================================================================
// 🔐 AUTH TOKEN MANAGEMENT
// =============================================================================
let authToken: string | null = null;

export const setAuthToken = (token: string | null): void => {
    authToken = token;
};

export const getAuthToken = (): string | null => authToken;

// =============================================================================
// 🌐 FETCH WRAPPER
// =============================================================================
interface FetchOptions extends RequestInit {
    authenticated?: boolean;
}

const fetchApi = async <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
    const { authenticated = true, ...fetchOptions } = options;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(fetchOptions.headers as Record<string, string> || {}),
    };

    if (authenticated) {
        // Use in-memory token first, then fallback to storage
        const token = authToken || await AsyncStorage.getItem('token');
        if (token) {
            headers['x-auth-token'] = token;
        } else {
            console.warn('🗝️ Authenticated request attempted without token.');
            throw new Error('No authentication token found. Please log in again.');
        }
    }

    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`📤 API Request: ${fetchOptions.method || 'GET'} ${url}`);

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 60000); // 60s timeout for Render cold starts

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            headers,
            signal: controller.signal,
        });
        clearTimeout(id);

        console.log(`📥 API Response: ${response.status} ${url}`);

        if (!response.ok) {
            const text = await response.text();
            let errorMessage = `HTTP error! status: ${response.status}`;

            if (response.status === 401) {
                // TOKEN EXPIRED OR INVALID
                console.warn('⚠️ Authentication token invalid. Clearing session and redirecting.');
                await AsyncStorage.multiRemove(['token', 'user']);

                // Force a page reload on web to trigger AuthContext logout logic
                if (Platform.OS === 'web') {
                    window.location.href = '/login';
                }

                errorMessage = 'Your session has expired. Please log in again.';
            }

            try {
                const errorData = JSON.parse(text);
                errorMessage = errorData.msg || errorMessage;
            } catch (e) {
                if (text && text.length < 100) errorMessage = text;
            }

            throw new Error(errorMessage);
        }

        // Handle empty responses
        const text = await response.text();
        if (!text) return {} as T;

        return JSON.parse(text) as T;
    } catch (error: any) {
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. The server might be waking up (cold start). Please try again in a moment.');
        }
        console.error('❌ API Error:', error);
        throw error;
    }
};

// =============================================================================
// 🏥 API TYPES
// =============================================================================
interface LoginCredentials {
    email: string;
    password: string;
}

interface SignupData {
    name?: string;
    email: string;
    password: string;
    hospitalName?: string;
    profilePhoto?: string;
}

interface AuthResponse {
    token: string;
    role: string;
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        hospitalName?: string;
        profilePhoto?: string;
    };
}

interface BedBookingData {
    bookingType: 'bed' | 'ambulance';
    itemId: string;
    hospital: string;
    patientName: string;
    contactNumber: string;
    isOffline?: boolean;
}

interface AmbulanceBookingData {
    pickupLat: number;
    pickupLon: number;
    hospitalId: string;
    patientName?: string;
    contactNumber?: string;
    pickupAddress?: string;
}

interface Hospital {
    _id: string;
    name: string;
    photo?: string;
    bio?: string;
    rating?: number;
    address?: string;
    latitude?: number;
    longitude?: number;
}

interface Ambulance {
    _id: string;
    ambulanceNumber: string;
    isAvailable: boolean;
    hospital: string;
    status?: string;
    currentLocation?: {
        type: string;
        coordinates: number[];
    };
}

interface Bed {
    _id: string;
    bedNumber: string;
    isAvailable: boolean;
    hospital: string;
}

interface HospitalDetails {
    hospital: Hospital;
    beds: Bed[];
    ambulances: Ambulance[];
}

interface AmbulanceStatus {
    _id: string;
    currentLocation: { type: string; coordinates: number[] };
    status: string;
}

// =============================================================================
// 🏥 API METHODS
// =============================================================================
export const api = {
    // ==========================================================================
    // 🔐 AUTHENTICATION
    // ==========================================================================

    /**
     * Login user and get JWT token
     */
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const data = await fetchApi<AuthResponse>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
            authenticated: false,
        });
        if (data.token) {
            setAuthToken(data.token);
        }
        return data;
    },

    /**
     * Register new user
     */
    signup: async (userData: SignupData): Promise<AuthResponse> => {
        const data = await fetchApi<AuthResponse>('/api/auth/signup', {
            method: 'POST',
            body: JSON.stringify(userData),
            authenticated: false,
        });
        if (data.token) {
            setAuthToken(data.token);
        }
        return data;
    },

    /**
     * Request a password reset OTP
     */
    forgotPassword: async (email: string): Promise<{ msg: string; otp?: string }> => {
        return fetchApi('/api/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
            authenticated: false,
        });
    },

    /**
     * Verify the OTP sent to email
     */
    verifyOTP: async (email: string, otp: string): Promise<{ msg: string }> => {
        return fetchApi('/api/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify({ email, otp }),
            authenticated: false,
        });
    },

    /**
     * Reset password using OTP
     */
    resetPassword: async (data: { email: string; otp: string; newPassword: string }): Promise<{ msg: string }> => {
        return fetchApi('/api/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify(data),
            authenticated: false,
        });
    },

    /**
     * Logout - clear token
     */
    logout: (): void => {
        setAuthToken(null);
    },

    // ==========================================================================
    // 🏥 HOSPITALS
    // ==========================================================================

    /**
     * Get all hospitals
     */
    getHospitals: async (): Promise<Hospital[]> => {
        return fetchApi<Hospital[]>('/api/hospitals', { authenticated: false });
    },

    /**
     * Get single hospital with beds and ambulances
     */
    getHospitalDetails: async (hospitalId: string): Promise<HospitalDetails> => {
        return fetchApi<HospitalDetails>(`/api/hospitals/${hospitalId}`, { authenticated: false });
    },

    // ==========================================================================
    // 🛏️ BEDS
    // ==========================================================================

    /**
     * Get all beds
     */
    getBeds: async (): Promise<Bed[]> => {
        return fetchApi<Bed[]>('/api/beds', { authenticated: false });
    },

    /**
     * Book a bed
     */
    bookBed: async (bookingData: BedBookingData): Promise<unknown> => {
        return fetchApi('/api/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData),
        });
    },

    /**
     * Update bed status (Admin)
     */
    updateBedStatus: async (bedId: string, isAvailable: boolean): Promise<Bed> => {
        return fetchApi<Bed>(`/api/beds/${bedId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ isAvailable }),
        });
    },

    // ==========================================================================
    // 🚑 AMBULANCES
    // ==========================================================================

    /**
     * Get all ambulances
     */
    getAmbulances: async (hospitalId?: string, isAvailable?: boolean): Promise<Ambulance[]> => {
        let url = '/api/ambulances';
        const params: string[] = [];
        if (hospitalId) params.push(`hospital=${hospitalId}`);
        if (isAvailable !== undefined) params.push(`isAvailable=${isAvailable}`);

        if (params.length > 0) {
            url += `?${params.join('&')}`;
        }

        return fetchApi<Ambulance[]>(url, { authenticated: false });
    },

    /**
     * Book an ambulance
     */
    bookAmbulance: async (bookingData: AmbulanceBookingData & { ambulanceId?: string }): Promise<Ambulance> => {
        return fetchApi<Ambulance>('/api/ambulance/book', {
            method: 'POST',
            body: JSON.stringify(bookingData),
        });
    },

    /**
     * Get ambulance status (for tracking)
     */
    getAmbulanceStatus: async (ambulanceId: string): Promise<AmbulanceStatus> => {
        return fetchApi<AmbulanceStatus>(`/api/ambulance/status/${ambulanceId}`);
    },

    /**
     * Update ambulance status (Admin)
     */
    updateAmbulanceStatus: async (ambulanceId: string, isAvailable: boolean): Promise<Ambulance> => {
        return fetchApi<Ambulance>(`/api/ambulances/${ambulanceId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ isAvailable }),
        });
    },

    // ==========================================================================
    // 📋 BOOKINGS
    // ==========================================================================

    /**
     * Chat with AI Bot
     */
    chatWithBot: async (message: string): Promise<{ reply: string }> => {
        return fetchApi<{ reply: string }>('/api/chat', {
            method: 'POST',
            body: JSON.stringify({ message }),
            authenticated: false
        });
    },

    /**
     * Get all bookings for current user
     */
    getMyBookings: async (): Promise<any[]> => {
        return fetchApi<any[]>('/api/bookings/my');
    },

    /**
     * Get all bookings (admin view)
     */
    getBookings: async (): Promise<unknown[]> => {
        return fetchApi<unknown[]>('/api/bookings');
    },

    // ==========================================================================
    // 🔧 ADMIN METHODS
    // ==========================================================================

    /**
     * Get logged-in user's hospital
     */
    getMyHospital: async (): Promise<HospitalDetails> => {
        return fetchApi<HospitalDetails>('/api/hospitals/me');
    },

    /**
     * Register a new hospital
     */
    registerHospital: async (data: Partial<Hospital>): Promise<Hospital> => {
        return fetchApi<Hospital>('/api/hospitals', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    updateHospital: async (id: string, data: Partial<Hospital>): Promise<Hospital> => {
        return fetchApi<Hospital>(`/api/hospitals/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    /**
     * Add a new bed
     */
    addBed: async (data: { bedNumber: string; isAvailable: boolean; hospital: string }): Promise<Bed> => {
        return fetchApi<Bed>('/api/beds', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Add a new ambulance
     */
    addAmbulance: async (data: { ambulanceNumber: string; isAvailable: boolean; hospital: string }): Promise<Ambulance> => {
        return fetchApi<Ambulance>('/api/ambulances', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    deleteBed: async (id: string): Promise<unknown> => {
        return fetchApi(`/api/beds/${id}`, { method: 'DELETE' });
    },

    deleteAmbulance: async (id: string): Promise<unknown> => {
        return fetchApi(`/api/ambulances/${id}`, { method: 'DELETE' });
    },

    // Get all bookings (admin view) - assuming there's an endpoint or filtering on GET /bookings
    getAllBookings: async (): Promise<any[]> => {
        return fetchApi<any[]>('/api/bookings');
    },

    deleteBooking: async (id: string): Promise<unknown> => {
        return fetchApi(`/api/bookings/${id}`, { method: 'DELETE' });
    },

    // ==========================================================================
    // 👤 PROFILE
    // ==========================================================================

    /**
     * Upload an image to the server
     */
    uploadImage: async (formData: FormData): Promise<{ url: string }> => {
        const token = await AsyncStorage.getItem('token');

        try {
            // Use standard fetch for multipart uploads to avoid fetchApi's JSON enforcement
            const response = await fetch(`${API_BASE_URL}/api/upload`, {
                method: 'POST',
                body: formData,
                headers: {
                    'x-auth-token': token || '',
                    // Note: Do NOT set 'Content-Type': 'multipart/form-data' manually.
                }
            });

            const text = await response.text();
            let json;
            try {
                json = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse upload response:', text);
                throw new Error('Server returned an invalid response during upload.');
            }

            if (!response.ok) {
                console.error('Upload Error Original:', json);
                throw new Error(json.msg || json.message || 'Upload failed');
            }
            return json;
        } catch (error: any) {
            console.error('Upload Image Exception:', error);
            throw error;
        }
    },

    /**
     * Update user profile
     */
    updateProfile: async (data: {
        name?: string;
        email?: string;
        profilePhoto?: string;
        age?: string;
        location?: string;
        phone?: string;
    }): Promise<AuthResponse['user']> => {
        return fetchApi<AuthResponse['user']>('/api/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    /**
     * Get current user profile
     */
    getProfile: async (): Promise<AuthResponse['user']> => {
        return fetchApi<AuthResponse['user']>('/api/auth/me');
    },

    // ==========================================================================
    // 🔍 NEW MODULES: DOCTORS, TIPS, RECORDS, DISEASES
    // ==========================================================================

    getDoctors: async (params?: { specialty?: string; hospital?: string }): Promise<any[]> => {
        let url = '/api/doctors';
        if (params) {
            const query = new URLSearchParams(params as any).toString();
            if (query) url += `?${query}`;
        }
        return fetchApi<any[]>(url, { authenticated: false });
    },

    getHealthTips: async (): Promise<any[]> => {
        return fetchApi<any[]>('/api/health-tips', { authenticated: false });
    },

    getHealthRecords: async (): Promise<any[]> => {
        return fetchApi<any[]>('/api/health-records');
    },

    getDiseases: async (search?: string): Promise<any[]> => {
        let url = '/api/diseases';
        if (search) url += `?search=${encodeURIComponent(search)}`;
        return fetchApi<any[]>(url, { authenticated: false });
    },
};

// Export default
export default api;
