import React, { useEffect, useState } from 'react';
import { GuildMember, DiscordUser } from '../types';
import { fetchStaffMembers } from '../services/discordService';
import { ROLE_HIERARCHY, ALLOWED_ADMIN_IDS } from '../constants';
import Wiki from './Wiki';

interface StaffListProps {
  currentUser: DiscordUser;
  onLogout: () => void;
  onSelectUser: (member: GuildMember) => void;
  refreshTrigger: number;
}

// --- FEATHER ICONS (https://feathericons.com/) ---
const Icons = {
    Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
    Logout: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
    Users: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
    Shield: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
    Activity: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>,
    List: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>,
    Info: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
};

// --- TOOLTIP COMPONENT ---
const ActionTooltip = ({ text, children }: { text: string, children: React.ReactNode }) => (
    <div className="relative group flex items-center justify-center">
        {children}
        <div className="absolute top-full mt-3 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50">
            <div className="bg-black/90 backdrop-blur-md border border-white/10 text-gray-200 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-xl translate-y-[-5px] group-hover:translate-y-0 transition-transform whitespace-nowrap">
                {text}
                {/* Little arrow */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/90 border-t border-l border-white/10 rotate-45"></div>
            </div>
        </div>
    </div>
);

const StaffList: React.FC<StaffListProps> = ({ currentUser, onLogout, onSelectUser, refreshTrigger }) => {
  const [staff, setStaff] = useState<GuildMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // VIEW MODE: 'MEMBERS' (List) OR 'WIKI' (Information)
  const [viewMode, setViewMode] = useState<'MEMBERS' | 'WIKI'>('MEMBERS');

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

  const handleMyProfileClick = () => {
      const myMember = staff.find(m => m.user.id === currentUser.id);
      if (myMember) {
          onSelectUser(myMember);
      } else {
          onSelectUser({
              user: currentUser,
              roles: [],
              joined_at: new Date().toISOString(),
              ign: undefined
          });
      }
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

  // KPI Calculations
  const totalStaff = staff.length;
  const adminCount = staff.filter(m => m.roles.some(r => ALLOWED_ADMIN_IDS.includes(r) || ['1458159802105594061'].includes(r))).length; // Simplified check
  
  const filteredStaff = staff.filter(m => 
    getDisplayName(m).toLowerCase().includes(searchQuery.toLowerCase()) || 
    (m.ign && m.ign.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Find current user member object to pass to Wiki
  const currentMember = staff.find(m => m.user.id === currentUser.id);

  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans p-6 flex flex-col items-center">
      
      {/* Background Blobs (Static for consistency) */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
           <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-900/10 blur-[150px]"></div>
           <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/10 blur-[150px]"></div>
      </div>

      {/* --- HEADER PANEL --- */}
      <div className="w-full max-w-7xl bg-[#0A0A0A] rounded-3xl border border-white/5 p-6 flex flex-col md:flex-row items-center justify-between gap-6 mb-8 shadow-2xl relative z-10">
            {/* Brand */}
            <div className="flex items-center gap-6 pl-2">
               <img 
                  src="logo/Nullx.png" 
                  alt="NullX" 
                  className="h-10 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.insertAdjacentHTML('beforeend', '<span class="text-xl font-black tracking-tighter text-white">NULLX</span>');
                  }} 
               />
               
               {/* MAIN NAVIGATION TABS */}
               <div className="hidden md:flex bg-[#151515] rounded-xl p-1 border border-white/5">
                   <button 
                        onClick={() => setViewMode('MEMBERS')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${viewMode === 'MEMBERS' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                   >
                       <Icons.List /> Персонал
                   </button>
                   <button 
                        onClick={() => setViewMode('WIKI')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${viewMode === 'WIKI' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                   >
                       <Icons.Info /> Информация
                   </button>
               </div>
            </div>

            {/* Search & Actions */}
            <div className="flex items-center gap-3 w-full md:w-auto">
                {/* Show Search ONLY in Members View */}
                {viewMode === 'MEMBERS' && (
                    <ActionTooltip text="Поиск">
                        <div className="relative group w-full md:w-64 animate-fade-in">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-purple-500 transition-colors">
                                <Icons.Search />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Поиск сотрудника..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-[#151515] border border-white/10 text-white text-xs rounded-xl block w-full pl-10 p-3 outline-none focus:border-purple-500/50 transition-colors font-medium placeholder-gray-600 shadow-inner"
                            />
                        </div>
                    </ActionTooltip>
                )}
                
                <div className="h-8 w-px bg-white/10 mx-2 hidden md:block"></div>

                <ActionTooltip text="Мой Профиль">
                    <button 
                        onClick={handleMyProfileClick}
                        className="flex items-center gap-2 bg-[#151515] hover:bg-[#202020] border border-white/10 rounded-xl px-4 py-2.5 transition-all group active:scale-95 active:bg-[#252525]"
                    >
                        <img 
                            src={currentUser.avatar ? `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/0.png`} 
                            className="w-5 h-5 rounded-full border border-white/10" 
                            alt="Me" 
                        />
                        <span className="text-xs font-bold text-gray-300 group-hover:text-white hidden md:block">{currentUser.username}</span>
                    </button>
                </ActionTooltip>

                <ActionTooltip text="Выйти">
                    <button 
                        onClick={onLogout}
                        className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl p-2.5 transition-colors active:scale-95 active:bg-red-500/30"
                    >
                        <Icons.Logout />
                    </button>
                </ActionTooltip>
            </div>
      </div>

      {/* --- CONTENT AREA (Switcher) --- */}
      <div className="w-full max-w-7xl relative z-10 flex flex-col gap-8">
            
            {/* VIEW: WIKI/INFORMATION */}
            {viewMode === 'WIKI' && (
                <Wiki currentMember={currentMember} />
            )}

            {/* VIEW: STAFF LIST */}
            {viewMode === 'MEMBERS' && (
                <>
                    {/* KPI ROW */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                        {/* Total Staff */}
                        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 relative overflow-hidden group flex items-center justify-between max-w-lg mx-auto w-full">
                            <div className="relative z-10">
                                <h3 className="text-purple-500 text-[9px] font-black uppercase tracking-widest mb-1">Всего персонала</h3>
                                <div className="text-3xl font-black text-white">{loading ? "-" : totalStaff}</div>
                            </div>
                            <div className="text-[#151515] group-hover:text-[#1a1a1a] transition-colors transform group-hover:scale-110 duration-500">
                                <div className="scale-[2.0] origin-right mr-4">
                                    <Icons.Users />
                                </div>
                            </div>
                        </div>

                        {/* Admins */}
                        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 relative overflow-hidden group flex items-center justify-between max-w-lg mx-auto w-full">
                            <div className="relative z-10">
                                <h3 className="text-blue-500 text-[9px] font-black uppercase tracking-widest mb-1">Администраторы</h3>
                                <div className="text-3xl font-black text-white">{loading ? "-" : adminCount}</div>
                            </div>
                            <div className="text-[#151515] group-hover:text-[#1a1a1a] transition-colors transform group-hover:scale-110 duration-500">
                                <div className="scale-[2.0] origin-right mr-4">
                                    <Icons.Shield />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ERROR STATE */}
                    {error && (
                        <div className="w-full bg-red-900/10 border border-red-500/20 rounded-2xl p-8 text-center animate-fade-in">
                            <h2 className="text-red-500 font-bold uppercase tracking-widest mb-2">Ошибка загрузки</h2>
                            <p className="text-gray-400 text-sm mb-4">{error}</p>
                            <button onClick={() => window.location.reload()} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-6 py-2 rounded-lg text-xs font-bold uppercase transition-colors">Обновить</button>
                        </div>
                    )}

                    {/* SKELETON LOADING */}
                    {loading && !error && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
                            {[1,2,3,4,5,6,7,8].map(i => (
                                <div key={i} className="bg-[#0A0A0A] border border-white/5 rounded-2xl h-48 animate-pulse"></div>
                            ))}
                        </div>
                    )}

                    {/* STAFF GRID */}
                    {!loading && !error && (
                        <div className="flex flex-col gap-10">
                            {ROLE_HIERARCHY.map(roleDef => {
                                const members = filteredStaff.filter(m => {
                                    const r = getUserDisplayRole(m.roles);
                                    return r?.id === roleDef.id;
                                });

                                if (members.length === 0) return null;

                                return (
                                    <div key={roleDef.id} className="animate-slide-up">
                                        {/* Role Header */}
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className={`w-1.5 h-6 rounded-full bg-gradient-to-b ${roleDef.color}`}></div>
                                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">
                                                {roleDef.name} <span className="text-gray-700 ml-1">({members.length})</span>
                                            </h2>
                                        </div>

                                        {/* Cards */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                            {members.map(member => (
                                                <button 
                                                    key={member.user.id}
                                                    onClick={() => onSelectUser(member)}
                                                    className="group relative bg-[#0A0A0A] border border-white/5 hover:border-white/10 rounded-2xl p-0 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden flex flex-col items-center active:scale-[0.98] active:opacity-90 active:border-purple-500/50"
                                                >
                                                    {/* Full Background Gradient Tint */}
                                                    <div className={`absolute inset-0 bg-gradient-to-b ${roleDef.color} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
                                                    
                                                    {/* Avatar / Skin Container */}
                                                    <div className="relative mt-6 mb-4">
                                                        <div className={`absolute inset-0 bg-gradient-to-br ${roleDef.color} blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500`}></div>
                                                        {/* If IGN exists, show 2D Body, else Discord Avatar */}
                                                        {member.ign ? (
                                                            <img 
                                                                src={`https://mc-heads.net/body/${member.ign}/150`}
                                                                alt="Skin"
                                                                className="h-32 object-contain relative z-10 drop-shadow-xl transform group-hover:scale-105 transition-transform"
                                                            />
                                                        ) : (
                                                            <img 
                                                                src={member.user.avatar ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/0.png`}
                                                                alt="Avatar"
                                                                className="w-24 h-24 rounded-full border-4 border-[#0A0A0A] relative z-10 shadow-xl"
                                                            />
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="w-full bg-[#111] p-4 pt-6 mt-auto border-t border-white/5 relative">
                                                        {/* Role Badge floating up */}
                                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border bg-[#0A0A0A] ${roleDef.badgeBg.replace('bg-opacity-20', '')} shadow-sm whitespace-nowrap`}>
                                                                {roleDef.name}
                                                            </span>
                                                        </div>

                                                        <div className="text-center">
                                                            <div className="text-sm font-black text-white truncate">{getDisplayName(member)}</div>
                                                            <div className="text-[10px] font-mono text-gray-500 mt-0.5">
                                                                {member.ign ? `@${member.user.username}` : 'No IGN Linked'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
      </div>
    </div>
  );
};

export default StaffList;