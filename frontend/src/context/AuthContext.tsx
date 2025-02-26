import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { API_BASE_URL } from '../config';

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  login: async () => {},
  logout: () => {},
  isAuthenticated: false
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = async (token: string, user: User) => {
    try {
      console.log('AuthContext: login called with token and user');
      
      // Store token and user data
      console.log('AuthContext: Storing token in localStorage');
      localStorage.setItem('token', token);
      
      console.log('AuthContext: Storing user in localStorage');
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('AuthContext: Setting state variables');
      setToken(token);
      setUser(user);
      
      console.log('AuthContext: login completed successfully');
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('AuthContext: logout called');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    console.log('AuthContext: logout completed');
  };

  useEffect(() => {
    // Validate token on start
    const validateToken = async () => {
      console.log('AuthContext: validateToken called');
      const savedToken = localStorage.getItem('token');
      
      if (!savedToken) {
        console.log('AuthContext: No token found, logging out');
        logout();
        return;
      }

      try {
        console.log('AuthContext: Validating token with API');
        console.log('AuthContext: API URL:', `${API_BASE_URL}/api/auth/validate`);
        
        const response = await fetch(`${API_BASE_URL}/api/auth/validate`, {
          headers: {
            'Authorization': `Bearer ${savedToken}`,
            'Accept': 'application/json'
          }
        });

        console.log('AuthContext: Validation response status:', response.status);
        
        if (!response.ok) {
          console.log('AuthContext: Token validation failed, logging out');
          logout();
          return;
        }

        const responseText = await response.text();
        console.log('AuthContext: Validation response text:', responseText);
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (err) {
          console.error('AuthContext: JSON parsing error:', err);
          logout();
          return;
        }
        
        if (data.user) {
          console.log('AuthContext: Valid user data received, setting state');
          setUser(data.user);
          setToken(savedToken);
        } else {
          console.log('AuthContext: No user data in validation response, logging out');
          logout();
        }
      } catch (error) {
        console.error('AuthContext: Token validation error:', error);
        logout();
      }
    };

    validateToken();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      token, 
      user, 
      login, 
      logout,
      isAuthenticated: !!token && !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};
