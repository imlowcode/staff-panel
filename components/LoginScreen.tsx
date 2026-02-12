import React from 'react';
import { getLoginUrl } from '../services/discordService';

const LoginScreen: React.FC = () => {
  const handleLogin = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#020202] overflow-hidden selection:bg-purple-500/30">
      
      {/* --- Dynamic Background Blobs --- */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-1/4 left-1/3 w-[600px] h-[600px] bg-blue-900/10 rounded-full mix-blend-screen filter blur-[130px] animate-blob animation-delay-4000"></div>

      <div className="relative z-10 w-full max-w-[400px] px-6">
        
        {/* Glow behind the card */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-[2rem] blur-2xl opacity-20 -z-10 transform scale-95"></div>

        <div className="glass-panel rounded-[2rem] p-12 flex flex-col items-center text-center border border-white/10 shadow-2xl backdrop-blur-3xl">
            
            {/* Header / Logo */}
            <div className="mb-12 relative group cursor-default">
                <div className="absolute -inset-4 bg-purple-500/30 blur-xl rounded-full opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                <h1 className="relative text-7xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                    NULL<span className="text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-indigo-400">X</span>
                </h1>
                <div className="mt-4 flex items-center justify-center gap-3 opacity-60">
                   <div className="h-px w-8 bg-gradient-to-r from-transparent via-white to-transparent"></div>
                   <p className="text-[10px] font-mono text-purple-200 uppercase tracking-[0.4em] drop-shadow-md">Панель Персонала</p>
                   <div className="h-px w-8 bg-gradient-to-r from-transparent via-white to-transparent"></div>
                </div>
            </div>

            {/* Login Button */}
            <button 
                onClick={handleLogin}
                className="group relative w-full overflow-hidden rounded-xl bg-[#5865F2] p-[1px] shadow-[0_0_20px_rgba(88,101,242,0.3)] transition-all duration-300 hover:shadow-[0_0_40px_rgba(88,101,242,0.5)] hover:scale-[1.02] active:scale-[0.98]"
            >
                {/* Inner background to make border visible */}
                <div className="relative h-full w-full bg-[#0a0a0a] rounded-xl p-4 flex items-center justify-center gap-3 transition-colors group-hover:bg-[#5865F2]/10">
                    <svg className="w-6 h-6 text-[#5865F2] group-hover:text-white transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
                    </svg>
                    <span className="font-bold text-[#5865F2] group-hover:text-white tracking-widest text-xs uppercase transition-colors duration-300">Войти через Discord</span>
                </div>
            </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;