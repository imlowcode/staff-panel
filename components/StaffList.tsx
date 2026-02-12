import React, { useEffect, useState } from 'react';
import { GuildMember, DiscordUser } from '../types';
import { fetchStaffMembers } from '../services/discordService';
import { ROLE_HIERARCHY } from '../constants';
import ModernButton from './MinecraftButton';

interface StaffListProps {
  currentUser: DiscordUser;
  onLogout: () => void;
  onSelectUser: (member: GuildMember) => void;
  refreshTrigger: number;
}

const StaffList: React.FC<StaffListProps> = ({ currentUser, onLogout, onSelectUser, refreshTrigger }) => {
  const [staff, setStaff] = useState<GuildMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStaff = async () => {
      try {
        setLoading(true);
        const members = await fetchStaffMembers();
        setStaff(members);
      } catch (err: any) {
        console.error("UI Error:", err);
        setError(err.message || "Ошибка соединения.");
      } finally {
        setLoading(false);
      }
    };
    loadStaff();
  }, [refreshTrigger]);

  // Найти объект GuildMember для текущего пользователя (чтобы передать его в профиль)
  const handleMyProfileClick = () => {
      const myMember = staff.find(m => m.user.id === currentUser.id);
      // Если пользователя нет в списке стаффа (баг или он только что зашел), создаем заглушку
      if (myMember) {
          onSelectUser(myMember);
      } else {
          // Fallback, хотя такого быть не должно, если он прошел проверку роли
          onSelectUser({
              user: currentUser,
              roles: [],
              joined_at: new Date().toISOString(),
              ign: undefined
          });
      }
  };

  const getAvatarUrl = (user: DiscordUser, ign?: string) => {
    if (ign) return `https://minotar.net/helm/${ign}/100.png`;
    if (user.avatar) return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
    return `https://cdn.discordapp.com/embed/avatars/${(parseInt(user.discriminator) || 0) % 5}.png`;
  };

  const getUserDisplayRole = (memberRoles: string[]) => {
    for (const roleDef of ROLE_HIERARCHY) {
      if (memberRoles.includes(roleDef.id)) return roleDef;
    }
    return null;
  };

  const getDisplayName = (member: GuildMember) => {
    return member.ign || member.nick || member.user.global_name || member.user.username;
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-[#020202]">
      
      {/* --- Ambient Background Glows --- */}
      <div className="fixed top-0 left-1/4 w-[800px] h-[500px] bg-purple-900/10 blur-[150px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-indigo-900/10 blur-[120px] pointer-events-none"></div>

      {/* Navbar */}
      <nav className="sticky top-0 z-40 nav-glass px-8 py-5 flex justify-between items-center border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4 group">
           <div className="absolute inset-0 bg-purple-500/5 blur-xl group-hover:bg-purple-500/10 transition-colors"></div>
           <h1 className="relative text-2xl font-black tracking-tighter text-white flex items-center gap-1 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            NULL<span className="text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-pink-400">X</span>
           </h1>
        </div>
        
        <div className="flex items-center gap-6">
            <button 
                onClick={handleMyProfileClick}
                className="hidden md:flex items-center gap-3 bg-white/5 rounded-full px-4 py-1.5 border border-white/10 shadow-inner hover:bg-white/10 transition-all cursor-pointer group"
            >
                <img 
                    src={getAvatarUrl(currentUser)} 
                    alt="User" 
                    className="w-6 h-6 rounded-full border border-white/20 group-hover:border-purple-500 transition-colors"
                />
                <div className="flex flex-col items-start leading-none">
                    <span className="text-[11px] font-bold text-gray-200 uppercase tracking-wide group-hover:text-white">{currentUser.global_name || currentUser.username}</span>
                    <span className="text-[9px] text-gray-500 font-mono group-hover:text-purple-400">Мой профиль</span>
                </div>
            </button>
            <button 
                onClick={onLogout} 
                className="text-gray-400 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-[0.2em] border-b border-transparent hover:border-purple-500"
            >
                Выйти
            </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12 relative z-10 flex-1">
        
        {/* Header */}
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
            <div className="relative">
                <div className="absolute -left-10 -top-10 w-32 h-32 bg-purple-500/20 blur-[50px]"></div>
                <h2 className="relative text-5xl font-bold text-white tracking-tight mb-2 drop-shadow-md">Состав Проекта</h2>
                <p className="relative text-gray-400 text-sm font-medium tracking-wide">Список активного персонала и иерархия</p>
            </div>
            {!loading && !error && (
                <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-[#050505] border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400 tracking-wider drop-shadow-sm">{staff.length} ОНЛАЙН</span>
                </div>
            )}
        </div>

        {error ? (
           <div className="glass-panel p-12 rounded-2xl text-center max-w-lg mx-auto border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)] flex flex-col items-center">
             <div className="text-red-500 text-xl font-black mb-3 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">Ошибка подключения</div>
             <p className="text-gray-400 mb-8 text-sm leading-relaxed">{error}</p>
             <ModernButton onClick={() => window.location.reload()} variant="primary">Попробовать снова</ModernButton>
           </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="glass-panel rounded-xl p-5 h-28 animate-pulse flex items-center gap-5 border border-white/5">
                <div className="w-14 h-14 bg-white/5 rounded-2xl"></div>
                <div className="flex-1 space-y-3">
                    <div className="h-3 bg-white/5 w-3/4 rounded-full"></div>
                    <div className="h-2 bg-white/5 w-1/2 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Columns Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12 items-start">
            
            {ROLE_HIERARCHY.map((roleDef) => {
              const membersInRole = staff.filter(member => {
                 const highestRole = getUserDisplayRole(member.roles);
                 return highestRole?.id === roleDef.id;
              });

              if (membersInRole.length === 0) return null;

              return (
                <div key={roleDef.id} className="group animate-slide-up">
                    {/* Role Header */}
                    <div className="flex items-center gap-4 mb-6 pl-2 relative">
                         <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-gradient-to-b ${roleDef.color} shadow-[0_0_10px_currentColor] opacity-80`}></div>
                         <h2 className="pl-4 text-[11px] font-black uppercase tracking-[0.25em] text-gray-400 group-hover:text-white transition-colors drop-shadow-sm">
                            {roleDef.name}
                        </h2>
                    </div>

                    {/* Cards Column */}
                    <div className="flex flex-col gap-4">
                        {membersInRole.map((member) => (
                            <button 
                                key={member.user.id}
                                onClick={() => onSelectUser(member)}
                                className="glass-card w-full text-left rounded-xl p-4 flex items-center gap-4 group/card relative overflow-hidden outline-none focus:ring-2 focus:ring-purple-500/50"
                            >
                                {/* Role Glow Gradient on Card Background */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${roleDef.color} opacity-0 group-hover/card:opacity-10 transition-opacity duration-500`}></div>
                                
                                {/* Side accent line */}
                                <div className={`absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b ${roleDef.color} opacity-0 group-hover/card:opacity-100 transition-opacity shadow-[0_0_10px_currentColor]`}></div>

                                {/* Avatar */}
                                <div className="relative shrink-0 transition-transform duration-300 group-hover/card:scale-110 group-hover/card:rotate-3">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${roleDef.color} blur-lg opacity-0 group-hover/card:opacity-40 transition-opacity`}></div>
                                    <img 
                                        src={getAvatarUrl(member.user, member.ign)} 
                                        alt={member.user.username}
                                        className="relative w-12 h-12 rounded-xl object-cover bg-[#101010] border border-white/10 shadow-lg" 
                                    />
                                    {member.ign && (
                                        <div className="absolute -bottom-1.5 -right-1.5 bg-black rounded-lg p-[2px] border border-white/10 shadow-lg scale-75">
                                            <div className="w-2.5 h-2.5 bg-purple-500 rounded-full shadow-[0_0_5px_#a855f7]"></div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Info */}
                                <div className="min-w-0 flex flex-col z-10">
                                    <span className="text-[13px] font-bold text-gray-100 truncate leading-tight group-hover/card:text-white transition-colors font-mono tracking-tight drop-shadow-md">
                                        {getDisplayName(member)}
                                    </span>
                                    
                                    {/* Secondary Info */}
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`h-1 w-1 rounded-full bg-gradient-to-r ${roleDef.color}`}></span>
                                        <span className="text-[10px] text-gray-500 truncate group-hover/card:text-gray-400 font-medium tracking-wide">
                                            {member.ign ? `@${member.user.username}` : roleDef.name}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Arrow Icon on Hover */}
                                <div className="absolute right-4 opacity-0 group-hover/card:opacity-100 transform translate-x-[-10px] group-hover/card:translate-x-0 transition-all duration-300">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffList;