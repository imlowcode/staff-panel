import React, { useEffect, useState } from 'react';
import { AuthStatus, DiscordUser, GuildMember } from './types';
import LoginScreen from './components/LoginScreen';
import AccessDenied from './components/AccessDenied';
import StaffList from './components/StaffList';
import UserProfile from './components/UserProfile';
import { fetchCurrentUser, checkUserRole } from './services/discordService';

type ViewState = 'LIST' | 'PROFILE';

const App: React.FC = () => {
  const [status, setStatus] = useState<AuthStatus>(AuthStatus.IDLE);
  const [currentUser, setCurrentUser] = useState<DiscordUser | null>(null);
  
  // Navigation State
  const [currentView, setCurrentView] = useState<ViewState>('LIST');
  const [selectedUser, setSelectedUser] = useState<GuildMember | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Используется для обновления списка после изменений

  useEffect(() => {
    const handleAuth = async () => {
      // 1. Check if we have a stored session
      const storedToken = localStorage.getItem('discord_access_token');
      
      // 2. Check for NEW access token in URL hash (returned from Discord)
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const urlAccessToken = fragment.get('access_token');
      
      const tokenToUse = urlAccessToken || storedToken;

      if (tokenToUse) {
        setStatus(AuthStatus.LOADING);
        
        // Clear hash from URL for cleaner look if it exists
        if (urlAccessToken) {
           window.history.replaceState(null, '', ' ');
           // Save to local storage for persistence
           localStorage.setItem('discord_access_token', tokenToUse);
        }

        try {
          // Verify token is still valid by fetching user
          const user = await fetchCurrentUser(tokenToUse);
          setCurrentUser(user);

          // Check Role using backend (passes User ID, not token)
          const hasRole = await checkUserRole(user.id);

          if (hasRole) {
            setStatus(AuthStatus.AUTHENTICATED);
          } else {
            setStatus(AuthStatus.ACCESS_DENIED);
          }
        } catch (error) {
          console.error("Auth Error", error);
          // Token likely expired or invalid
          localStorage.removeItem('discord_access_token');
          setStatus(AuthStatus.IDLE); // Show login screen again
        }
      }
    };

    handleAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('discord_access_token');
    setStatus(AuthStatus.IDLE);
    setCurrentUser(null);
    window.location.hash = '';
    window.location.href = '/'; // Clean reset
  };

  const handleUserSelect = (member: GuildMember) => {
    setSelectedUser(member);
    setCurrentView('PROFILE');
  };

  const handleBackToList = () => {
    setSelectedUser(null);
    setCurrentView('LIST');
  };

  const handleDataUpdate = () => {
    // Триггерим обновление списка и обновляем текущего выбранного пользователя
    setRefreshTrigger(prev => prev + 1);
    
    if (selectedUser) {
        // Логика обновления выбранного юзера при необходимости
    }
  };

  if (status === AuthStatus.LOADING) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden text-white font-sans">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-900/20 blur-[100px] rounded-full"></div>
        
        <div className="relative z-10 flex flex-col items-center">
            {/* Logo Pulse */}
            <div className="mb-8 relative">
                <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
                <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500 relative z-10">NULLX</h1>
            </div>

            {/* Spinner */}
            <div className="w-8 h-8 border-2 border-white/10 border-t-purple-500 rounded-full animate-spin mb-4"></div>
            
            <div className="text-gray-500 text-xs font-mono tracking-[0.3em] uppercase animate-pulse">
                Authenticating...
            </div>
        </div>
      </div>
    );
  }

  if (status === AuthStatus.ACCESS_DENIED) {
    return <AccessDenied onRetry={handleLogout} />;
  }

  if (status === AuthStatus.AUTHENTICATED && currentUser) {
    if (currentView === 'PROFILE' && selectedUser) {
        return (
            <UserProfile 
                member={selectedUser} 
                currentUser={currentUser} 
                onBack={handleBackToList}
                onUpdate={() => {
                   handleDataUpdate();
                   // Optimistic update
                   const inputElement = document.querySelector('input');
                   if (inputElement && selectedUser) {
                       const updatedUser = { ...selectedUser, ign: inputElement.value };
                       setSelectedUser(updatedUser);
                   }
                }}
            />
        );
    }

    return (
        <StaffList 
            currentUser={currentUser} 
            onLogout={handleLogout} 
            onSelectUser={handleUserSelect}
            refreshTrigger={refreshTrigger}
        />
    );
  }

  // Default: Login Screen
  return <LoginScreen />;
};

export default App;