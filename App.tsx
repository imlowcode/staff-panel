import React, { useEffect, useState } from 'react';
import { AuthStatus, DiscordUser, GuildMember } from './types';
import LoginScreen from './components/LoginScreen';
import AccessDenied from './components/AccessDenied';
import StaffList from './components/StaffList';
import UserProfile from './components/UserProfile';
import ToastNotification, { Toast } from './components/ToastNotification';
import { fetchCurrentUser, checkUserRole } from './services/discordService';

type ViewState = 'LIST' | 'PROFILE';

const App: React.FC = () => {
  const [status, setStatus] = useState<AuthStatus>(AuthStatus.IDLE);
  const [currentUser, setCurrentUser] = useState<DiscordUser | null>(null);
  
  // Navigation State
  const [currentView, setCurrentView] = useState<ViewState>('LIST');
  const [selectedUser, setSelectedUser] = useState<GuildMember | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); 

  // Toast State
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error') => {
      const id = Math.random().toString(36).substring(7);
      setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    const handleAuth = async () => {
      const storedToken = localStorage.getItem('discord_access_token');
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const urlAccessToken = fragment.get('access_token');
      
      const tokenToUse = urlAccessToken || storedToken;

      if (tokenToUse) {
        setStatus(AuthStatus.LOADING);
        
        if (urlAccessToken) {
           window.history.replaceState(null, '', ' ');
           localStorage.setItem('discord_access_token', tokenToUse);
        }

        try {
          const user = await fetchCurrentUser(tokenToUse);
          setCurrentUser(user);
          const hasRole = await checkUserRole(user.id);

          if (hasRole) {
            setStatus(AuthStatus.AUTHENTICATED);
          } else {
            setStatus(AuthStatus.ACCESS_DENIED);
          }
        } catch (error) {
          console.error("Auth Error", error);
          localStorage.removeItem('discord_access_token');
          setStatus(AuthStatus.IDLE); 
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
    window.location.href = '/'; 
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
    setRefreshTrigger(prev => prev + 1);
  };

  if (status === AuthStatus.LOADING) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden text-white font-sans">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-900/20 blur-[100px] rounded-full"></div>
        
        <div className="relative z-10 flex flex-col items-center">
            <div className="mb-8 relative">
                <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
                <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500 relative z-10">NULLX</h1>
            </div>
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
    return (
        <>
            {currentView === 'PROFILE' && selectedUser ? (
                <UserProfile 
                    member={selectedUser} 
                    currentUser={currentUser} 
                    onBack={handleBackToList}
                    onShowToast={addToast}
                    onUpdate={() => {
                       handleDataUpdate();
                       const inputElement = document.querySelector('input');
                       if (inputElement && selectedUser) {
                           const updatedUser = { ...selectedUser, ign: inputElement.value };
                           setSelectedUser(updatedUser);
                       }
                    }}
                />
            ) : (
                <StaffList 
                    currentUser={currentUser} 
                    onLogout={handleLogout} 
                    onSelectUser={handleUserSelect}
                    refreshTrigger={refreshTrigger}
                />
            )}
            <ToastNotification toasts={toasts} removeToast={removeToast} />
        </>
    );
  }

  return <LoginScreen />;
};

export default App;