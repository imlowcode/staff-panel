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
    if (!ms) return '-';
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

// --- ICONS (Beautiful SVG Paths) ---
const Icons = {
    Ban: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>,
    Mute: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>,
    Check: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>,
    Wallet: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" /></svg>,
    Stats: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" /></svg>,
    Time: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Calendar: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
    Edit: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
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
    // Fetch economy if Owner OR Admin
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
      
      // Client-side validation for balance
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
          ...stats.checks.map(c => ({...c, type: 'CHECK' as const, sort: c.date, time: c.date})) // Normalize key
      ];

      // Time Filter
      const now = Date.now();
      combined = combined.filter(item => {
          if (timeFilter === 'DAY') return (now - item.time) <= 86400000;
          if (timeFilter === 'WEEK') return (now - item.time) <= 604800000;
          return true;
      });

      // Type Filter
      combined = combined.filter(item => {
          if (typeFilter === 'ALL') return true;
          return item.type === typeFilter;
      });

      return combined.sort((a,b) => b.sort - a.sort);
  };

  const filteredHistory = getFilteredData();
  
  // Calculate counts for badges based on current time filter (or all time)
  const getCount = (type: string) => {
      if (!stats) return 0;
      // Using filteredHistory length would respect both filters, 
      // but usually cards show total for the time period irrespective of type tab selected?
      // Let's make cards reactive to Time Filter ONLY, but independent of Type Filter tab to act as summaries.
      let list: any[] = [];
      if (type === 'BAN') list = stats.bans;
      if (type === 'MUTE') list = stats.mutes;
      if (type === 'CHECK') list = stats.checks; // Checks use 'date' not 'time'

      const now = Date.now();
      return list.filter(item => {
          const t = item.time || item.date;
          if (timeFilter === 'DAY') return (now - t) <= 86400000;
          if (timeFilter === 'WEEK') return (now - t) <= 604800000;
          return true;
      }).length;
  };

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
                    <Icons.Stats /> Обзор
                 </button>
                 {(isOwner || isAdmin) && (
                     <button onClick={() => setActiveTab('WALLET')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'WALLET' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                        <Icons.Wallet /> Кошелек
                     </button>
                 )}
                 <button onClick={() => setActiveTab('STATS')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'STATS' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                    <Icons.Ban /> Статистика
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

                        {/* Quick Stats below skin */}
                        <div className="w-full grid grid-cols-2 gap-3 z-10">
                             <div className="bg-[#151515] p-3 rounded-xl border border-white/5 text-center">
                                 <div className="text-xs text-gray-500 font-bold uppercase mb-1">Дата регистрации</div>
                                 <div className="text-white text-xs font-mono">{formatDate(member.joined_at)}</div>
                             </div>
                             <div className="bg-[#151515] p-3 rounded-xl border border-white/5 text-center">
                                 <div className="text-xs text-gray-500 font-bold uppercase mb-1">Активность</div>
                                 <div className="text-white text-xs font-mono">
                                     {loadingStats ? "..." : (stats ? stats.bans.length + stats.mutes.length + stats.checks.length : 0)} действий
                                 </div>
                             </div>
                        </div>
                    </div>

                    {/* Right: Details */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Playtime Card */}
                        <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 blur-[80px] group-hover:bg-emerald-500/20 transition-all"></div>
                            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Icons.Time /> Время на сервере
                            </h3>
                            <div className="flex items-baseline gap-4 relative z-10">
                                <span className="text-7xl font-black text-white tracking-tighter">{stats?.playtime || 0}</span>
                                <span className="text-xl text-gray-500 font-medium">часов</span>
                            </div>
                        </div>

                        {/* Extra Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                             <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 flex flex-col justify-center">
                                 <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Icons.Edit /> Управление профилем
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
                             
                             {/* Placeholder for future stats or badges */}
                             <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 flex items-center justify-center text-center">
                                 <div>
                                     <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                                         <Icons.Check />
                                     </div>
                                     <div className="text-gray-500 text-xs font-bold uppercase tracking-widest">Efficiency Rating</div>
                                     <div className="text-2xl font-black text-white mt-1">100%</div>
                                     <div className="text-[10px] text-gray-600 mt-2">Расчетная эффективность</div>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {/* === WALLET === */}
            {activeTab === 'WALLET' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Balance Card */}
                    <div className="lg:col-span-2 bg-gradient-to-br from-[#0F0F0F] to-[#050505] border border-white/5 rounded-3xl p-10 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] pointer-events-none"></div>
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
                        
                        <div className="relative z-10">
                            <h3 className="text-white/40 text-xs font-black uppercase tracking-[0.3em] mb-6">Баланс Кошелька</h3>
                            <div className="text-8xl font-black text-white tracking-tighter drop-shadow-2xl">
                                {loadingEconomy ? "..." : economy?.balance.toLocaleString()}
                                <span className="text-3xl text-gray-600 font-medium ml-4 tracking-normal">AMT</span>
                            </div>
                        </div>

                        {/* Owner Withdraw Controls */}
                        {isOwner && (
                             <div className="relative z-10 mt-8 pt-8 border-t border-white/5">
                                 <button 
                                     onClick={() => { setWithdrawIgn(member.ign || ''); setIsWithdrawMode(true); }}
                                     className="bg-white text-black hover:bg-gray-200 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-white/20 hover:-translate-y-1 active:translate-y-0"
                                 >
                                     Вывести на сервер
                                 </button>
                             </div>
                        )}
                    </div>

                    {/* Admin Panel (If viewing someone else) OR History */}
                    <div className="flex flex-col gap-6">
                        {isAdmin && !isOwner && (
                            <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
                                <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Панель Администратора
                                </h3>
                                <div className="flex flex-col gap-3">
                                    <input 
                                        type="number" 
                                        placeholder="Сумма" 
                                        value={adminAmount}
                                        onChange={e => setAdminAmount(e.target.value)}
                                        className="bg-[#050505] border border-white/10 rounded-lg px-4 py-3 text-sm text-white w-full outline-none focus:border-yellow-500/50"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => handleAdminManage('ADMIN_ADD')} className="bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-emerald-900/50 transition-colors">
                                            + Выдать
                                        </button>
                                        <button onClick={() => handleAdminManage('ADMIN_REMOVE')} className="bg-red-900/30 text-red-400 border border-red-500/30 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-red-900/50 transition-colors">
                                            - Забрать
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 flex-1 overflow-hidden flex flex-col">
                            <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-4">История</h3>
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                                {economy?.history.length === 0 ? (
                                    <div className="text-center text-gray-700 text-xs py-10">Пусто</div>
                                ) : (
                                    economy?.history.map(tx => (
                                        <div key={tx.id} className="flex justify-between items-center p-3 rounded-xl bg-[#111] border border-white/5 hover:border-white/10 transition-colors group">
                                            <div>
                                                <div className="text-gray-300 text-xs font-bold group-hover:text-white transition-colors">{tx.comment || tx.type}</div>
                                                <div className="text-[10px] text-gray-600 font-mono">{formatDate(tx.date)}</div>
                                            </div>
                                            <div className={`font-mono text-sm font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {tx.amount > 0 ? '+' : ''}{tx.amount}
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
                    
                    {/* Filters Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0A0A0A] border border-white/5 p-2 rounded-2xl">
                        {/* Type Tabs */}
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
                        
                        {/* Time Tabs */}
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

                    {/* KPI Cards (Reactive to Time Filter) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
                            <div className="absolute right-[-20px] bottom-[-20px] text-[#111] group-hover:text-red-900/20 transition-colors transform group-hover:scale-110 duration-500">
                                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                            </div>
                            <h3 className="text-red-500 text-xs font-black uppercase tracking-widest mb-2">Банов</h3>
                            <div className="text-6xl font-black text-white">{getCount('BAN')}</div>
                        </div>

                        <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
                             <div className="absolute right-[-20px] bottom-[-20px] text-[#111] group-hover:text-orange-900/20 transition-colors transform group-hover:scale-110 duration-500">
                                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>
                            </div>
                            <h3 className="text-orange-500 text-xs font-black uppercase tracking-widest mb-2">Мутов</h3>
                            <div className="text-6xl font-black text-white">{getCount('MUTE')}</div>
                        </div>

                         <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
                             <div className="absolute right-[-20px] bottom-[-20px] text-[#111] group-hover:text-blue-900/20 transition-colors transform group-hover:scale-110 duration-500">
                                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
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
                                    {/* Icon Box */}
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                        item.type === 'BAN' ? 'bg-red-500/10 text-red-500' : 
                                        item.type === 'MUTE' ? 'bg-orange-500/10 text-orange-500' : 
                                        'bg-blue-500/10 text-blue-500'
                                    }`}>
                                        {item.type === 'BAN' ? <Icons.Ban /> : item.type === 'MUTE' ? <Icons.Mute /> : <Icons.Check />}
                                    </div>

                                    {/* Content */}
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
                                                <Icons.Calendar /> {formatDate(item.time)}
                                            </span>
                                        </div>
                                        <div className="text-white font-bold text-lg truncate pr-4">
                                            {item.type === 'CHECK' ? `Игрок: ${item.target}` : item.reason}
                                        </div>
                                        {item.type !== 'CHECK' && (
                                            <div className="flex flex-wrap gap-4 mt-2">
                                                <div className="text-[11px] text-gray-400 font-mono flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                                                    Срок: <span className="text-gray-300">{getDurationString(item.time, item.until)}</span>
                                                </div>
                                                {!item.active && (
                                                     <div className="text-[11px] text-emerald-500 font-mono flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                        Снят: {item.removed_by_name || 'System'}
                                                    </div>
                                                )}
                                            </div>
                                        )}
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