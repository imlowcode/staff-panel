import React, { useEffect, useState } from 'react';
import { GuildMember, DiscordUser } from '../types';
import { fetchStaffMembers } from '../services/discordService';
import { ROLE_HIERARCHY, ALLOWED_ADMIN_IDS } from '../constants';

interface StaffListProps {
  currentUser: DiscordUser;
  onLogout: () => void;
  onSelectUser: (member: GuildMember) => void;
  refreshTrigger: number;
}

// --- HEROICONS SOLID SET ---
const Icons = {
    Search: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
        </svg>
    ),
    Logout: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M16.5 3.75a1.5 1.5 0 011.5 1.5v13.5a1.5 1.5 0 01-1.5 1.5h-6a1.5 1.5 0 01-1.5-1.5V15a.75.75 0 00-1.5 0v3.75a3 3 0 003 3h6a3 3 0 003-3V5.25a3 3 0 00-3-3h-6a3 3 0 00-3 3V9A.75.75 0 109 9V5.25a1.5 1.5 0 011.5-1.5h6zm-5.03 4.72a.75.75 0 000 1.06l1.72 1.72H2.25a.75.75 0 000 1.5h10.94l-1.72 1.72a.75.75 0 101.06 1.06l3-3a.75.75 0 000-1.06l-3-3a.75.75 0 00-1.06 0z" clipRule="evenodd" />
        </svg>
    ),
    Users: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
        </svg>
    ),
    Shield: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.352-.272-2.636-.759-3.808a.75.75 0 00-.722-.515 11.208 11.208 0 01-7.877-3.08zM12 4.04c2.11 1.096 4.453 1.766 6.938 1.914-.542 4.542-2.31 8.525-6.938 10.033-4.629-1.508-6.396-5.491-6.938-10.033A12.712 12.712 0 0112 4.04z" clipRule="evenodd" />
        </svg>
    ),
    Signal: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M1.371 8.143c5.858-5.857 15.356-5.857 21.213 0a.75.75 0 010 1.061l-.53.53a.75.75 0 01-1.06 0c-4.98-4.979-13.053-4.979-18.032 0a.75.75 0 01-1.06 0l-.53-.53a.75.75 0 010-1.06zm3.182 3.182c4.1-4.1 10.749-4.1 14.85 0a.75.75 0 010 1.061l-.53.53a.75.75 0 01-1.062 0 8.25 8.25 0 00-11.667 0 .75.75 0 01-1.06 0l-.53-.53a.75.75 0 010-1.06zm3.204 3.182a6 6 0 018.486 0 .75.75 0 010 1.061l-.53.53a.75.75 0 01-1.061 0 3.75 3.75 0 00-5.304 0 .75.75 0 01-1.06 0l-.53-.53a.75.75 0 010-1.06zm3.182 3.182a1.5 1.5 0 012.122 0 .75.75 0 010 1.061l-.53.53a.75.75 0 01-1.061 0l-.53-.53a.75.75 0 010-1.06z" clipRule="evenodd" />
        </svg>
    )
};

const StaffList: React.FC<StaffListProps> = ({ currentUser, onLogout, onSelectUser, refreshTrigger }) => {
  const [staff, setStaff] = useState<GuildMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/20">
                    <span className="text-xl font-black text-white">N</span>
               </div>
               <div>
                   <h1 className="text-2xl font-black tracking-tighter text-white">NULLX</h1>
                   <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Staff Control Panel</p>
               </div>
            </div>

            {/* Search & Actions */}
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative group w-full md:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-purple-500 transition-colors">
                        <Icons.Search />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Поиск сотрудника..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-[#151515] border border-white/10 text-white text-xs rounded-xl block w-full pl-10 p-3 outline-none focus:border-purple-500/50 transition-colors font-medium placeholder-gray-600"
                    />
                </div>
                
                <div className="h-8 w-px bg-white/10 mx-2 hidden md:block"></div>

                <button 
                    onClick={handleMyProfileClick}
                    className="flex items-center gap-2 bg-[#151515] hover:bg-[#202020] border border-white/10 rounded-xl px-4 py-2.5 transition-all group"
                >
                    <img 
                        src={currentUser.avatar ? `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/0.png`} 
                        className="w-5 h-5 rounded-full border border-white/10" 
                        alt="Me" 
                    />
                    <span className="text-xs font-bold text-gray-300 group-hover:text-white hidden md:block">{currentUser.username}</span>
                </button>

                <button 
                    onClick={onLogout}
                    className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl p-2.5 transition-colors"
                >
                    <Icons.Logout />
                </button>
            </div>
      </div>

      {/* --- CONTENT --- */}
      <div className="w-full max-w-7xl relative z-10 flex flex-col gap-8">
            
            {/* KPI ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Total Staff */}
                 <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                     <div className="absolute right-0 top-0 p-6 text-[#151515] group-hover:text-[#1a1a1a] transition-colors">
                        <Icons.Users />
                     </div>
                     <h3 className="text-purple-500 text-[10px] font-black uppercase tracking-widest mb-1">Всего персонала</h3>
                     <div className="text-4xl font-black text-white">{loading ? "-" : totalStaff}</div>
                 </div>

                  {/* Online (Mocked for visual parity) */}
                 <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                     <div className="absolute right-0 top-0 p-6 text-[#151515] group-hover:text-[#1a1a1a] transition-colors">
                        <Icons.Signal />
                     </div>
                     <h3 className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-1">Статус Систем</h3>
                     <div className="text-4xl font-black text-white flex items-center gap-3">
                         ONLINE
                         <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                     </div>
                 </div>

                 {/* Admins */}
                 <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                     <div className="absolute right-0 top-0 p-6 text-[#151515] group-hover:text-[#1a1a1a] transition-colors">
                        <Icons.Shield />
                     </div>
                     <h3 className="text-blue-500 text-[10px] font-black uppercase tracking-widest mb-1">Администраторы</h3>
                     <div className="text-4xl font-black text-white">{loading ? "-" : adminCount}</div>
                 </div>
            </div>

            {/* ERROR STATE */}
            {error && (
                <div className="w-full bg-red-900/10 border border-red-500/20 rounded-2xl p-8 text-center">
                    <h2 className="text-red-500 font-bold uppercase tracking-widest mb-2">Ошибка загрузки</h2>
                    <p className="text-gray-400 text-sm mb-4">{error}</p>
                    <button onClick={() => window.location.reload()} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-6 py-2 rounded-lg text-xs font-bold uppercase transition-colors">Обновить</button>
                </div>
            )}

            {/* SKELETON LOADING */}
            {loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                                            className="group relative bg-[#0A0A0A] border border-white/5 hover:border-white/10 rounded-2xl p-0 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden flex flex-col items-center"
                                        >
                                            {/* Top Background Gradient */}
                                            <div className={`absolute top-0 w-full h-24 bg-gradient-to-b ${roleDef.color} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                                            
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
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border bg-[#0A0A0A] ${roleDef.badgeBg.replace('bg-opacity-20', '')} shadow-sm`}>
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
      </div>
    </div>
  );
};

export default StaffList;