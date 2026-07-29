'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const router                = useRouter();

  // Verifica si hay una sesión activa al montar la app
  useEffect(() => {
    const token = localStorage.getItem('bb-token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/me')
      .then(res => setUser(res.data))
      .catch(() => localStorage.removeItem('bb-token'))
      .finally(() => setLoading(false));
  }, []);

  // Escucha el evento de sesión expirada (401) emitido por api.js.
  // Cubre tanto la carga inicial como la expiración mid-session.
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      router.replace('/login');
    };
    window.addEventListener('bb:session-expired', handleExpired);
    return () => window.removeEventListener('bb:session-expired', handleExpired);
  }, [router]);

  const login = async (email, password) => {
    const { data } = await api.post('/login', { email, password });
    localStorage.setItem('bb-token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    // Siempre limpia el estado local aunque el servidor no responda
    try { await api.post('/logout'); } catch (_) {}
    localStorage.removeItem('bb-token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
