import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

interface User {
  id: string;
  email?: string;
  nickname?: string;
  avatar?: string | null;
  role?: string;
}

interface UserStore {
  user: User | null;
  loading: boolean;
  error: string | null;
}

function createUserStore() {
  const { subscribe, set, update } = writable<UserStore>({
    user: null,
    loading: false,
    error: null
  });

  async function fetchUser() {
    if (!browser) return;
    
    update(store => ({ ...store, loading: true, error: null }));
    
    try {
      const response = await fetch('/api/user/current');
      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated, clear user data
          update(store => ({ ...store, user: null, loading: false, error: null }));
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const user = await response.json();
      console.log('Fetched user data:', user);
      update(store => ({ ...store, user, loading: false, error: null }));
    } catch (err) {
      console.error('Error fetching user:', err);
      update(store => ({ 
        ...store, 
        user: null, 
        loading: false, 
        error: err instanceof Error ? err.message : 'Failed to fetch user' 
      }));
    }
  }

  function clearUser() {
    update(store => ({ ...store, user: null, loading: false, error: null }));
  }

  return {
    subscribe,
    fetchUser,
    clearUser,
    user: derived(
      { subscribe },
      $store => $store.user
    ),
    loading: derived(
      { subscribe },
      $store => $store.loading
    ),
    error: derived(
      { subscribe },
      $store => $store.error
    )
  };
}

export const userStore = createUserStore();
