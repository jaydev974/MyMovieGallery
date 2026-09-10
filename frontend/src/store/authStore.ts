import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { api } from '../api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  rememberMe: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string, isPrivate?: boolean, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  setRememberMe: (rememberMe: boolean) => void;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    username: string;
    name: string;
    joined_date: string;
    bio?: string | null;
    location?: string | null;
    avatar_url?: string | null;
    is_private: boolean;
    is_verified: boolean;
  };
}

function mapApiUser(apiUser: AuthResponse['user']): User {
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    username: apiUser.username,
    bio: apiUser.bio || '',
    avatarColor: 'linear-gradient(135deg, #FFD700, #FF3C38)',
    favoriteGenre: '',
    favoriteActor: '',
    favoriteDirector: '',
    location: apiUser.location || undefined,
    avatarUrl: apiUser.avatar_url || undefined,
    isPrivate: apiUser.is_private,
    isVerified: apiUser.is_verified,
    joinedDate: apiUser.joined_date,
    totalWatched: 0,
    totalReviews: 0,
    totalRatings: 0,
    watchStreak: 0,
    achievements: [],
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      rememberMe: false,
      isAuthenticated: false,
      isLoading: true,
      initialize: async () => {
        set({ isLoading: true });
        try {
          const { token } = get();

          if (token) {
            try {
              const apiUser = await api.get<AuthResponse['user']>('/api/auth/me', { suppressAuthExpired: true });
              set({ user: mapApiUser(apiUser), isAuthenticated: true, isLoading: false });
              return;
            } catch {
              // Fall through and try the refresh cookie.
            }
          }

          const refreshed = await api.post<AuthResponse>('/api/auth/refresh', undefined, { suppressAuthExpired: true });
          set({
            token: refreshed.access_token,
            user: mapApiUser(refreshed.user),
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          set({ token: null, user: null, isAuthenticated: false, isLoading: false });
        }
      },

      login: async (email: string, password: string, rememberMe = false) => {
        set({ isLoading: true });
        try {
          const response = await api.post<AuthResponse>('/api/auth/login', { email, password }, { suppressAuthExpired: true });
          set({ token: response.access_token, user: mapApiUser(response.user), rememberMe, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (name: string, email: string, password: string, isPrivate = false, rememberMe = false) => {
        set({ isLoading: true });
        try {
          const response = await api.post<AuthResponse>('/api/auth/register', { name, email, password, is_private: isPrivate }, { suppressAuthExpired: true });
          set({ token: response.access_token, user: mapApiUser(response.user), rememberMe, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.post('/api/auth/logout');
        } catch {
          // Clear local state even if the remote session is already gone.
        } finally {
          set({ token: null, user: null, rememberMe: false, isAuthenticated: false, isLoading: false });
        }
      },

      updateProfile: async (updates) => {
        const currentUser = get().user;
        if (!currentUser) return;
        const apiUser = await api.put<AuthResponse['user']>('/api/auth/me', {
          name: updates.name || currentUser.name,
          bio: updates.bio ?? currentUser.bio,
          location: updates.location ?? currentUser.location,
          avatar_url: updates.avatarUrl ?? currentUser.avatarUrl ?? null,
          is_private: updates.isPrivate ?? currentUser.isPrivate,
        });
        set({
          user: {
            ...currentUser,
            ...updates,
            name: apiUser.name,
            bio: apiUser.bio || '',
            location: apiUser.location || undefined,
            avatarUrl: apiUser.avatar_url || undefined,
            isPrivate: apiUser.is_private,
            isVerified: apiUser.is_verified,
          },
        });
      },

      setRememberMe: (rememberMe: boolean) => set({ rememberMe }),
    }),
    {
      name: 'mmg-auth-v3',
      version: 4,
      partialize: (state) => ({
        rememberMe: state.rememberMe,
        token: state.rememberMe ? state.token : null,
      }),
      migrate: (persistedState: unknown) => {
        const state = persistedState as Partial<AuthState> | null;
        if (!state) return state;
        const rememberMe = state.rememberMe ?? false;
        return {
          rememberMe,
          token: rememberMe ? state.token ?? null : null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        } satisfies Partial<AuthState>;
      },
    }
  )
);

if (typeof window !== 'undefined') {
  window.addEventListener('mmg:auth-expired', () => useAuthStore.getState().logout());
}