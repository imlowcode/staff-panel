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

// Форматирование даты
const formatDate = (ms: number | string) => {
    if (!ms) return '-';
    const date = new Date(typeof ms === 'string' ? ms : ms); 
    return date.toLocaleDateString('ru-RU', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    });
};

type TimeFilter = 'ALL' | 'DAY' | 'WEEK' | 'MONTH';

const UserProfile: React.FC<UserProfileProps> = ({ member, currentUser, onBack, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'STATS' | 'SALARY'>('PROFILE');
  const [statSubTab, setStatSubTab] = useState<'ALL' | 'BANS' | 'MUTES' | 'CHECKS'>('ALL');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('ALL');
  
  const [ignInput, setIgnInput] = useState(member.ign || '');
  const [isSaving, setIsSaving] = useState(false);
  const [displayedName, setDisplayedName] = useState('');
  
  // Stats State
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Economy State
  const [economy, setEconomy] = useState<EconomyData | null>(null);
  const [loadingEconomy, setLoadingEconomy] = useState(false);
  
  // Withdraw Actions
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawMode, setIsWithdrawMode] = useState(false); // Mode to show input in banner
  const [isProcessingTx, setIsProcessingTx] = useState(false);
  
  // Admin Manage State
  const [adminAmount, setAdminAmount] = useState('');

  // 3D Skin State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const skinViewerRef = useRef<any>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [is3DLoadError, setIs3DLoadError] = useState(false); // Состояние ошибки 3D

  const isAdmin = ALLOWED_ADMIN_IDS.includes(currentUser.id);
  const isOwner = member.user.id === currentUser.id;

  useEffect(() => {
    setDisplayedName(member.ign || member.nick || member.user.global_name || member.user.username);
    setIgnInput(member.ign || '');
  }, [member]);

  // Загружаем статистику и экономику
  useEffect(() => {
    if (member.ign) {
        fetchStats(member.ign);
    }
    fetchEconomy(member.user.id);
  }, [member]);

  // Инициализация 3D Вьювера
  useEffect(() => {
      setIs3DLoadError(false);

      if (activeTab !== 'PROFILE' || !member.ign) {
          return;
      }

      const initViewer = () => {
          if (!canvasRef.current) return;

          try {
                if (skinViewerRef.current) {
                    skinViewerRef.current.dispose();
                    skinViewerRef.current = null;
                }

                const skinview3d = (window as any).skinview3d;
                if (!skinview3d) {
                    console.error("SkinView3D lib is missing (initViewer called but window.skinview3d is undefined)");
                    setIs3DLoadError(true);
                    return;
                }

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
                viewer.zoom = 0.9;
                viewer.autoRotate = autoRotate;
                viewer.autoRotateSpeed = 1.0;
                viewer.animation = new skinview3d.WalkingAnimation();
                viewer.animation.speed = 0.5;

                skinViewerRef.current = viewer;
          } catch (e) {
              console.error("Error initializing 3D viewer:", e);
              setIs3DLoadError(true);
          }
      };

      if ((window as any).skinview3d) {
          initViewer();
      } else {
          const SRC = "https://cdn.jsdelivr.net/npm/skinview3d@3.0.0-alpha.1/dist/skinview3d.bundle.js";
          let script = document.querySelector(`script[src="${SRC}"]`) as HTMLScriptElement;

          if (!script) {
              script = document.createElement('script');
              script.src = SRC;
              script.async = true;
              document.body.appendChild(script);
          }

          const onScriptLoad = () => {
              setTimeout(initViewer, 50);
          };
          
          const onScriptError = () => {
              console.error("Failed to load skinview3d script");
              setIs3DLoadError(true);
          };

          script.addEventListener('load', onScriptLoad);
          script.addEventListener('error', onScriptError);

          return () => {
              script.removeEventListener('load', onScriptLoad);
              script.removeEventListener('error', onScriptError);
              if (skinViewerRef.current) {
                  skinViewerRef.current.dispose();
                  skinViewerRef.current = null;
              }
          };
      }

      return () => {
          if (skinViewerRef.current) {
              skinViewerRef.current.dispose();
              skinViewerRef.current = null;
          }
      };
  }, [activeTab, member.ign]);

  useEffect(() => {
      if (skinViewerRef.current) {
          skinViewerRef.current.autoRotate = autoRotate;
      }
  }, [autoRotate]);

  const fetchStats = async (ign: string) => {
    setLoadingStats(true);
    try {
        const res = await fetch(`${API_BASE_URL}/api/stats/${ign}`);
        if (res.ok) {
            const data = await res.json();
            setStats(data);
        }
    } catch (e) {
        console.error("Failed to load stats", e);
    } finally {
        setLoadingStats(false);
    }
  };

  const fetchEconomy = async (userId: string) => {
      setLoadingEconomy(true);
      try {
          const res = await fetch(`${API_BASE_URL}/api/economy/${userId}`);
          if (res.ok) {
              const data = await res.json();
              setEconomy(data);
          }
      } catch (e) {
          console.error("Failed to load economy", e);
      } finally {
          setLoadingEconomy(false);
      }
  };

  const handleWithdraw = async () => {
      if (!isOwner) return;
      if (!member.ign) {
          alert("Привяжите ник Minecraft в профиле перед выводом!");
          return;
      }
      setIsProcessingTx(true);
      try {
          const res = await fetch(`${API_BASE_URL}/api/economy/withdraw`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  userId: member.user.id,
                  amount: withdrawAmount,
                  ign: member.ign
              })
          });
          const data = await res.json();
          if (res.ok) {
              setWithdrawAmount('');
              setIsWithdrawMode(false);
              fetchEconomy(member.user.id);
              alert(`Успешно выведено ${withdrawAmount} аметринов на ник ${member.ign}`);
          } else {
              alert(data.error);
          }
      } catch (e) {
          alert("Ошибка соединения с сервером.");
      } finally {
          setIsProcessingTx(false);
      }
  };

  const handleAdminManage = async (type: 'ADMIN_ADD' | 'ADMIN_REMOVE') => {
      if (!isAdmin) return;
      setIsProcessingTx(true);
      try {
          const res = await fetch(`${API_BASE_URL}/api/economy/admin/manage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  adminId: currentUser.id,
                  targetUserId: member.user.id,
                  amount: adminAmount,
                  type
              })
          });
          if (res.ok) {
              setAdminAmount('');
              fetchEconomy(member.user.id);
          } else {
              const d = await res.json();
              alert(d.error);
          }
      } catch (e) {
          alert("Ошибка");
      } finally {
          setIsProcessingTx(false);
      }
  };

  const handleAdminForceWithdraw = async () => {
      if (!isAdmin) return;
      if (!member.ign) {
          alert("У пользователя не привязан ник!");
          return;
      }
      setIsProcessingTx(true);
      try {
          const res = await fetch(`${API_BASE_URL}/api/economy/admin/withdraw`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  adminId: currentUser.id,
                  targetUserId: member.user.id,
                  amount: adminAmount,
                  ign: member.ign
              })
          });
          if (res.ok) {
              setAdminAmount('');
              fetchEconomy(member.user.id);
              alert("Средства выведены на сервер!");
          } else {
              const d = await res.json();
              alert(d.error);
          }
      } catch(e) {
          alert("Ошибка");
      } finally {
          setIsProcessingTx(false);
      }
  };

  const canEditIgn = ALLOWED_ADMIN_IDS.includes(currentUser.id);
  const roleDef = ROLE_HIERARCHY.find(r => member.roles.includes(r.id));

  // URL для головы
  const getHeadUrl = () => {
     if (member.ign) return `https://minotar.net/helm/${member.ign}/100.png`;
     if (member.user.avatar) return `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png?size=100`;
     return `https://cdn.discordapp.com/embed/avatars/${(parseInt(member.user.discriminator) || 0) % 5}.png`;
  };

  const handleSaveIgn = async () => {
    if (!canEditIgn) return;
    setIsSaving(true);
    try {
        await updateMemberIgn(member.user.id, ignInput);
        if (ignInput) setDisplayedName(ignInput);
        else setDisplayedName(member.nick || member.user.global_name || member.user.username);
        onUpdate(); 
    } catch (e) {
        alert("Ошибка сохранения ника.");
    } finally {
        setIsSaving(false);
    }
  };

  // Фильтрация данных статистики
  const filterByTime = (items: any[], dateField: string) => {
      if (timeFilter === 'ALL') return items;
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      return items.filter(item => {
          const itemTime = parseInt(item[dateField]);
          if (timeFilter === 'DAY') return (now - itemTime) <= oneDay;
          if (timeFilter === 'WEEK') return (now - itemTime) <= (oneDay * 7);
          if (timeFilter === 'MONTH') return (now - itemTime) <= (oneDay * 30);
          return true;
      });
  };

  const filteredBans = stats ? filterByTime(stats.bans, 'time') : [];
  const filteredMutes = stats ? filterByTime(stats.mutes, 'time') : [];
  const filteredChecks = stats ? filterByTime(stats.checks, 'date') : [];

  const allActions = [
      ...filteredBans.map(b => ({ ...b, type: 'BAN', sortTime: b.time })),
      ...filteredMutes.map(m => ({ ...m, type: 'MUTE', sortTime: m.time })),
      ...filteredChecks.map(c => ({ ...c, type: 'CHECK', sortTime: c.date }))
  ].sort((a, b) => b.sortTime - a.sortTime);

  const displayedActions = statSubTab === 'ALL' ? allActions : 
                           statSubTab === 'BANS' ? filteredBans.map(b => ({...b, type: 'BAN'})) :
                           statSubTab === 'MUTES' ? filteredMutes.map(m => ({...m, type: 'MUTE'})) :
                           filteredChecks.map(c => ({...c, type: 'CHECK'}));

  return (
    <div className="min-h-screen bg-[#020202] flex items-center justify-center p-4 relative overflow-hidden">
        
        {/* --- Background Effects --- */}
        <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none"></div>
        <div className="fixed top-0 left-0 w-full h-[300px] bg-purple-900/10 blur-[100px] pointer-events-none"></div>

        {/* --- FULL SCREEN CONTAINER --- */}
        <div className="w-full max-w-[95%] h-[90vh] relative z-10 animate-fade-in flex flex-col">
            
            {/* Header Navigation */}
            <div className="flex justify-between items-center mb-6">
                <ModernButton onClick={onBack} variant="secondary" className="pl-4 pr-5 shadow-lg backdrop-blur-md">
                   <span className="text-gray-400 mr-2">←</span> Назад
                </ModernButton>
                
                {/* TABS */}
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 backdrop-blur-md">
                    <button 
                        onClick={() => setActiveTab('PROFILE')}
                        className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'PROFILE' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        Профиль
                    </button>
                    <button 
                         onClick={() => setActiveTab('STATS')}
                         disabled={!member.ign}
                         className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'STATS' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'}`}
                    >
                        Статистика
                    </button>
                    <button 
                         onClick={() => setActiveTab('SALARY')}
                         className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'SALARY' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        Зарплата
                    </button>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="glass-panel rounded-3xl flex-1 overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative flex flex-col">
                 
                 {activeTab === 'PROFILE' && (
                     /* === PROFILE TAB === */
                     <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row">
                        
                        {/* LEFT COLUMN: INFO */}
                        <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col gap-8 relative z-20">
                            
                            {/* Header Info */}
                            <div className="flex items-start gap-6">
                                <div className="relative group">
                                    <div className={`absolute -inset-1 bg-gradient-to-br ${roleDef?.color || 'from-gray-700 to-gray-600'} rounded-2xl blur opacity-40 group-hover:opacity-60 transition duration-500`}></div>
                                    <img src={getHeadUrl()} alt="Head" className="relative w-24 h-24 rounded-xl border border-white/10 shadow-2xl bg-[#121212]" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black text-white tracking-tight mb-2">{displayedName}</h1>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="text-sm text-gray-400 font-mono bg-white/5 px-2 py-1 rounded">@{member.user.username}</span>
                                        {roleDef && (
                                            <span className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full border bg-opacity-20 ${roleDef.badgeBg}`}>
                                                {roleDef.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent"></div>

                            {/* Playtime Card */}
                            <div className="glass-card p-6 rounded-2xl border-l-4 border-l-emerald-500 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] pointer-events-none"></div>
                                <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-xs mb-2 flex items-center gap-2">
                                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                     Наигранное время
                                </h3>
                                <div className="flex items-baseline gap-3">
                                    {loadingStats ? (
                                        <div className="h-10 w-32 bg-white/5 rounded animate-pulse"></div>
                                    ) : (
                                        <>
                                            <span className="text-6xl font-black text-white tracking-tighter">{stats?.playtime || 0}</span>
                                            <span className="text-xl text-gray-500 font-bold">ЧАСОВ</span>
                                        </>
                                    )}
                                </div>
                                <p className="text-gray-500 text-xs mt-2">Общая активность на сервере</p>
                            </div>

                             {/* Minecraft Link Config */}
                             <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-6 backdrop-blur-sm shadow-inner">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Привязка Minecraft</label>
                                <div className="flex gap-3 items-center">
                                    <input 
                                        type="text" 
                                        value={ignInput}
                                        disabled={!canEditIgn}
                                        onChange={(e) => setIgnInput(e.target.value)}
                                        placeholder={canEditIgn ? "Введите ник..." : "Не привязан"}
                                        className="glass-input flex-1 h-12 rounded-lg px-4 text-sm font-mono placeholder-gray-600 disabled:opacity-50 border-white/10 bg-black/20"
                                    />
                                    {canEditIgn && (
                                        <ModernButton onClick={handleSaveIgn} isLoading={isSaving} className="h-12 px-6">
                                            Сохранить
                                        </ModernButton>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* RIGHT COLUMN: 3D SKIN VIEWER / FALLBACK */}
                        <div className="w-full lg:w-1/2 relative bg-gradient-to-b from-[#0a0a0a] to-[#050505] lg:bg-none flex flex-col items-center justify-center min-h-[400px]">
                             <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-gradient-to-tr ${roleDef?.color || 'from-purple-500 to-blue-500'} blur-[120px] opacity-20 pointer-events-none`}></div>
                             
                             <div className="relative z-10 flex flex-col items-center justify-center h-full w-full">
                                {member.ign ? (
                                    <>
                                        {/* Fallback to 2D if Error or toggled */}
                                        {is3DLoadError ? (
                                            <div className="relative group animate-fade-in">
                                                 <div className={`absolute -inset-4 bg-gradient-to-b ${roleDef?.color || 'from-purple-500 to-blue-500'} opacity-20 blur-xl rounded-full`}></div>
                                                 <img 
                                                     src={`https://mc-heads.net/body/${member.ign}/400`} 
                                                     alt={member.ign} 
                                                     className="relative h-[400px] w-auto object-contain drop-shadow-2xl"
                                                     onError={(e) => {
                                                         (e.target as HTMLImageElement).src = `https://minotar.net/armor/body/${member.ign}/400.png`;
                                                     }}
                                                 />
                                            </div>
                                        ) : (
                                            <canvas ref={canvasRef} className="cursor-grab active:cursor-grabbing animate-fade-in" />
                                        )}

                                        {/* Controls */}
                                        <div className="absolute bottom-8 flex items-center gap-2 p-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
                                            {!is3DLoadError && (
                                                <button 
                                                    onClick={() => setAutoRotate(!autoRotate)} 
                                                    className={`p-2 rounded-lg transition-colors ${autoRotate ? 'bg-purple-500/20 text-purple-300' : 'hover:bg-white/10 text-gray-400'}`}
                                                    title="Авто-вращение"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                </button>
                                            )}
                                            
                                            <button 
                                                onClick={() => setIs3DLoadError(!is3DLoadError)} 
                                                className={`p-2 rounded-lg hover:bg-white/10 ${is3DLoadError ? 'text-purple-400 bg-purple-500/10' : 'text-gray-400'}`}
                                                title={is3DLoadError ? "Попробовать 3D" : "Переключить на 2D"}
                                            >
                                                <span className="text-xs font-bold">{is3DLoadError ? "3D" : "2D"}</span>
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-gray-600 font-mono text-sm border border-white/5 p-4 rounded-xl flex items-center gap-2">
                                        <span>Скин недоступен (нет ника)</span>
                                    </div>
                                )}
                             </div>
                        </div>
                     </div>
                 )}

                 {activeTab === 'STATS' && (
                    <div className="flex-1 overflow-hidden flex flex-col bg-[#0a0a0a]/50">
                        {loadingStats ? (
                            <div className="flex flex-1 items-center justify-center">
                                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : stats ? (
                            <div className="flex flex-col h-full w-full">
                                
                                {/* 1. KPI Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 pb-0">
                                    <div className="glass-card p-6 rounded-2xl border border-red-500/10 hover:border-red-500/30 group transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 rounded-xl bg-red-500/10 text-red-500 group-hover:bg-red-500/20 transition-colors">
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                            </div>
                                            <span className="text-xs font-bold text-red-400 bg-red-500/5 px-2 py-1 rounded">BANS</span>
                                        </div>
                                        <div className="text-4xl font-black text-white mb-1">{stats.bans.length}</div>
                                        <div className="text-xs text-gray-500 font-medium">Выданных блокировок</div>
                                    </div>

                                    <div className="glass-card p-6 rounded-2xl border border-orange-500/10 hover:border-orange-500/30 group transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500 group-hover:bg-orange-500/20 transition-colors">
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                            </div>
                                            <span className="text-xs font-bold text-orange-400 bg-orange-500/5 px-2 py-1 rounded">MUTES</span>
                                        </div>
                                        <div className="text-4xl font-black text-white mb-1">{stats.mutes.length}</div>
                                        <div className="text-xs text-gray-500 font-medium">Выданных мутов</div>
                                    </div>

                                    <div className="glass-card p-6 rounded-2xl border border-blue-500/10 hover:border-blue-500/30 group transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20 transition-colors">
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </div>
                                            <span className="text-xs font-bold text-blue-400 bg-blue-500/5 px-2 py-1 rounded">CHECKS</span>
                                        </div>
                                        <div className="text-4xl font-black text-white mb-1">{stats.checks.length}</div>
                                        <div className="text-xs text-gray-500 font-medium">Проведенных проверок</div>
                                    </div>
                                </div>

                                {/* 2. Filters */}
                                <div className="px-8 py-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                                    <div className="bg-black/40 p-1.5 rounded-xl border border-white/10 backdrop-blur-md flex gap-1 w-full md:w-auto">
                                        {(['ALL', 'BANS', 'MUTES', 'CHECKS'] as const).map((tab) => (
                                            <button
                                                key={tab}
                                                onClick={() => setStatSubTab(tab)}
                                                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${statSubTab === tab ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                            >
                                                {tab === 'ALL' ? 'Все' : tab === 'BANS' ? 'Баны' : tab === 'MUTES' ? 'Муты' : 'Проверки'}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <select 
                                        value={timeFilter}
                                        onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                                        className="bg-black/40 text-gray-300 text-xs font-bold uppercase rounded-xl px-4 py-3 border border-white/10 outline-none focus:border-purple-500 cursor-pointer hover:bg-black/60 transition-colors w-full md:w-auto"
                                    >
                                        <option value="ALL">За все время</option>
                                        <option value="DAY">За 24 часа</option>
                                        <option value="WEEK">За неделю</option>
                                        <option value="MONTH">За месяц</option>
                                    </select>
                                </div>

                                {/* 3. Grid */}
                                <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
                                    {displayedActions.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-40 text-gray-600 border-2 border-dashed border-white/5 rounded-2xl">
                                            <span className="text-xs uppercase tracking-widest font-bold">Активности не найдено</span>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {displayedActions.map((item: any, idx) => {
                                                let typeColor = 'gray';
                                                let typeIcon = null;
                                                let typeLabel = '';
                                                
                                                if (item.type === 'BAN') {
                                                    typeColor = 'red';
                                                    typeLabel = 'Блокировка';
                                                    typeIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>;
                                                } else if (item.type === 'MUTE') {
                                                    typeColor = 'orange';
                                                    typeLabel = 'Мут чата';
                                                    typeIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
                                                } else {
                                                    typeColor = 'blue';
                                                    typeLabel = 'Проверка';
                                                    typeIcon = <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
                                                }

                                                const borderColor = typeColor === 'red' ? 'border-red-500/20' : typeColor === 'orange' ? 'border-orange-500/20' : 'border-blue-500/20';
                                                const bgHover = typeColor === 'red' ? 'hover:bg-red-500/5' : typeColor === 'orange' ? 'hover:bg-orange-500/5' : 'hover:bg-blue-500/5';
                                                const iconBg = typeColor === 'red' ? 'bg-red-500/10 text-red-400' : typeColor === 'orange' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400';

                                                return (
                                                    <div key={idx} className={`glass-card p-4 rounded-xl border ${borderColor} ${bgHover} flex flex-col gap-3 group animate-slide-up relative overflow-hidden`}>
                                                        <div className="flex justify-between items-start">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
                                                                {typeIcon}
                                                            </div>
                                                            {item.active !== undefined && (
                                                                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${item.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-500'}`}>
                                                                    {item.active ? 'АКТИВЕН' : 'ИСТЕК'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">{typeLabel}</div>
                                                            {item.type === 'CHECK' ? (
                                                                <div className="text-white font-bold truncate" title={item.target}>{item.target}</div>
                                                            ) : (
                                                                <div className="text-white font-bold line-clamp-2 text-sm" title={item.reason}>{item.reason}</div>
                                                            )}
                                                        </div>
                                                        <div className="mt-auto pt-3 border-t border-white/5 flex items-center gap-2">
                                                            <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            <span className="text-[10px] text-gray-500 font-mono">
                                                                {formatDate(item.sortTime)}
                                                            </span>
                                                        </div>
                                                        {item.type === 'CHECK' && (
                                                            <div className={`absolute top-4 right-4 text-[9px] font-bold px-1.5 py-0.5 rounded border ${item.type.includes('Anydesk') ? 'border-red-500/30 text-red-400' : 'border-blue-500/30 text-blue-400'}`}>
                                                                {item.type}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 mt-20">Не удалось загрузить статистику.</div>
                        )}
                    </div>
                 )}

                {activeTab === 'SALARY' && (
                    /* === SALARY TAB (REDESIGNED) === */
                    <div className="flex-1 overflow-y-auto flex flex-col p-8 bg-[#0a0a0a]/50 custom-scrollbar">
                         {loadingEconomy ? (
                            <div className="flex flex-1 items-center justify-center w-full">
                                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                         ) : economy ? (
                             <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
                                
                                {/* 1. BANNER: WIDE GRADIENT CARD */}
                                <div className="w-full rounded-3xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 p-8 text-center relative overflow-hidden shadow-[0_10px_40px_rgba(59,130,246,0.3)] shrink-0">
                                    {/* Noise/Texture overlay */}
                                    <div className="absolute inset-0 bg-white/5 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                                    
                                    <div className="relative z-10 flex flex-col items-center justify-center">
                                        <div className="text-white/80 font-medium text-xs tracking-[0.2em] uppercase mb-2">Ваш баланс</div>
                                        <div className="text-6xl md:text-7xl font-black text-white tracking-tighter drop-shadow-xl mb-6">
                                            {economy.balance.toLocaleString()} 
                                            <span className="text-2xl ml-2 font-bold opacity-70 align-top">AMT</span>
                                        </div>

                                        {/* Dynamic Withdraw Section */}
                                        <div className="h-14 flex items-center justify-center">
                                            {isWithdrawMode ? (
                                                <div className="flex items-center gap-2 animate-fade-in bg-white/20 p-1.5 rounded-xl backdrop-blur-md border border-white/20">
                                                    <input 
                                                        type="number" 
                                                        value={withdrawAmount}
                                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                                        placeholder="Сумма"
                                                        className="w-32 bg-transparent text-white placeholder-white/60 font-mono text-lg font-bold text-center outline-none"
                                                        autoFocus
                                                    />
                                                    <button 
                                                        onClick={handleWithdraw}
                                                        disabled={isProcessingTx}
                                                        className="bg-white text-blue-600 px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-gray-100 transition-colors disabled:opacity-50"
                                                    >
                                                        {isProcessingTx ? '...' : 'Подтвердить'}
                                                    </button>
                                                    <button 
                                                        onClick={() => setIsWithdrawMode(false)}
                                                        className="px-3 py-2 text-white/70 hover:text-white transition-colors"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => isOwner ? setIsWithdrawMode(true) : null}
                                                    disabled={!isOwner}
                                                    className="bg-black/20 hover:bg-black/30 text-white border border-white/20 px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-sm transition-all backdrop-blur-sm hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Вывести средства
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 2. ADMIN TOOLS (DISCRETE PANEL) */}
                                {isAdmin && (
                                    <div className="w-full glass-panel rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 justify-between border border-white/5 animate-fade-in">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest pl-2">
                                            <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Админ Панель
                                        </div>
                                        <div className="flex items-center gap-2 flex-1 justify-end">
                                            <input 
                                                type="number" 
                                                value={adminAmount}
                                                onChange={(e) => setAdminAmount(e.target.value)}
                                                placeholder="Сумма..."
                                                className="glass-input h-9 w-32 rounded-lg px-3 text-xs bg-black/40 border-white/5"
                                            />
                                            <button onClick={() => handleAdminManage('ADMIN_ADD')} className="h-9 px-4 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-[10px] font-bold uppercase transition-all">
                                                + Выдать
                                            </button>
                                            <button onClick={() => handleAdminManage('ADMIN_REMOVE')} className="h-9 px-4 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-[10px] font-bold uppercase transition-all">
                                                - Забрать
                                            </button>
                                            <button onClick={handleAdminForceWithdraw} className="h-9 px-4 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 text-[10px] font-bold uppercase transition-all">
                                                Force Withdraw
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* 3. SPLIT HISTORY: WITHDRAWALS (LEFT) vs INCOME (RIGHT) */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                                    
                                    {/* --- WITHDRAWALS HISTORY --- */}
                                    <div className="flex flex-col gap-4">
                                        <h3 className="text-white font-bold text-lg">История выводов</h3>
                                        <div className="flex flex-col gap-2">
                                            {economy.history.filter(tx => ['WITHDRAW', 'ADMIN_REMOVE'].includes(tx.type)).length === 0 ? (
                                                 <div className="p-8 rounded-xl border border-white/5 bg-white/[0.02] text-center text-gray-600 text-xs uppercase tracking-widest">
                                                     Выплат пока нет
                                                     <p className="text-[10px] mt-2 normal-case text-gray-700">Для совершения выплаты вам необходимо минимум 5000 AMT</p>
                                                 </div>
                                            ) : (
                                                economy.history.filter(tx => ['WITHDRAW', 'ADMIN_REMOVE'].includes(tx.type)).map(tx => (
                                                    <div key={tx.id} className="p-4 rounded-xl bg-[#0f0f0f] border border-white/5 flex justify-between items-center group hover:bg-[#151515] transition-colors">
                                                        <div>
                                                            <div className="text-gray-300 text-sm font-bold mb-1">
                                                                {tx.type === 'WITHDRAW' ? 'Вывод средств' : 'Списание (Admin)'}
                                                            </div>
                                                            <div className="text-[10px] text-gray-600 font-mono">
                                                                {formatDate(tx.date)} • {tx.comment || 'N/A'}
                                                            </div>
                                                        </div>
                                                        <div className="text-red-400 font-bold font-mono">
                                                            -{tx.amount.toLocaleString()} AMT
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* --- INCOME HISTORY --- */}
                                    <div className="flex flex-col gap-4">
                                        <h3 className="text-white font-bold text-lg">История доходов</h3>
                                        <div className="flex flex-col gap-2">
                                            {economy.history.filter(tx => ['DEPOSIT', 'ADMIN_ADD', 'AUTO_SALARY'].includes(tx.type)).length === 0 ? (
                                                 <div className="p-8 rounded-xl border border-white/5 bg-white/[0.02] text-center text-gray-600 text-xs uppercase tracking-widest">
                                                     Доходов пока нет
                                                 </div>
                                            ) : (
                                                economy.history.filter(tx => ['DEPOSIT', 'ADMIN_ADD', 'AUTO_SALARY'].includes(tx.type)).map(tx => (
                                                    <div key={tx.id} className="p-4 rounded-xl bg-[#0f0f0f] border border-white/5 flex justify-between items-center group hover:bg-[#151515] transition-colors">
                                                        <div>
                                                            <div className="text-gray-300 text-sm font-bold mb-1">
                                                                {tx.type === 'AUTO_SALARY' ? 'Зарплата (Авто)' : tx.type === 'ADMIN_ADD' ? 'Зачисление (Admin)' : 'Пополнение'}
                                                            </div>
                                                            <div className="text-[10px] text-gray-600 font-mono">
                                                                {formatDate(tx.date)} • {tx.comment || 'N/A'}
                                                            </div>
                                                        </div>
                                                        <div className="text-emerald-400 font-bold font-mono">
                                                            +{tx.amount.toLocaleString()} AMT
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                </div>
                             </div>
                         ) : (
                            <div className="text-center text-gray-500 m-auto">Не удалось загрузить данные кошелька.</div>
                         )}
                    </div>
                 )}
            </div>
        </div>
    </div>
  );
};

export default UserProfile;