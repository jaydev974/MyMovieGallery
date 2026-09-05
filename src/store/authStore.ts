import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

const MOCK_USER: User = {
  id: 'user-1',
  name: 'Alex Cinema',
  email: 'alex@mymoviegallery.com',
  username: 'alexcinema',
  bio: 'Movie enthusiast. Collector of cinematic masterpieces. Living frame by frame.',
  avatarColor: 'linear-gradient(135deg, #FFD700, #FF3C38)',
  favoriteGenre: 'Sci-Fi',
  favoriteActor: 'Leonardo DiCaprio',
  favoriteDirector: 'Christopher Nolan',
  joinedDate: '2023-01-15',
  location: 'Los Angeles, CA',
  website: 'https://mymoviegallery.com',
  achievements: [
    { id: 'a1', name: 'Century Club', description: 'Watched 100 movies', icon: '🎬', earnedAt: '2024-01-01', rarity: 'rare' },
    { id: 'a2', name: 'Critic', description: 'Written 50 reviews', icon: '✍️', earnedAt: '2024-03-15', rarity: 'epic' },
    { id: 'a3', name: 'Nolan Fan', description: 'Watched all Nolan films', icon: '🎭', earnedAt: '2024-06-01', rarity: 'legendary' },
    { id: 'a4', name: 'Weekend Warrior', description: '7-day watch streak', icon: '🔥', earnedAt: '2024-08-20', rarity: 'common' },
  ],
  watchStreak: 12,
  totalWatched: 247,
  totalReviews: 89,
  totalRatings: 213,
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (_email: string, _password: string) => {
        set({ isLoading: true });
        await new Promise((r) => setTimeout(r, 1200));
        set({ user: MOCK_USER, isAuthenticated: true, isLoading: false });
      },

      register: async (name: string, email: string, _password: string) => {
        set({ isLoading: true });
        await new Promise((r) => setTimeout(r, 1500));
        const newUser: User = {
          ...MOCK_USER,
          id: 'user-new',
          name,
          email,
          username: name.toLowerCase().replace(/\s/g, ''),
          totalWatched: 0,
          totalReviews: 0,
          totalRatings: 0,
          watchStreak: 0,
          achievements: [],
        };
        set({ user: newUser, isAuthenticated: true, isLoading: false });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      updateProfile: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },
    }),
    { name: 'mmg-auth' }
  )
);
