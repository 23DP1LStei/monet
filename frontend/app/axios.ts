import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default axiosInstance;
export { axiosInstance };

// Saglabā sesiju pēc veiksmīgas autentifikācijas
export function saveSession(token: string, user: Record<string, unknown>) {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

// Notīra sesiju (logout)
export function clearSession() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
}

// Atgriež pašreizējo lietotāju no localStorage
export function getCurrentUser(): Record<string, unknown> | null {
    try {
        const raw = localStorage.getItem('user');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}