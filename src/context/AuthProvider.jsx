import { useCallback, useState } from 'react';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || null; }
    catch { return null; }
  });
  const [avatar, setAvatarState] = useState(() => localStorage.getItem('avatar') || null);

  function login(newToken, userData) {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('avatar');
    setToken(null);
    setUser(null);
    setAvatarState(null);
  }

  const setAvatar = useCallback((path) => {
    if (path) localStorage.setItem('avatar', path);
    else localStorage.removeItem('avatar');
    setAvatarState(path || null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, avatar, login, logout, setAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}