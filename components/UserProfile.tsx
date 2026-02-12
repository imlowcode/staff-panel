import React, { useState, useEffect, useRef } from 'react';
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

// Форматирование даты (DD.MM.YYYY, HH:MM)
const formatDate = (ms: number | string) => {
    if (!ms) return '-';
    const date = new Date(typeof ms === 'string' ? ms : ms); 
    return date.toLocaleDateString('ru-RU', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    });
};

// Вычисляем дату истечения (для примера добавляем 30 дней, если пермач - пишем навсегда)
const getExpiryDate = (startDate: number, duration: number) => {
    if (duration <= 0 || duration === -1) return "Никогда";
    const end = new Date(startDate + duration); // duration usually in ms in LiteBans if stored, but logic varies. 
    // Assuming litebans 'until' column is absolute timestamp
    if (duration > 4102444800000) return "Никогда"; // > 2100 year
    return formatDate(duration);
};

// Функция расчета длительности (примерная)
const getDurationString = (start: number, end: number) => {
    if (end <= 0 || end === -1) return "Навсегда";
    const diff = end - start;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 3650) return "Навсегда";
    return `${days}д 0ч`; 
};

type TabType = 'OVERVIEW' | 'WALLET' | 'STATS';

const UserProfile: React.FC<UserProfileProps> = ({ member, currentUser, onBack, onUpdate }) => {
  const isOwner = member.user.id === currentUser.id;
  const isAdmin = ALLOWED_ADMIN_IDS.includes(currentUser.id);

  // Default tab logic: Owner gets Overview, others get Stats by default or Overview
  const [activeTab, setActiveTab] = useState<TabType>('STATS');
  
  const [ignInput, setIgnInput] = useState(member.ign || '');
  const [isSaving, setIsSaving] = useState(false);
  const [displayedName, setDisplayedName] = useState('');
  
  // Stats & Economy Data
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [economy, setEconomy] = useState<EconomyData | null>(null);
  const [loadingEconomy, setLoadingEconomy] = useState(false);
  
  // Actions
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawIgn, setWithdrawIgn] = useState('');
  const [isWithdrawMode, setIsWithdrawMode] = useState(false);
  const [isProcessingTx, setIsProcessingTx] = useState(false);
  const [adminAmount, setAdminAmount] = useState('');

  // 3D
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const skinViewerRef = useRef<any>(null);
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    setDisplayedName(member.ign || member.nick || member.user.global_name || member.user.username);
    setIgnInput(member.ign || '');
    // Если мы не владелец и пытаемся зайти в кошелек (например, по стейту) - сбрасываем
    if (!isOwner && activeTab === 'WALLET') setActiveTab('STATS');
  }, [member, isOwner]);

  useEffect(() => {
    if (member.ign) fetchStats(member.ign);
    if (isOwner || isAdmin) fetchEconomy(member.user.id);
  }, [member]);

  // 3D Viewer Logic (Only render when OVERVIEW tab is active)
  useEffect(() => {
      if (activeTab !== 'OVERVIEW' || !member.ign) return;
      
      const initViewer = () => {
          if (!canvasRef.current) return;
          try {
                if (skinViewerRef.current) {
                    skinViewerRef.current.dispose();
                    skinViewerRef.current = null;
                }
                const skinview3d = (window as any).skinview3d;
                if (!skinview3d) return;

                const viewer = new skinview3d.SkinViewer({
                    canvas: canvasRef.current,
                    width: 300,
                    height: 400,
                    skin: `https://mc-heads.net/skin/${member.ign}`,
                    alpha: true
                });
                viewer.width = 300; 
                viewer.height = 400;
                viewer.fov = 70;
                viewer.zoom = 0.8;
                viewer.autoRotate = autoRotate;
                viewer.animation = new skinview3d.WalkingAnimation();
                skinViewerRef.current = viewer;
          } catch (e) { console.error(e); }
      };

      if ((window as any).skinview3d) initViewer();
      else {
          // Load script fallback
          const script = document.createElement('script');
          script.src = "https://cdn.jsdelivr.net/npm/skinview3d@3.0.0-alpha.1/dist/skinview3d.bundle.js";
          script.async = true;
          script.onload = () => setTimeout(initViewer, 100);
          document.body.appendChild(script);
      }
      return () => { if (skinViewerRef.current) skinViewerRef.current.dispose(); };
  }, [activeTab, member.ign]);

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
      if (!withdrawIgn.trim() || !withdrawAmount || parseInt(withdrawAmount) < 5000) {
           alert("Некорректные данные. Минимум 5000 AMT.");
           return;
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

  // IGN Update
  const handleSaveIgn = async () => {
    if (!isAdmin) return;
    setIsSaving(true);
    try {
        await updateMemberIgn(member.user.id, ignInput);
        onUpdate();
        alert("Ник обновлен");
    } catch (e) { alert("Ошибка"); } 
    finally { setIsSaving(false); }
  };

  const roleDef = ROLE_HIERARCHY.find(r => member.roles.includes(r.id));
  const headUrl = member.ign ? `https://minotar.net/helm/${member.ign}/100.png` : (member.user.avatar ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png` : '');

  // Prepare punishment history for display
  const history = stats ? [
      ...stats.bans.map(b => ({...b, type: 'BAN', sort: b.time})),
      ...stats.mutes.map(m => ({...m, type: 'MUTE', sort: m.time}))
  ].sort((a,b) => b.sort - a.sort) : [];

  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans p-6 flex flex-col items-center">
        
        {/* --- HEADER CARD --- */}
        <div className="w-full max-w-6xl bg-[#0A0A0A] rounded-3xl border border-white/5 p-6 flex flex-col md:flex-row items-start md:items-center gap-6 mb-8 shadow-2xl relative overflow-hidden">
            {/* Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-900/10 blur-[100px] pointer-events-none"></div>

            {/* Avatar Box */}
            <div className="relative shrink-0">
                <div className="w-32 h-32 rounded-2xl bg-[#151515] border border-white/10 overflow-hidden flex items-center justify-center shadow-lg">
                    {headUrl ? (
                        <img src={headUrl} alt="Avatar" className="w-full h-full object-cover rendering-pixelated" style={{imageRendering: 'pixelated'}} />
                    ) : (
                        <div className="text-gray-600 text-xs">No Skin</div>
                    )}
                </div>
            </div>

            {/* User Info */}
            <div className="flex-1 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-black uppercase tracking-tighter">{displayedName}</h1>
                    <span className="bg-white/5 text-gray-400 px-2 py-1 rounded text-[10px] font-mono border border-white/5">
                        @{member.user.username}
                    </span>
                </div>
                
                {/* Role & Status */}
                <div className="flex flex-wrap items-center gap-2">
                    {roleDef && (
                        <span className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${roleDef.badgeBg.replace('bg-opacity-20', 'bg-opacity-10')}`}>
                            {roleDef.name}
                        </span>
                    )}
                    <span className="px-3 py-1 rounded bg-white/5 border border-white/5 text-gray-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span> OFFLINE
                    </span>
                </div>

                {/* Meta Data Row */}
                <div className="flex flex-wrap items-center gap-2 mt-1">
                    <div className="bg-[#111] px-3 py-1.5 rounded border border-white/5 text-[10px] text-gray-500 font-mono flex items-center gap-2">
                        ID: <span className="text-gray-300">{member.user.id}</span>
                    </div>
                    <div className="bg-[#111] px-3 py-1.5 rounded border border-white/5 text-[10px] text-gray-500 font-mono flex items-center gap-2">
                        ⚠ WARNS: <span className="text-white">0</span>
                    </div>
                    {member.ign && (
                        <div className="bg-[#111] px-3 py-1.5 rounded border border-white/5 text-[10px] text-gray-500 font-mono flex items-center gap-2">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>
                            IGN: <span className="text-white">{member.ign}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-row md:flex-col gap-2 self-stretch md:self-center justify-center">
                 <button onClick={onBack} className="bg-[#151515] hover:bg-[#202020] text-gray-400 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-white/5 transition-all">
                    Назад
                 </button>
                 <div className="h-px w-full bg-white/5 my-1 hidden md:block"></div>
                 <div className="flex gap-2 bg-[#111] p-1 rounded-lg border border-white/5">
                     <button 
                        onClick={() => setActiveTab('OVERVIEW')}
                        className={`px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'OVERVIEW' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                     >
                        Обзор
                     </button>
                     {/* RESTRICTED: Wallet only for Owner */}
                     {isOwner && (
                         <button 
                            onClick={() => setActiveTab('WALLET')}
                            className={`px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'WALLET' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                         >
                            Кошелек
                         </button>
                     )}
                     <button 
                        onClick={() => setActiveTab('STATS')}
                        className={`px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'STATS' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                     >
                        Статистика
                     </button>
                 </div>
            </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="w-full max-w-6xl animate-fade-in">
            
            {/* ================= STATS TAB ================= */}
            {activeTab === 'STATS' && (
                <div className="flex flex-col gap-8">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7]"></div>
                        <h2 className="text-xl font-bold uppercase tracking-widest">Статистика Сервера</h2>
                        
                        <div className="ml-auto flex gap-1 bg-[#111] p-1 rounded-lg border border-white/5">
                            <span className="px-3 py-1 bg-white text-black rounded text-[10px] font-bold uppercase">Все время</span>
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Bans */}
                        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
                            <div className="relative z-10">
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Всего банов</div>
                                <div className="text-5xl font-black text-white">{stats?.bans.length || 0}</div>
                                <div className="text-[9px] text-gray-600 font-mono mt-2">LITEBANS DB</div>
                            </div>
                            <div className="absolute top-1/2 right-4 -translate-y-1/2 text-[#151515] group-hover:text-[#1a1a1a] transition-colors">
                                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M19.424 19.424a1.875 1.875 0 11-2.651-2.651L19.424 19.424zM16.773 16.773a1.875 1.875 0 11-2.652-2.652L16.773 16.773zM14.121 14.121a1.875 1.875 0 11-2.651-2.651l2.651 2.651zM11.47 11.47a1.875 1.875 0 11-2.652-2.652L11.47 11.47zM3.818 9.879a1.875 1.875 0 010-2.652l5.303-5.303a1.875 1.875 0 012.652 0l7.954 7.954a1.875 1.875 0 010 2.652l-5.303 5.303a1.875 1.875 0 01-2.652 0L3.818 9.879z" /></svg>
                            </div>
                        </div>
                        {/* Mutes */}
                        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
                             <div className="relative z-10">
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Всего мутов</div>
                                <div className="text-5xl font-black text-white">{stats?.mutes.length || 0}</div>
                                <div className="text-[9px] text-gray-600 font-mono mt-2">LITEBANS DB</div>
                            </div>
                            <div className="absolute top-1/2 right-4 -translate-y-1/2 text-[#151515] group-hover:text-[#1a1a1a] transition-colors">
                                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                            </div>
                        </div>
                        {/* Checks */}
                        <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
                             <div className="relative z-10">
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Проверок</div>
                                <div className="text-5xl font-black text-white">{stats?.checks.length || 0}</div>
                                <div className="text-[9px] text-gray-600 font-mono mt-2">CHECKS DB</div>
                            </div>
                            <div className="absolute top-1/2 right-4 -translate-y-1/2 text-[#151515] group-hover:text-[#1a1a1a] transition-colors">
                                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* History List */}
                    <div className="flex flex-col gap-4 mt-4">
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">История наказаний</div>
                        
                        {history.length === 0 ? (
                            <div className="p-8 text-center text-gray-600 border border-dashed border-white/5 rounded-xl">История пуста</div>
                        ) : (
                            history.map((item, idx) => (
                                <div key={idx} className="bg-[#0D0D0D] border border-white/5 rounded-xl p-5 flex flex-col gap-2 relative group hover:border-white/10 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${item.type === 'BAN' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                            {item.type === 'BAN' ? (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold text-white">{item.reason || "Нет причины"}</div>
                                            <div className="text-[10px] text-gray-500 font-mono">Выдан: {formatDate(item.time)}</div>
                                        </div>
                                    </div>
                                    
                                    {/* Badges Row */}
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <div className="bg-[#151515] border border-white/5 rounded px-2 py-1 flex items-center gap-2">
                                            <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <span className="text-[10px] text-gray-400 font-mono">Срок: {getDurationString(item.time, item.until)}</span>
                                        </div>
                                        <div className="bg-[#151515] border border-white/5 rounded px-2 py-1 flex items-center gap-2">
                                            <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            <span className="text-[10px] text-gray-400 font-mono">Истекает: {getExpiryDate(item.time, item.until)}</span>
                                        </div>
                                        {!item.active && (
                                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded px-2 py-1 flex items-center gap-2">
                                                <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                <span className="text-[10px] text-emerald-400 font-bold uppercase">Снят: {item.removed_by_name || "System"}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ================= WALLET TAB (RESTRICTED) ================= */}
            {activeTab === 'WALLET' && isOwner && (
                <div className="flex flex-col gap-6">
                     <div className="w-full rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 p-8 text-center relative overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="text-white/60 text-[10px] font-bold uppercase tracking-[0.3em] mb-4">Текущий баланс</div>
                            <div className="text-7xl font-black text-white tracking-tighter drop-shadow-xl mb-8">
                                {economy?.balance.toLocaleString()} <span className="text-3xl opacity-50 font-medium">AMT</span>
                            </div>
                            <button 
                                onClick={() => { setWithdrawIgn(member.ign || ''); setIsWithdrawMode(true); }}
                                className="bg-white text-black px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                            >
                                Вывести средства
                            </button>
                        </div>
                     </div>

                     {/* История транзакций */}
                     <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Последние операции</h3>
                        <div className="flex flex-col gap-2">
                            {economy?.history.length === 0 ? (
                                <div className="text-gray-600 text-center py-4 text-xs">История пуста</div>
                            ) : (
                                economy?.history.map(tx => (
                                    <div key={tx.id} className="flex justify-between items-center p-3 rounded-lg bg-[#111] border border-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-white text-xs font-bold">{tx.comment || tx.type}</span>
                                            <span className="text-[10px] text-gray-500 font-mono">{formatDate(tx.date)}</span>
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
            )}

            {/* ================= OVERVIEW TAB ================= */}
            {activeTab === 'OVERVIEW' && (
                 <div className="flex flex-col md:flex-row gap-6">
                     <div className="flex-1 bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                         <div>
                            <h3 className="text-xl font-bold text-white mb-2">Информация</h3>
                            <div className="space-y-4 mt-6">
                                <div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Наигранное время</div>
                                    <div className="text-3xl font-black text-white">{stats?.playtime || 0} <span className="text-sm font-medium text-gray-500">часов</span></div>
                                </div>
                                {isAdmin && (
                                    <div className="pt-4 border-t border-white/5">
                                        <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Управление Ником (Admin)</div>
                                        <div className="flex gap-2">
                                            <input 
                                                className="glass-input h-8 px-3 rounded text-xs w-full bg-[#111]"
                                                value={ignInput}
                                                onChange={e => setIgnInput(e.target.value)}
                                            />
                                            <button onClick={handleSaveIgn} className="bg-white/10 px-3 rounded text-xs hover:bg-white/20">OK</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                         </div>
                     </div>
                     <div className="w-full md:w-[400px] h-[500px] bg-[#0A0A0A] border border-white/5 rounded-2xl relative flex items-center justify-center overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none"></div>
                         <canvas ref={canvasRef} className="cursor-grab active:cursor-grabbing relative z-10" />
                         <div className="absolute bottom-4 left-4 z-20">
                             <button onClick={() => setAutoRotate(!autoRotate)} className="text-gray-500 hover:text-white text-[10px] font-bold uppercase bg-black/50 px-2 py-1 rounded backdrop-blur">
                                {autoRotate ? 'Stop Rotate' : 'Rotate'}
                             </button>
                         </div>
                     </div>
                 </div>
            )}
        </div>

        {/* --- WITHDRAW MODAL --- */}
        {isWithdrawMode && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
                    <button onClick={() => setIsWithdrawMode(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
                    <h3 className="text-xl font-bold text-white mb-6">Вывод средств</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Никнейм</label>
                            <input type="text" value={withdrawIgn} onChange={(e) => setWithdrawIgn(e.target.value)} className="glass-input w-full h-10 rounded-lg px-3 text-sm font-mono" />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Сумма (AMT)</label>
                            <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="Min 5000" className="glass-input w-full h-10 rounded-lg px-3 text-sm font-mono" />
                        </div>
                        <ModernButton onClick={handleWithdraw} isLoading={isProcessingTx} fullWidth className="h-10 mt-2">Подтвердить</ModernButton>
                    </div>
                </div>
             </div>
        )}
    </div>
  );
};

export default UserProfile;