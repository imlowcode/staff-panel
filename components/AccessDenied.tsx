import React from 'react';
import ModernButton from './MinecraftButton';

interface AccessDeniedProps {
  onRetry: () => void;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({ onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white p-4 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-red-900/10 blur-[100px] pointer-events-none"></div>

      <div className="glass-panel w-full max-w-sm p-8 rounded-2xl text-center relative z-10">
        
        <div className="text-red-500 text-6xl font-black tracking-tighter mb-2 opacity-80">
            403
        </div>

        <h2 className="text-lg font-bold text-white mb-2 uppercase tracking-widest">Доступ Запрещен</h2>
        
        <p className="text-gray-400 text-xs mb-8 leading-relaxed font-mono px-4">
          У вас недостаточно прав для просмотра этой страницы.<br/>
          Требуется роль <span className="text-purple-400">STAFF</span>.
        </p>

        <ModernButton onClick={onRetry} variant="secondary" fullWidth>
          На главную
        </ModernButton>
      </div>
    </div>
  );
};

export default AccessDenied;