import React, { useState, useEffect, useMemo } from 'react';
import { GuildMember, DiscordUser, PlayerStats, EconomyData } from '../types';
import { ROLE_HIERARCHY, ALLOWED_ADMIN_IDS, API_BASE_URL } from '../constants';
import ModernButton from './MinecraftButton';
import { updateMemberIgn } from '../services/discordService';

interface UserProfileProps {
  member: GuildMember;
  currentUser: DiscordUser;
  onBack: () => void;
  onUpdate: () => void;
  onShowToast: (msg: string, type: 'success' | 'error') => void;
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

// Функция для очистки и сокращения текста транзакции
const formatTransactionComment = (comment: string | undefined): string => {
    if (!comment) return '';
    let cleaned = comment.replace(/\[ID:.*?\]/g, '').trim();
    if (cleaned.startsWith('Зарплата за проверку')) cleaned = cleaned.replace('Зарплата за проверку', 'Проверка:');
    else if (cleaned.startsWith('Зарплата за бан')) cleaned = cleaned.replace('Зарплата за бан', 'Бан:');
    else if (cleaned.startsWith('Зарплата за мут')) cleaned = cleaned.replace('Зарплата за мут', 'Мут:');
    return cleaned;
};

type TabType = 'OVERVIEW' | 'WALLET' | 'STATS';
type TimeFilter = 'ALL' | 'WEEK' | 'DAY';
type TypeFilter = 'ALL' | 'BAN' | 'MUTE' | 'CHECK';
type WalletTimeFilter = 'ALL' | 'MONTH' | 'WEEK' | 'DAY';

// --- FEATHER ICONS ---
const Icons = {
    Overview: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
    Wallet: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>,
    Stats: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
    Ban: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>,
    Mute: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>,
    Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M9 14l2 2 4-4"></path></svg>,
    Edit: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
    Close: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
    Clock: () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
    User: () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
    Inbox: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>,
    ArrowUp: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>,
    ArrowDown: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>,
    Search: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
    Alert: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
};

// --- COMPONENTS ---
const EmptyState = ({ label }: { label: string }) => (
    <div className="flex flex-col items-center justify-center h-full py-16 text-center opacity-40">
        <div className="bg-white/5 p-4 rounded-full mb-3 text-white">
             <Icons.Inbox />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
    </div>
);

// --- CHARTS (SVG) ---
const ActivityBarChart = ({ stats }: { stats: PlayerStats }) => {
    // Generate last 7 days data
    const data = useMemo(() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0,0,0,0);
            const ts = d.getTime();
            
            // Count logic
            const dayEnd = ts + 86400000;
            const count = 
                stats.bans.filter(b => b.time >= ts && b.time < dayEnd).length +
                stats.mutes.filter(m => m.time >= ts && m.time < dayEnd).length +
                stats.checks.filter(c => c.date >= ts && c.date < dayEnd).length;
                
            days.push({ label: d.toLocaleDateString('ru-RU', {weekday: 'short'}), count });
        }
        return days;
    }, [stats]);

    const max = Math.max(...data.map(d => d.count), 5); // Min max is 5

    return (
        <div className="h-32 flex items-end justify-between gap-2">
            {data.map((d, i) => {
                const height = (d.count / max) * 100;
                return (
                    <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                         <div className="relative w-full flex justify-center items-end h-full">
                            <div 
                                style={{ height: `${height}%` }} 
                                className="w-full max-w-[24px] bg-white/10 rounded-t-sm group-hover:bg-purple-500 transition-all duration-500 relative min-h-[4px]"
                            >
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white text-black text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {d.count}
                                </div>
                            </div>
                         </div>
                         <span className="text-[9px] font-mono uppercase text-gray-600 group-hover:text-gray-400">{d.label}</span>
                    </div>
                );
            })}
        </div>
    );
};

const DistributionChart = ({ stats }: { stats: PlayerStats }) => {
    const total = stats.bans.length + stats.mutes.length + stats.checks.length;
    if (total === 0) return <div className="text-[10px] text-gray-600 text-center py-10">Нет данных</div>;

    const banP = (stats.bans.length / total) * 100;
    const muteP = (stats.mutes.length / total) * 100;
    const checkP = (stats.checks.length / total) * 100;

    // SVG Dasharray logic for donut
    const r = 40;
    const c = 2 * Math.PI * r;
    
    const off1 = c - (banP / 100) * c;
    const off2 = c - (muteP / 100) * c;
    const off3 = c - (checkP / 100) * c;

    return (
        <div className="flex items-center gap-6">
            <div className="relative w-24 h-24">
                <svg width="100%" height="100%" viewBox="0 0 100 100" className="-rotate-90">
                    <circle cx="50" cy="50" r={r} fill="transparent" stroke="#222" strokeWidth="12" />
                    {/* Bans - Red */}
                    <circle cx="50" cy="50" r={r} fill="transparent" stroke="#ef4444" strokeWidth="12" strokeDasharray={c} strokeDashoffset={off1} />
                    {/* Mutes - Orange (stacked by rotation, simplified here by dashoffset math tricks usually, but lets do simple overlay for now or segments) 
                        Actually simpler: Use segments. 
                    */}
                </svg>
                {/* Simplified CSS Conic Gradient is better for simple donuts */}
                <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: `conic-gradient(
                            #ef4444 0% ${banP}%, 
                            #f97316 ${banP}% ${banP + muteP}%, 
                            #3b82f6 ${banP + muteP}% 100%
                        )`,
                        mask: 'radial-gradient(transparent 55%, black 56%)',
                        WebkitMask: 'radial-gradient(transparent 55%, black 56%)'
                    }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-lg font-black text-white">{total}</span>
                    <span className="text-[8px] uppercase text-gray-500 tracking-wider">Всего</span>
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span> Баны ({stats.bans.length})
                </div>
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span> Муты ({stats.mutes.length})
                </div>
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Проверки ({stats.checks.length})
                </div>
            </div>
        </div>
    );
};

const UserProfile: React.FC<UserProfileProps> = ({ member, currentUser, onBack, onUpdate, onShowToast }) => {
  const isOwner = member.user.id === currentUser.id;
  const isAdmin = ALLOWED_ADMIN_IDS.includes(currentUser.id);

  const [activeTab, setActiveTab] = useState<TabType>('OVERVIEW');
  const [ignInput, setIgnInput] = useState(member.ign || '');
  const [displayedName, setDisplayedName] = useState('');
  
  // Stats Filters
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');

  // Wallet Filters
  const [walletSearch, setWalletSearch] = useState('');
  const [walletTimeFilter, setWalletTimeFilter] = useState<WalletTimeFilter>('ALL');

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
  
  // Admin Confirm State
  const [adminAmount, setAdminAmount] = useState('');
  const [adminAction, setAdminAction] = useState<{ type: 'ADMIN_ADD' | 'ADMIN_REMOVE', amount: string } | null>(null);
  const [showAdminConfirm, setShowAdminConfirm] = useState(false);

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
      
      if (!withdrawIgn.trim()) return onShowToast("Введите никнейм!", 'error');
      if (isNaN(amountVal) || amountVal < 5000) return onShowToast("Минимум 5000 ₪.", 'error');
      
      if (economy && amountVal > economy.balance) {
          return onShowToast("Недостаточно средств на балансе!", 'error');
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
              onShowToast("Заявка на вывод создана!", 'success');
          } else { 
              const data = await res.json();
              onShowToast(data.error || "Ошибка", 'error'); 
          }
      } catch (e) { onShowToast("Ошибка сервера", 'error'); } 
      finally { setIsProcessingTx(false); }
  };

  const initiateAdminAction = (type: 'ADMIN_ADD' | 'ADMIN_REMOVE') => {
    if (!adminAmount || isNaN(parseInt(adminAmount)) || parseInt(adminAmount) <= 0) {
        onShowToast("Введите корректную сумму", 'error');
        return;
    }
    setAdminAction({ type, amount: adminAmount });
    setShowAdminConfirm(true);
  };

  const confirmAdminAction = async () => {
      if (!isAdmin || !adminAction) return;
      setIsProcessingTx(true);
      try {
          const res = await fetch(`${API_BASE_URL}/api/economy/admin/manage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  adminId: currentUser.id, 
                  targetUserId: member.user.id, 
                  amount: adminAction.amount, 
                  type: adminAction.type 
              })
          });
          if (res.ok) { 
              setAdminAmount(''); fetchEconomy(member.user.id); 
              onShowToast(adminAction.type === 'ADMIN_ADD' ? 'Средства выданы' : 'Средства сняты', 'success');
              setShowAdminConfirm(false);
              setAdminAction(null);
          } 
          else { 
              const data = await res.json();
              onShowToast(data.error, 'error'); 
          }
      } catch (e) { onShowToast("Ошибка соединения", 'error'); } 
      finally { setIsProcessingTx(false); }
  };

  const handleSaveIgn = async () => {
    if (!isAdmin) return;
    try {
        await updateMemberIgn(member.user.id, ignInput);
        onUpdate();
        onShowToast("Игровой ник обновлен", 'success');
    } catch (e) { onShowToast("Ошибка сохранения", 'error'); } 
  };

  const roleDef = ROLE_HIERARCHY.find(r => member.roles.includes(r.id));
  const headUrl = member.ign ? `https://minotar.net/helm/${member.ign}/100.png` : (member.user.avatar ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png` : '');

  // --- FILTERING LOGIC ---
  const getFilteredData = () => {
      if (!stats) return [];
      let combined = [
          ...stats.bans.map(b => ({...b, type: 'BAN' as const, sort: b.time})),
          ...stats.mutes.map(m => ({...m, type: 'MUTE' as const, sort: m.time})),
          // Store original Check type (Anydesk/Discord) in `checkMethod` and use generic `CHECK` type for filtering
          ...stats.checks.map(c => ({...c, type: 'CHECK' as const, checkMethod: c.type, sort: c.date, time: c.date})) 
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

  const { withdrawals, incomes } = useMemo(() => {
      let all = economy?.history || [];
      
      // Filter by Search
      if (walletSearch) {
          const lower = walletSearch.toLowerCase();
          all = all.filter(t => 
             (t.comment && t.comment.toLowerCase().includes(lower)) || 
             t.amount.toString().includes(lower) || 
             t.type.toLowerCase().includes(lower)
          );
      }

      // Filter by Time
      const now = Date.now();
      all = all.filter(t => {
          if (walletTimeFilter === 'DAY') return (now - t.date) <= 86400000;
          if (walletTimeFilter === 'WEEK') return (now - t.date) <= 604800000;
          if (walletTimeFilter === 'MONTH') return (now - t.date) <= 2592000000;
          return true;
      });

      const withdrawals = all.filter(t => t.type === 'WITHDRAW' || t.type === 'ADMIN_REMOVE');
      const incomes = all.filter(t => t.type !== 'WITHDRAW' && t.type !== 'ADMIN_REMOVE');
      return { withdrawals, incomes };
  }, [economy, walletSearch, walletTimeFilter]);

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
                 <button onClick={onBack} className="px-4 py-2.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                    <Icons.Close />
                 </button>
            </div>
        </div>

        {/* --- CONTENT --- */}
        <div className="w-full max-w-6xl animate-fade-in">
            
            {/* === OVERVIEW === */}
            {activeTab === 'OVERVIEW' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Skin & Main Info */}
                    <div className="lg:col-span-1 bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 flex flex-col items-center relative overflow-hidden min-h-[400px]">
                        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent"></div>
                        
                        {/* 2D Skin */}
                        <div className="relative z-10 w-full flex-1 flex items-end justify-center pb-4">
                            {member.ign ? (
                                <img 
                                    src={`https://mc-heads.net/body/${member.ign}/400`} 
                                    alt="Skin" 
                                    className="h-[300px] w-auto object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="text-gray-600 text-xs font-mono uppercase">Скин недоступен</div>
                            )}
                        </div>
                        {/* Quick Stats */}
                        <div className="w-full bg-[#151515] p-3 rounded-xl border border-white/5 text-center z-10 mt-auto">
                             <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Дата вступления</div>
                             <div className="text-white text-xs font-mono">{formatDate(member.joined_at)}</div>
                        </div>
                    </div>

                    {/* Right: Details */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Playtime Card */}
                        <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 blur-[80px] group-hover:bg-emerald-500/20 transition-all"></div>
                            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">Время на сервере</h3>
                            <div className="flex items-baseline gap-4 relative z-10">
                                <span className="text-7xl font-black text-white tracking-tighter">{stats?.playtime || 0}</span>
                                <span className="text-xl text-gray-500 font-medium">часов</span>
                            </div>
                        </div>

                        {/* Extra Grid - Consolidated Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                             <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 flex flex-col justify-center">
                                 <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Icons.Edit /> Управление профилем
                                 </h3>
                                 <div className="space-y-3">
                                     <div>
                                         <label className="text-[10px] text-gray-600 uppercase font-bold block mb-1">Minecraft IGN</label>
                                         <div className="flex gap-2">
                                             <input 
                                                 value={ignInput}
                                                 onChange={(e) => setIgnInput(e.target.value)}
                                                 disabled={!isAdmin}
                                                 className="bg-[#151515] border border-white/10 rounded-lg px-3 py-2 text-xs text-white w-full outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                                             />
                                             {isAdmin && (
                                                 <button onClick={handleSaveIgn} className="bg-purple-600 hover:bg-purple-500 text-white px-3 rounded-lg text-xs font-bold transition-colors">OK</button>
                                             )}
                                         </div>
                                     </div>
                                 </div>
                             </div>
                             
                             {/* Account Info Card - More Compact */}
                             <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 flex flex-col justify-center">
                                 <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">
                                     Информация
                                 </h3>
                                 <div className="space-y-2">
                                     <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                         <span className="text-gray-500 text-[10px] font-bold">Роль</span>
                                         <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${roleDef?.badgeBg || 'bg-gray-800'}`}>{roleDef?.name || 'User'}</span>
                                     </div>
                                     <div className="flex justify-between items-center pb-2 border-b border-white/5">
                                         <span className="text-gray-500 text-[10px] font-bold">Discord ID</span>
                                         <span className="text-gray-300 text-[10px] font-mono truncate max-w-[120px]">{member.user.id}</span>
                                     </div>
                                     <div className="flex justify-between items-center">
                                         <span className="text-gray-500 text-[10px] font-bold">Статус</span>
                                         <span className="text-emerald-500 text-[10px] font-bold uppercase">Активен</span>
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
                    <div className="w-full bg-[#050505] border border-white/5 rounded-3xl p-10 relative overflow-hidden flex flex-col items-center justify-center text-center shadow-2xl group">
                         {/* Glow Effects */}
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none group-hover:bg-purple-900/15 transition-all duration-1000"></div>
                         <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-blue-600/5 rounded-full blur-[80px] pointer-events-none"></div>

                         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                         
                         <div className="relative z-10">
                            <h3 className="text-white/40 text-xs font-black uppercase tracking-[0.3em] mb-4">Текущий Баланс</h3>
                            <div className="text-7xl md:text-8xl font-black text-white tracking-tighter drop-shadow-2xl mb-8 flex items-start justify-center">
                                {loadingEconomy ? "..." : economy?.balance.toLocaleString()}
                                <span className="text-4xl md:text-5xl text-gray-500 font-medium ml-2 relative top-2">₪</span>
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
                                <button onClick={() => initiateAdminAction('ADMIN_ADD')} className="bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-emerald-900/50 transition-colors whitespace-nowrap">
                                    + Выдать
                                </button>
                                <button onClick={() => initiateAdminAction('ADMIN_REMOVE')} className="bg-red-900/30 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-red-900/50 transition-colors whitespace-nowrap">
                                    - Забрать
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* 3. HISTORY FILTERS */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0A0A0A] border border-white/5 p-2 rounded-2xl">
                         <div className="relative w-full md:w-64">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                <Icons.Search />
                             </div>
                             <input 
                                type="text"
                                placeholder="Поиск по истории..."
                                value={walletSearch}
                                onChange={(e) => setWalletSearch(e.target.value)}
                                className="bg-[#151515] border border-white/10 text-white text-xs rounded-xl block w-full pl-10 p-2.5 outline-none focus:border-purple-500/50 transition-colors"
                             />
                         </div>
                         <div className="flex gap-1 bg-[#111] p-1 rounded-xl w-full md:w-auto overflow-x-auto">
                            {(['ALL', 'MONTH', 'WEEK', 'DAY'] as const).map(t => (
                                <button 
                                    key={t}
                                    onClick={() => setWalletTimeFilter(t)}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${walletTimeFilter === t ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                                >
                                    {t === 'ALL' ? 'Все время' : t === 'MONTH' ? 'Месяц' : t === 'WEEK' ? 'Неделя' : 'День'}
                                </button>
                            ))}
                         </div>
                    </div>

                    {/* 4. SPLIT HISTORY: WITHDRAWALS (LEFT) | INCOME (RIGHT) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* LEFT: Withdrawals */}
                        <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 flex flex-col h-[400px]">
                            <h3 className="text-red-500 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="text-red-500"><Icons.ArrowUp /></span> История выводов
                            </h3>
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                                {withdrawals.length === 0 ? (
                                    <EmptyState label="Нет выводов" />
                                ) : (
                                    withdrawals.map(tx => (
                                        <div key={tx.id} className="flex justify-between items-center p-3 rounded-xl bg-[#111] border border-white/5 hover:border-white/10 transition-colors">
                                            <div className="overflow-hidden mr-2">
                                                <div className="text-gray-300 text-xs font-bold truncate" title={tx.comment}>{formatTransactionComment(tx.comment) || 'Вывод средств'}</div>
                                                <div className="text-[10px] text-gray-600 font-mono">{formatDate(tx.date)}</div>
                                            </div>
                                            <div className="font-mono text-xs font-bold text-red-400 whitespace-nowrap">
                                                {tx.amount} ₪
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* RIGHT: Income */}
                        <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 flex flex-col h-[400px]">
                             <h3 className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="text-emerald-500"><Icons.ArrowDown /></span> История пополнений
                            </h3>
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                                {incomes.length === 0 ? (
                                    <EmptyState label="Нет пополнений" />
                                ) : (
                                    incomes.map(tx => (
                                        <div key={tx.id} className="flex justify-between items-center p-3 rounded-xl bg-[#111] border border-white/5 hover:border-white/10 transition-colors">
                                            <div className="overflow-hidden mr-2">
                                                <div className="text-gray-300 text-xs font-bold truncate" title={tx.comment}>{formatTransactionComment(tx.comment) || tx.type}</div>
                                                <div className="text-[10px] text-gray-600 font-mono">{formatDate(tx.date)}</div>
                                            </div>
                                            <div className="font-mono text-xs font-bold text-emerald-400 whitespace-nowrap">
                                                +{tx.amount} ₪
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
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#0A0A0A] border border-white/5 p-1.5 rounded-2xl">
                        <div className="flex gap-1 bg-[#111] p-1 rounded-xl w-full md:w-auto overflow-x-auto">
                            {(['ALL', 'BAN', 'MUTE', 'CHECK'] as const).map(t => (
                                <button 
                                    key={t}
                                    onClick={() => setTypeFilter(t)}
                                    className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${typeFilter === t ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                                >
                                    {t === 'ALL' ? 'Все' : t === 'BAN' ? 'Баны' : t === 'MUTE' ? 'Муты' : 'Проверки'}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-1 bg-[#111] p-1 rounded-xl w-full md:w-auto overflow-x-auto">
                            {(['ALL', 'WEEK', 'DAY'] as const).map(t => (
                                <button 
                                    key={t}
                                    onClick={() => setTimeFilter(t)}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${timeFilter === t ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                                >
                                    {t === 'ALL' ? 'Все время' : t === 'WEEK' ? 'Неделя' : '24 Часа'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* NEW: VISUAL CHARTS ROW */}
                    {stats && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6">
                                <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-6">Активность (7 дней)</h3>
                                <ActivityBarChart stats={stats} />
                            </div>
                            <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6">
                                <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-6">Распределение наказаний</h3>
                                <div className="flex justify-center">
                                    <DistributionChart stats={stats} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                            <div className="absolute right-[-20px] bottom-[-20px] text-[#111] group-hover:text-red-900/20 transition-colors transform group-hover:scale-110 duration-500 opacity-20">
                                <div className="scale-[4]"><Icons.Ban /></div>
                            </div>
                            <h3 className="text-red-500 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Icons.Ban /> Банов
                            </h3>
                            <div className="text-5xl font-black text-white">{getCount('BAN')}</div>
                        </div>

                        <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                             <div className="absolute right-[-20px] bottom-[-20px] text-[#111] group-hover:text-orange-900/20 transition-colors transform group-hover:scale-110 duration-500 opacity-20">
                                <div className="scale-[4]"><Icons.Mute /></div>
                            </div>
                            <h3 className="text-orange-500 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Icons.Mute /> Мутов
                            </h3>
                            <div className="text-5xl font-black text-white">{getCount('MUTE')}</div>
                        </div>

                         <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                             <div className="absolute right-[-20px] bottom-[-20px] text-[#111] group-hover:text-blue-900/20 transition-colors transform group-hover:scale-110 duration-500 opacity-20">
                                <div className="scale-[4]"><Icons.Check /></div>
                            </div>
                            <h3 className="text-blue-500 text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Icons.Check /> Проверок
                            </h3>
                            <div className="text-5xl font-black text-white">{getCount('CHECK')}</div>
                        </div>
                    </div>

                    {/* NEW CARD STYLE FEED */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between px-2">
                             <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Лента событий</div>
                             <div className="text-gray-600 text-[10px] font-mono">{filteredHistory.length} записей</div>
                        </div>

                        {filteredHistory.length === 0 ? (
                            <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-8">
                                <EmptyState label="Нет данных за выбранный период" />
                            </div>
                        ) : (
                            filteredHistory.map((item, idx) => (
                                <div key={idx} className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-6 group hover:border-white/10 transition-colors shadow-lg">
                                    
                                    {/* Large Icon Box */}
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                                        item.type === 'BAN' ? 'bg-gradient-to-br from-red-500/10 to-red-900/10 text-red-500 border border-red-500/10' : 
                                        item.type === 'MUTE' ? 'bg-gradient-to-br from-orange-500/10 to-orange-900/10 text-orange-500 border border-orange-500/10' : 
                                        'bg-gradient-to-br from-blue-500/10 to-blue-900/10 text-blue-500 border border-blue-500/10'
                                    }`}>
                                        <div className="scale-125">
                                            {item.type === 'BAN' ? <Icons.Ban /> : item.type === 'MUTE' ? <Icons.Mute /> : <Icons.Check />}
                                        </div>
                                    </div>

                                    {/* Content Info */}
                                    <div className="flex-1 w-full text-center md:text-left">
                                        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded w-fit mx-auto md:mx-0 ${
                                                item.type === 'BAN' ? 'bg-red-500/20 text-red-400' : 
                                                item.type === 'MUTE' ? 'bg-orange-500/20 text-orange-400' : 
                                                'bg-blue-500/20 text-blue-400'
                                            }`}>
                                                {item.type === 'BAN' ? 'Блокировка' : item.type === 'MUTE' ? 'Мут' : 'Проверка'}
                                            </span>
                                            <div className="text-[10px] text-gray-500 font-mono flex items-center justify-center md:justify-start gap-1">
                                                <Icons.Clock /> {formatDate(item.time)}
                                            </div>
                                        </div>
                                        
                                        <div className="text-white font-bold text-lg mb-2">
                                            {/* Fix for displaying proper check method (Anydesk/Discord) */}
                                            {item.type === 'CHECK' ? (
                                                <span>Проверка игрока <span className="text-blue-400">{item.target}</span></span>
                                            ) : (
                                                <span>{item.reason}</span>
                                            )}
                                        </div>
                                        
                                        {/* Meta Data Grid */}
                                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[11px] font-mono text-gray-400 bg-[#111] p-3 rounded-xl border border-white/5">
                                             {item.type === 'CHECK' ? (
                                                 <div className="flex items-center gap-2">
                                                     <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                     {/* Use checkMethod which stores the original type (Anydesk/Discord) */}
                                                     Метод: <span className="text-white font-bold uppercase">{item.checkMethod}</span>
                                                 </div>
                                             ) : (
                                                 <>
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                                                        Срок: <span className="text-white">{getDurationString(item.time, item.until)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                                                        Истекает: <span className="text-white">{item.until <= 0 ? 'Никогда' : formatDate(item.until)}</span>
                                                    </div>
                                                    {!item.active && (
                                                         <div className="flex items-center gap-2 text-emerald-400">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                                            Снят: {item.removed_by_name || 'System'}
                                                        </div>
                                                    )}
                                                 </>
                                             )}
                                             <div className="flex items-center gap-2 ml-auto border-l border-white/10 pl-4">
                                                 <Icons.User />
                                                 <span>Admin: {member.ign || 'Unknown'}</span>
                                             </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* --- WITHDRAW MODAL --- */}
            {isWithdrawMode && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-2xl relative">
                        <button onClick={() => setIsWithdrawMode(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
                            <Icons.Close />
                        </button>
                        
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
                                <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block tracking-widest">Сумма (₪)</label>
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

            {/* --- ADMIN CONFIRM MODAL --- */}
            {showAdminConfirm && adminAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-[#0f0f0f] border border-yellow-500/20 rounded-3xl p-8 w-full max-w-sm shadow-2xl relative">
                        <div className="mb-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center mx-auto mb-4">
                                <Icons.Alert />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Подтверждение</h3>
                            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                                Вы собираетесь {adminAction.type === 'ADMIN_ADD' ? 'выдать' : 'снять'} средства.
                            </p>
                        </div>

                        <div className="bg-[#151515] rounded-xl p-4 mb-6 border border-white/5 space-y-2">
                             <div className="flex justify-between text-xs">
                                 <span className="text-gray-500">Сотрудник:</span>
                                 <span className="text-white font-bold">{member.ign || member.user.username}</span>
                             </div>
                             <div className="flex justify-between text-xs">
                                 <span className="text-gray-500">Сумма:</span>
                                 <span className={`font-mono font-bold ${adminAction.type === 'ADMIN_ADD' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {adminAction.type === 'ADMIN_ADD' ? '+' : '-'}{adminAction.amount} ₪
                                 </span>
                             </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setShowAdminConfirm(false)} className="h-11 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] font-bold uppercase tracking-widest transition-colors">
                                Отмена
                            </button>
                            <ModernButton onClick={confirmAdminAction} isLoading={isProcessingTx} className="h-11 rounded-xl">
                                Подтвердить
                            </ModernButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default UserProfile;