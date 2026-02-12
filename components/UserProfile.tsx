import React, { useState, useEffect } from 'react';
import { GuildMember, DiscordUser, PlayerStats, EconomyData } from '../types';
import { ROLE_HIERARCHY, ALLOWED_ADMIN_IDS, API_BASE_URL } from '../constants';
import ModernButton from './MinecraftButton';
import { updateMemberIgn } from '../services/discordService';

interface UserProfileProps {
  member: GuildMember;
  currentUser: DiscordUser;
  onBack: () => void;
  onUpdate: () => void;
}

// --- UTILS ---
const formatDate = (ms: number | string) => {
    if (!ms || ms === 0) return '-';
    const date = new Date(typeof ms === 'string' ? ms : ms); 
    return date.toLocaleDateString('ru-RU', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    });
};

const getDurationString = (start: number, end: number) => {
    if (end <= 0 || end === -1) return "Навсегда";
    const diff = end - start;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 3650) return "Навсегда";
    if (days === 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        return `${hours}ч`;
    }
    return `${days}д`; 
};

type TabType = 'OVERVIEW' | 'WALLET' | 'STATS';
type TimeFilter = 'ALL' | 'WEEK' | 'DAY';
type TypeFilter = 'ALL' | 'BAN' | 'MUTE' | 'CHECK';

// --- HEROICONS SOLID SET ---
const Icons = {
    // Nav: Overview (Squares2x2)
    Overview: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h2.25a3 3 0 013 3v2.25a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm9.75 0a3 3 0 013-3H18a3 3 0 013 3v2.25a3 3 0 01-3 3h-2.25a3 3 0 01-3-3V6zM3 15.75a3 3 0 013-3h2.25a3 3 0 013 3V18a3 3 0 01-3 3H6a3 3 0 01-3-3v-2.25zm9.75 0a3 3 0 013-3H18a3 3 0 013 3V18a3 3 0 01-3 3h-2.25a3 3 0 01-3-3v-2.25z" clipRule="evenodd" />
        </svg>
    ),
    // Nav: Stats (ChartBar)
    Stats: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h2.25a3 3 0 013 3v2.25a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm9.75 0a3 3 0 013-3H18a3 3 0 013 3v2.25a3 3 0 01-3 3h-2.25a3 3 0 01-3-3V6zM3 15.75a3 3 0 013-3h2.25a3 3 0 013 3V18a3 3 0 01-3 3H6a3 3 0 01-3-3v-2.25zm9.75 0a3 3 0 013-3H18a3 3 0 013 3V18a3 3 0 01-3 3h-2.25a3 3 0 01-3-3v-2.25z" clipRule="evenodd" />
        </svg>
    ),
    // Nav: Wallet (Wallet)
    Wallet: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25zM3.75 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.5 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
        </svg>
    ),
    // Stats: Ban (Gavel / Hammer) - Standard Gavel
    Gavel: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
           <path fillRule="evenodd" d="M15.75 2.25a6.75 6.75 0 00-6.65 7.9l-6.5 6.5a3 3 0 004.24 4.24l6.5-6.5a6.75 6.75 0 102.41-12.14zm-2.8 12.9l-4.72 4.71a1.5 1.5 0 01-2.12-2.12l4.71-4.72a6.74 6.74 0 012.13 2.13z" clipRule="evenodd" />
        </svg>
    ),
    // Stats: Mute (Speaker X)
    Mute: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM17.78 9.22a.75.75 0 10-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 101.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 101.06-1.06L20.56 12l1.72-1.72a.75.75 0 10-1.06-1.06l-1.72 1.72-1.72-1.72z" />
        </svg>
    ),
    // Stats: Check (Clipboard Check)
    Inspect: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.53 7.22l-4.5 4.5a.75.75 0 01-1.06 0l-2.25-2.25a.75.75 0 011.06-1.06l1.72 1.72 3.97-3.97a.75.75 0 111.06 1.06z" clipRule="evenodd" />
        </svg>
    ),
    // Small Icon for Feed: Ban (Gavel)
    Ban: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
           <path fillRule="evenodd" d="M15.75 2.25a6.75 6.75 0 00-6.65 7.9l-6.5 6.5a3 3 0 004.24 4.24l6.5-6.5a6.75 6.75 0 102.41-12.14zm-2.8 12.9l-4.72 4.71a1.5 1.5 0 01-2.12-2.12l4.71-4.72a6.74 6.74 0 012.13 2.13z" clipRule="evenodd" />
        </svg>
    )
};


const UserProfile: React.FC<UserProfileProps> = ({ member, currentUser, onBack, onUpdate }) => {
  const isOwner = member.user.id === currentUser.id;
  const isAdmin = ALLOWED_ADMIN_IDS.includes(currentUser.id);

  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');
  const [ignInput, setIgnInput] = useState(member.ign || '');
  const [displayedName, setDisplayedName] = useState('');
  
  // Stats Filters
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');

  // Data State
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [economy, setEconomy] = useState<EconomyData | null>(null);
  const [loadingEconomy, setLoadingEconomy] = useState(false);
  
  // Actions State
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawIgn, setWithdrawIgn] = useState('');
  const [isWithdrawMode, setIsWithdrawMode] = useState(false);
  const [isProcessingTx, setIsProcessingTx] = useState(false);
  const [adminAmount, setAdminAmount] = useState('');

  useEffect(() => {
    setDisplayedName(member.ign || member.nick || member.user.global_name || member.user.username);
    setIgnInput(member.ign || '');
  }, [member]);

  useEffect(() => {
    if (member.ign) fetchStats(member.ign);
    if (isOwner || isAdmin) fetchEconomy(member.user.id);
  }, [member, isOwner, isAdmin]);

  const fetchStats = async (ign: string) => {
    setLoadingStats(true);
    try {
        const res = await fetch(`${API_BASE_URL}/api/stats/${ign}`);
        if (res.ok) setStats(await res.json());
    } catch (e) { console.error(e); } 
    finally { setLoadingStats(false); }
  };

  const fetchEconomy = async (userId: string) => {
      setLoadingEconomy(true);
      try {
          const res = await fetch(`${API_BASE_URL}/api/economy/${userId}`);
          if (res.ok) setEconomy(await res.json());
      } catch (e) { console.error(e); } 
      finally { setLoadingEconomy(false); }
  };

  const handleWithdraw = async () => {
      if (!isOwner) return;
      const amountVal = parseInt(withdrawAmount);
      
      if (!withdrawIgn.trim()) return alert("Введите никнейм!");
      if (isNaN(amountVal) || amountVal < 5000) return alert("Минимум 5000 AMT.");
      
      if (economy && amountVal > economy.balance) {
          return alert("Недостаточно средств на балансе!");
      }

      setIsProcessingTx(true);
      try {
          const res = await fetch(`${API_BASE_URL}/api/economy/withdraw`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: member.user.id, amount: withdrawAmount, ign: withdrawIgn.trim() })
          });
          if (res.ok) {
              setWithdrawAmount(''); setIsWithdrawMode(false); fetchEconomy(member.user.id);
              alert("Заявка на вывод создана!");
          } else { alert((await res.json()).error); }
      } catch (e) { alert("Ошибка сервера"); } 
      finally { setIsProcessingTx(false); }
  };

  const handleAdminManage = async (type: 'ADMIN_ADD' | 'ADMIN_REMOVE') => {
      if (!isAdmin) return;
      setIsProcessingTx(true);
      try {
          const res = await fetch(`${API_BASE_URL}/api/economy/admin/manage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ adminId: currentUser.id, targetUserId: member.user.id, amount: adminAmount, type })
          });
          if (res.ok) { setAdminAmount(''); fetchEconomy(member.user.id); } 
          else { alert((await res.json()).error); }
      } catch (e) { alert("Ошибка"); } 
      finally { setIsProcessingTx(false); }
  };

  const handleSaveIgn = async () => {
    if (!isAdmin) return;
    try {
        await updateMemberIgn(member.user.id, ignInput);
        onUpdate();
        alert("Ник обновлен");
    } catch (e) { alert("Ошибка"); } 
  };

  const roleDef = ROLE_HIERARCHY.find(r => member.roles.includes(r.id));
  const headUrl = member.ign ? `https://minotar.net/helm/${member.ign}/100.png` : (member.user.avatar ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png` : '');

  // --- FILTERING LOGIC ---
  const getFilteredData = () => {
      if (!stats) return [];
      let combined = [
          ...stats.bans.map(b => ({...b, type: 'BAN' as const, sort: b.time})),
          ...stats.mutes.map(m => ({...m, type: 'MUTE' as const, sort: m.time})),
          ...stats.checks.map(c => ({...c, type: 'CHECK' as const, sort: c.date, time: c.date})) 
      ];

      const now = Date.now();
      combined = combined.filter(item => {
          const t = Number(item.time);
          if (timeFilter === 'DAY') return (now - t) <= 86400000;
          if (timeFilter === 'WEEK') return (now - t) <= 604800000;
          return true;
      });

      combined = combined.filter(item => {
          if (typeFilter === 'ALL') return true;
          return item.type === typeFilter;
      });

      return combined.sort((a,b) => b.sort - a.sort);
  };

  const filteredHistory = getFilteredData();
  
  const getCount = (type: string) => {
      if (!stats) return 0;
      let list: any[] = [];
      if (type === 'BAN') list = stats.bans;
      if (type === 'MUTE') list = stats.mutes;
      if (type === 'CHECK') list = stats.checks;

      const now = Date.now();
      return list.filter(item => {
          const t = Number(item.time || item.date);
          if (timeFilter === 'DAY') return (now - t) <= 86400000;
          if (timeFilter === 'WEEK') return (now - t) <= 604800000;
          return true;
      }).length;
  };

  // Helper for Wallet History Splitting
  const getWalletHistory = () => {
      const all = economy?.history || [];
      const withdrawals = all.filter(t => t.type === 'WITHDRAW' || t.type === 'ADMIN_REMOVE');
      const incomes = all.filter(t => t.type !== 'WITHDRAW' && t.type !== 'ADMIN_REMOVE');
      return { withdrawals, incomes };
  };
  const { withdrawals, incomes } = getWalletHistory();

  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans p-6 flex flex-col items-center">
        
        {/* --- HEADER --- */}
        <div className="w-full max-w-6xl bg-[#0A0A0A] rounded-3xl border border-white/5 p-8 flex flex-col md:flex-row items-center gap-8 mb-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-900/10 blur-[120px] pointer-events-none"></div>

            {/* Avatar */}
            <div className="relative shrink-0 group">
                <div className={`absolute -inset-1 bg-gradient-to-br ${roleDef?.color || 'from-gray-700 to-gray-600'} rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500`}></div>
                <div className="relative w-32 h-32 rounded-2xl bg-[#151515] border border-white/10 overflow-hidden shadow-2xl">
                    {headUrl && <img src={headUrl} alt="Avatar" className="w-full h-full object-cover rendering-pixelated" style={{imageRendering: 'pixelated'}} />}
                </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left flex flex-col gap-2">
                <h1 className="text-4xl font-black uppercase tracking-tighter text-white">{displayedName}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <span className="text-gray-500 font-mono text-xs px-2 py-1 rounded bg-white/5 border border-white/5">@{member.user.username}</span>
                    {roleDef && (
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border ${roleDef.badgeBg}`}>
                            {roleDef.name}
                        </span>
                    )}
                    {member.ign && (
                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest bg-[#151515] text-gray-400 border border-white/5">
                            IGN: {member.ign}
                        </span>
                    )}
                </div>
            </div>

            {/* Nav */}
            <div className="flex gap-2 bg-[#111] p-1.5 rounded-xl border border-white/5 backdrop-blur-md">
                 <button onClick={() => setActiveTab('OVERVIEW')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'OVERVIEW' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                    <Icons.Overview /> Обзор
                 </button>
                 {(isOwner || isAdmin) && (
                     <button onClick={() => setActiveTab('WALLET')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'WALLET' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                        <Icons.Wallet /> Кошелек
                     </button>
                 )}
                 <button onClick={() => setActiveTab('STATS')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'STATS' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                    <Icons.Stats /> Статистика
                 </button>
                 <div className="w-px bg-white/10 mx-1"></div>
                 <button onClick={onBack} className="px-4 py-2.5 text-gray-500 hover:text-white text-[10px] font-bold uppercase transition-colors">✕</button>
            </div>
        </div>

        {/* --- CONTENT --- */}
        <div className="w-full max-w-6xl animate-fade-in">
            
            {/* === OVERVIEW === */}
            {activeTab === 'OVERVIEW' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Skin & Main Info */}
                    <div className="lg:col-span-1 bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 flex flex-col items-center relative overflow-hidden min-h-[500px]">
                        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent"></div>
                        
                        {/* 2D Skin */}
                        <div className="relative z-10 w-full flex-1 flex items-center justify-center py-6">
                            {member.ign ? (
                                <img 
                                    src={`https://mc-heads.net/body/${member.ign}/400`} 
                                    alt="Skin" 
                                    className="h-[350px] object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="text-gray-600 text-xs font-mono uppercase">Скин недоступен</div>
                            )}
                        </div>
                        {/* Quick Stats */}
                        <div className="w-full bg-[#151515] p-4 rounded-xl border border-white/5 text-center z-10">
                             <div className="text-xs text-gray-500 font-bold uppercase mb-1">Дата вступления</div>
                             <div className="text-white text-sm font-mono">{formatDate(member.joined_at)}</div>
                        </div>
                    </div>

                    {/* Right: Details */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Playtime Card */}
                        <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 blur-[80px] group-hover:bg-emerald-500/20 transition-all"></div>
                            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">Время на сервере</h3>
                            <div className="flex items-baseline gap-4 relative z-10">
                                <span className="text-7xl font-black text-white tracking-tighter">{stats?.playtime || 0}</span>
                                <span className="text-xl text-gray-500 font-medium">часов</span>
                            </div>
                        </div>

                        {/* Extra Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                             <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 flex flex-col justify-center">
                                 <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Icons.Overview /> Управление профилем
                                 </h3>
                                 <div className="space-y-4">
                                     <div>
                                         <label className="text-[10px] text-gray-600 uppercase font-bold block mb-2">Minecraft IGN</label>
                                         <div className="flex gap-2">
                                             <input 
                                                 value={ignInput}
                                                 onChange={(e) => setIgnInput(e.target.value)}
                                                 disabled={!isAdmin}
                                                 className="bg-[#151515] border border-white/10 rounded-lg px-3 py-2 text-sm text-white w-full outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                                             />
                                             {isAdmin && (
                                                 <button onClick={handleSaveIgn} className="bg-purple-600 hover:bg-purple-500 text-white px-4 rounded-lg text-xs font-bold transition-colors">OK</button>
                                             )}
                                         </div>
                                     </div>
                                 </div>
                             </div>
                             
                             {/* Account Info Card (Replaced Efficiency) */}
                             <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 flex flex-col justify-center">
                                 <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">
                                     Информация об аккаунте
                                 </h3>
                                 <div className="space-y-3">
                                     <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                         <span className="text-gray-500 text-xs font-bold">Роль</span>
                                         <span className={`text-xs font-mono px-2 py-0.5 rounded ${roleDef?.badgeBg || 'bg-gray-800'}`}>{roleDef?.name || 'User'}</span>
                                     </div>
                                     <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                         <span className="text-gray-500 text-xs font-bold">Discord ID</span>
                                         <span className="text-gray-300 text-xs font-mono">{member.user.id}</span>
                                     </div>
                                     <div className="flex justify-between items-center">
                                         <span className="text-gray-500 text-xs font-bold">Статус</span>
                                         <span className="text-emerald-500 text-xs font-bold uppercase">Активен</span>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {/* === WALLET === */}
            {activeTab === 'WALLET' && (
                <div className="flex flex-col gap-6">
                    {/* 1. CENTER: BALANCE + ACTION */}
                    <div className="w-full bg-gradient-to-br from-[#0F0F0F] to-[#050505] border border-white/5 rounded-3xl p-10 relative overflow-hidden flex flex-col items-center justify-center text-center shadow-2xl">
                         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
                         <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
                         
                         <div className="relative z-10">
                            <h3 className="text-white/40 text-xs font-black uppercase tracking-[0.3em] mb-4">Текущий Баланс</h3>
                            <div className="text-8xl md:text-9xl font-black text-white tracking-tighter drop-shadow-2xl mb-8 flex items-baseline justify-center">
                                {loadingEconomy ? "..." : economy?.balance.toLocaleString()}
                                <span className="text-2xl md:text-3xl text-gray-600 font-medium ml-4 tracking-normal">AMT</span>
                            </div>

                            {/* Main Action Button */}
                            {isOwner && (
                                <button 
                                    onClick={() => { setWithdrawIgn(member.ign || ''); setIsWithdrawMode(true); }}
                                    className="bg-white text-black hover:bg-gray-200 px-10 py-4 rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:-translate-y-1 active:translate-y-0"
                                >
                                    Вывести средства
                                </button>
                            )}
                         </div>
                    </div>

                    {/* 2. ADMIN PANEL (Conditional) */}
                    {isAdmin && !isOwner && (
                        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-lg">
                            <div className="flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                                <h3 className="text-white text-xs font-bold uppercase tracking-widest">Панель Администратора</h3>
                            </div>
                            <div className="flex-1 w-full flex items-center gap-2">
                                <input 
                                    type="number" 
                                    placeholder="Сумма" 
                                    value={adminAmount}
                                    onChange={e => setAdminAmount(e.target.value)}
                                    className="bg-[#050505] border border-white/10 rounded-lg px-4 py-2 text-sm text-white w-full outline-none focus:border-yellow-500/50"
                                />
                                <button onClick={() => handleAdminManage('ADMIN_ADD')} className="bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-emerald-900/50 transition-colors whitespace-nowrap">
                                    + Выдать
                                </button>
                                <button onClick={() => handleAdminManage('ADMIN_REMOVE')} className="bg-red-900/30 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-red-900/50 transition-colors whitespace-nowrap">
                                    - Забрать
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 3. SPLIT HISTORY: WITHDRAWALS (LEFT) | INCOME (RIGHT) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* LEFT: Withdrawals */}
                        <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 flex flex-col h-[400px]">
                            <h3 className="text-red-500 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> История выводов
                            </h3>
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                                {withdrawals.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-gray-700 text-xs font-bold uppercase tracking-widest">Нет выводов</div>
                                ) : (
                                    withdrawals.map(tx => (
                                        <div key={tx.id} className="flex justify-between items-center p-3 rounded-xl bg-[#111] border border-white/5 hover:border-white/10 transition-colors">
                                            <div>
                                                <div className="text-gray-300 text-xs font-bold">{tx.comment || 'Вывод средств'}</div>
                                                <div className="text-[10px] text-gray-600 font-mono">{formatDate(tx.date)}</div>
                                            </div>
                                            <div className="font-mono text-sm font-bold text-red-400">
                                                {tx.amount} AMT
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* RIGHT: Income */}
                        <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 flex flex-col h-[400px]">
                             <h3 className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> История пополнений
                            </h3>
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                                {incomes.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-gray-700 text-xs font-bold uppercase tracking-widest">Нет пополнений</div>
                                ) : (
                                    incomes.map(tx => (
                                        <div key={tx.id} className="flex justify-between items-center p-3 rounded-xl bg-[#111] border border-white/5 hover:border-white/10 transition-colors">
                                            <div>
                                                <div className="text-gray-300 text-xs font-bold">{tx.comment || tx.type}</div>
                                                <div className="text-[10px] text-gray-600 font-mono">{formatDate(tx.date)}</div>
                                            </div>
                                            <div className="font-mono text-sm font-bold text-emerald-400">
                                                +{tx.amount} AMT
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* === STATS === */}
            {activeTab === 'STATS' && (
                <div className="flex flex-col gap-8">
                    
                    {/* Filters */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0A0A0A] border border-white/5 p-2 rounded-2xl">
                        <div className="flex gap-1 bg-[#111] p-1 rounded-xl">
                            {(['ALL', 'BAN', 'MUTE', 'CHECK'] as const).map(t => (
                                <button 
                                    key={t}
                                    onClick={() => setTypeFilter(t)}
                                    className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${typeFilter === t ? 'bg-white text-black shadow-md' : 'text-gray-500 hover:text-white'}`}
                                >
                                    {t === 'ALL' ? 'Все' : t === 'BAN' ? 'Баны' : t === 'MUTE' ? 'Муты' : 'Проверки'}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-1 bg-[#111] p-1 rounded-xl">
                            {(['ALL', 'WEEK', 'DAY'] as const).map(t => (
                                <button 
                                    key={t}
                                    onClick={() => setTimeFilter(t)}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${timeFilter === t ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}
                                >
                                    {t === 'ALL' ? 'Все время' : t === 'WEEK' ? 'Неделя' : '24 Часа'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
                            <div className="absolute right-[-20px] bottom-[-20px] text-[#111] group-hover:text-red-900/20 transition-colors transform group-hover:scale-110 duration-500 w-32 h-32">
                                <Icons.Gavel />
                            </div>
                            <h3 className="text-red-500 text-xs font-black uppercase tracking-widest mb-2">Банов</h3>
                            <div className="text-6xl font-black text-white">{getCount('BAN')}</div>
                        </div>

                        <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
                             <div className="absolute right-[-20px] bottom-[-20px] text-[#111] group-hover:text-orange-900/20 transition-colors transform group-hover:scale-110 duration-500 w-32 h-32">
                                <Icons.Mute />
                            </div>
                            <h3 className="text-orange-500 text-xs font-black uppercase tracking-widest mb-2">Мутов</h3>
                            <div className="text-6xl font-black text-white">{getCount('MUTE')}</div>
                        </div>

                         <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
                             <div className="absolute right-[-20px] bottom-[-20px] text-[#111] group-hover:text-blue-900/20 transition-colors transform group-hover:scale-110 duration-500 w-32 h-32">
                                <Icons.Inspect />
                            </div>
                            <h3 className="text-blue-500 text-xs font-black uppercase tracking-widest mb-2">Проверок</h3>
                            <div className="text-6xl font-black text-white">{getCount('CHECK')}</div>
                        </div>
                    </div>

                    {/* History Feed */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between px-2">
                             <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Лента событий</div>
                             <div className="text-gray-600 text-[10px] font-mono">{filteredHistory.length} записей</div>
                        </div>

                        {filteredHistory.length === 0 ? (
                            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                <div className="text-gray-600 font-bold uppercase tracking-widest text-xs">Нет данных за выбранный период</div>
                            </div>
                        ) : (
                            filteredHistory.map((item, idx) => (
                                <div key={idx} className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6 group hover:border-white/10 transition-colors">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                        item.type === 'BAN' ? 'bg-red-500/10 text-red-500' : 
                                        item.type === 'MUTE' ? 'bg-orange-500/10 text-orange-500' : 
                                        'bg-blue-500/10 text-blue-500'
                                    }`}>
                                        <div className="w-6 h-6">
                                            {item.type === 'BAN' ? <Icons.Ban /> : item.type === 'MUTE' ? <Icons.Mute /> : <Icons.Inspect />}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                                item.type === 'BAN' ? 'bg-red-500/5 text-red-400' : 
                                                item.type === 'MUTE' ? 'bg-orange-500/5 text-orange-400' : 
                                                'bg-blue-500/5 text-blue-400'
                                            }`}>
                                                {item.type === 'BAN' ? 'Блокировка' : item.type === 'MUTE' ? 'Мут' : 'Проверка'}
                                            </span>
                                            <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                                                {formatDate(item.time)}
                                            </span>
                                        </div>
                                        <div className="text-white font-bold text-lg truncate pr-4">
                                            {item.type === 'CHECK' ? `Игрок: ${item.target}` : item.reason}
                                        </div>
                                        
                                        {/* DETAIL ROW */}
                                        <div className="flex flex-wrap gap-4 mt-2">
                                            {item.type === 'CHECK' ? (
                                                // Check Specific Details
                                                <div className="text-[11px] text-blue-400 font-mono flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                    Метод: <span className="text-white font-bold uppercase">{item.type /* contains 'Anydesk' or 'Discord' from backend map */}</span>
                                                </div>
                                            ) : (
                                                // Ban/Mute Details
                                                <>
                                                    <div className="text-[11px] text-gray-400 font-mono flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                                                        Срок: <span className="text-gray-300">{getDurationString(item.time, item.until)}</span>
                                                    </div>
                                                    <div className="text-[11px] text-gray-400 font-mono flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                                                        Истекает: <span className="text-gray-300">{item.until <= 0 ? 'Никогда' : formatDate(item.until)}</span>
                                                    </div>
                                                    {!item.active && (
                                                         <div className="text-[11px] text-emerald-500 font-mono flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                            Снят: {item.removed_by_name || 'System'}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* --- WITHDRAW MODAL --- */}
        {isWithdrawMode && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
                <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-2xl relative">
                    <button onClick={() => setIsWithdrawMode(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">✕</button>
                    
                    <div className="mb-6">
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Вывод средств</h3>
                        <p className="text-xs text-gray-500 mt-1">Средства будут зачислены на игровой аккаунт</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block tracking-widest">Никнейм</label>
                            <input type="text" value={withdrawIgn} onChange={(e) => setWithdrawIgn(e.target.value)} className="bg-[#151515] border border-white/10 w-full h-12 rounded-xl px-4 text-sm font-bold text-white outline-none focus:border-purple-500 transition-colors" placeholder="Steve" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block tracking-widest">Сумма (AMT)</label>
                            <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="5000" className="bg-[#151515] border border-white/10 w-full h-12 rounded-xl px-4 text-sm font-bold text-white outline-none focus:border-purple-500 transition-colors" />
                            <div className="text-right mt-1">
                                <span className="text-[10px] text-gray-600 font-mono">Баланс: {economy?.balance}</span>
                            </div>
                        </div>
                        <ModernButton onClick={handleWithdraw} isLoading={isProcessingTx} fullWidth className="h-12 mt-2 rounded-xl">Подтвердить</ModernButton>
                    </div>
                </div>
             </div>
        )}
    </div>
  );
};

export default UserProfile;