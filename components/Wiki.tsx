import React, { useState, useMemo } from 'react';
import { GuildMember } from '../types';
import { ROLE_HIERARCHY } from '../constants';

// --- ICONS ---
const Icons = {
    Book: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
    Shield: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
    TrendingUp: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>,
    DollarSign: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
    ChevronRight: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>,
    ChevronDown: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>,
    AlertTriangle: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
    Check: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
    X: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
    Terminal: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>,
    Award: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>,
    Clock: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
    ExternalLink: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>,
    Command: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
};

interface WikiProps {
    currentMember?: GuildMember;
}

type WikiPage = 'REGULATIONS' | 'CHEATS' | 'COMMANDS' | 'PROMOTIONS' | 'SALARY';

// Role IDs mapped to numeric levels for progress tracking
const ROLE_LEVELS: Record<string, number> = {
    '1459285694458626222': 0, // Trainee
    '1458158059187732666': 1, // Jr Mod
    '1458158896894967879': 2, // Moderator
    '1458159110720589944': 3, // Sr Moderator
    '1458277039399374991': 4, // Curator
    '1458159802105594061': 5  // Chief
};

const AccordionItem = ({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden transition-all duration-300">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors group"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg bg-white/5 text-gray-400 group-hover:text-white group-hover:bg-white/10 transition-colors`}>
                        <Icons.Terminal />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-wider text-gray-300 group-hover:text-white">{title}</span>
                </div>
                <div className={`text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <Icons.ChevronDown />
                </div>
            </button>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-4 pt-0 border-t border-white/5">
                    <div className="h-4"></div>
                    <div className="space-y-2">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

const CommandRow = ({ cmd, desc }: { cmd: string, desc?: string }) => (
    <div className="bg-[#0A0A0A] border border-white/5 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 group hover:border-white/10 transition-colors">
        <code className="text-xs font-mono text-purple-300 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20 w-fit select-all">
            {cmd}
        </code>
        {desc && <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide text-right">{desc}</span>}
    </div>
);

const Wiki: React.FC<WikiProps> = ({ currentMember }) => {
    const [activePage, setActivePage] = useState<WikiPage>('REGULATIONS');

    const menuItems: { id: WikiPage; label: string; icon: React.FC }[] = [
        { id: 'REGULATIONS', label: 'Внутренний регламент', icon: Icons.Book },
        { id: 'COMMANDS', label: 'Команды', icon: Icons.Command },
        { id: 'CHEATS', label: 'Проверка на читы', icon: Icons.Shield },
        { id: 'PROMOTIONS', label: 'Повышения', icon: Icons.TrendingUp },
        { id: 'SALARY', label: 'Зарплата', icon: Icons.DollarSign },
    ];

    // Calculate current user level
    const userLevel = useMemo(() => {
        if (!currentMember) return -1;
        let maxLevel = -1;
        currentMember.roles.forEach(roleId => {
            if (ROLE_LEVELS[roleId] !== undefined) {
                maxLevel = Math.max(maxLevel, ROLE_LEVELS[roleId]);
            }
        });
        return maxLevel;
    }, [currentMember]);

    const renderContent = () => {
        switch (activePage) {
            case 'REGULATIONS':
                return (
                    <div className="space-y-8 animate-fade-in pb-10">
                        {/* Header */}
                        <div className="border-b border-white/5 pb-6">
                            <h1 className="text-3xl font-black text-white uppercase tracking-tight">Внутренний регламент</h1>
                            <p className="text-gray-500 text-sm mt-2 font-mono">Правила и обязанности персонала проекта.</p>
                        </div>

                        {/* Reprimand System */}
                        <section>
                            <h2 className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Icons.AlertTriangle /> Система выговоров
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="bg-[#111] border border-white/5 p-5 rounded-xl">
                                    <div className="text-xs text-gray-500 uppercase font-bold mb-2">Junior Moderator</div>
                                    <div className="text-2xl font-black text-white">Макс. 2 выговора</div>
                                </div>
                                <div className="bg-[#111] border border-white/5 p-5 rounded-xl">
                                    <div className="text-xs text-gray-500 uppercase font-bold mb-2">Moderator и выше</div>
                                    <div className="text-2xl font-black text-white">Макс. 3 выговора</div>
                                </div>
                            </div>
                            <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl text-sm text-gray-400 leading-relaxed mb-4">
                                <span className="text-red-400 font-bold block mb-1">Важно:</span>
                                При достижении максимального количества предупреждений, модератор снимается с должности. 
                                Выговор выдается сроком от одной до двух недель.
                            </div>
                        </section>

                        <div className="h-px bg-white/5 w-full"></div>

                        {/* Rules List */}
                        <section>
                            <h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-4">Регламент для персонала</h2>
                            <div className="space-y-3">
                                {[
                                    { text: "Токсичное/оскорбительное поведение", punishment: "от выговора до снятия" },
                                    { text: "Разглашение скрытой информации (вкл. этот Discord)", punishment: "СНЯТИЕ" },
                                    { text: "Использование служебного аккаунта для игры", punishment: "выговор" },
                                    { text: "Злоупотребление функционалом (наказания по приколу)", punishment: "от выговора до снятия" },
                                ].map((rule, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-[#111] p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                                        <span className="text-sm text-gray-300 font-medium">{rule.text}</span>
                                        <span className="text-[10px] font-bold uppercase bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/10 whitespace-nowrap ml-4">{rule.punishment}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                         {/* Proofs & Norms */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <section>
                                <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4">Хранение доказательств</h2>
                                <div className="bg-[#111] border border-white/5 p-4 rounded-xl text-xs text-gray-400 leading-6">
                                    <p className="mb-2">Необходимо хранить 72 часа и предоставлять по просьбе:</p>
                                    <ul className="list-disc pl-4 space-y-1 text-gray-300">
                                        <li>Доказательства наказания</li>
                                        <li>Видео слежки (с причиной начала)</li>
                                        <li>Видео проведения проверки</li>
                                    </ul>
                                </div>
                            </section>
                            <section>
                                <h2 className="text-sm font-bold text-orange-400 uppercase tracking-widest mb-4">Ежедневная норма</h2>
                                <div className="bg-[#111] border border-white/5 p-4 rounded-xl space-y-2">
                                    <div className="flex justify-between text-xs font-mono text-gray-400 border-b border-white/5 pb-1">
                                        <span>Блокировки</span> <span className="text-white">3 шт.</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-mono text-gray-400 border-b border-white/5 pb-1">
                                        <span>Муты</span> <span className="text-white">2 шт.</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-mono text-gray-400 border-b border-white/5 pb-1">
                                        <span>Проверки</span> <span className="text-white">3 шт.</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-mono text-gray-400">
                                        <span>Онлайн</span> <span className="text-white">2 часа</span>
                                    </div>
                                </div>
                            </section>
                         </div>

                         {/* Punishment Reasons */}
                         <section>
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Причины наказаний</h2>
                            
                            {/* NEW: Example Command Block */}
                            <div className="bg-gradient-to-r from-purple-900/10 to-blue-900/10 border border-purple-500/20 p-5 rounded-xl mb-6 flex flex-col gap-3">
                                <div className="flex items-center gap-2 text-purple-400 font-black text-xs uppercase tracking-widest">
                                    <Icons.Terminal /> Пример выдачи
                                </div>
                                <div className="bg-black/50 rounded-lg p-3 font-mono text-xs text-gray-300 border border-white/5">
                                    /tempban ItsCreo 7d <span className="text-purple-400 font-bold underline decoration-wavy decoration-purple-500/50">Пункт 4.3</span>
                                </div>
                                <p className="text-[10px] text-gray-400 leading-relaxed">
                                    <span className="text-red-400 font-bold">ОБЯЗАТЕЛЬНО:</span> Слово "Пункт" перед номером правила писать обязательно! Без этого причина считается некорректной.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-emerald-900/10 border border-emerald-500/20 p-4 rounded-xl">
                                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase mb-2">
                                        <Icons.Check /> Правильно
                                    </div>
                                    <ul className="text-xs text-gray-400 font-mono space-y-1">
                                        <li>Пункт 4.3</li>
                                        <li>Пункт 5.3</li>
                                        <li>Пункт 2.6</li>
                                    </ul>
                                </div>
                                <div className="bg-red-900/10 border border-red-500/20 p-4 rounded-xl">
                                    <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase mb-2">
                                        <Icons.X /> Неправильно
                                    </div>
                                    <ul className="text-xs text-gray-400 font-mono space-y-1">
                                        <li>Спам, Читы</li>
                                        <li>Чистка корзины</li>
                                        <li>Оскорбление родных</li>
                                    </ul>
                                </div>
                            </div>
                         </section>
                    </div>
                );
            case 'COMMANDS':
                return (
                    <div className="space-y-8 animate-fade-in pb-10">
                        <div className="border-b border-white/5 pb-6">
                            <h1 className="text-3xl font-black text-white uppercase tracking-tight">Команды</h1>
                            <p className="text-gray-500 text-sm mt-2 font-mono">Справочник команд для модерации.</p>
                        </div>

                        <div className="space-y-3">
                            <AccordionItem title="Проверка (Check)" defaultOpen={true}>
                                <CommandRow cmd="/contact [сообщение]" desc="Связь с игроком" />
                                <CommandRow cmd="/revise [игрок] start [discord/anydesk]" desc="Начать проверку" />
                                <CommandRow cmd="/revise [игрок] finish" desc="Игрок чист" />
                                <CommandRow cmd="/revise [игрок] go" desc="+2 минуты" />
                                <CommandRow cmd="/revise [игрок] rt" desc="Убрать таймер" />
                            </AccordionItem>

                            <AccordionItem title="Баны (Bans)">
                                <CommandRow cmd='/tempban "ник" "время" "причина"' desc="Временный бан" />
                                <CommandRow cmd='/ban "ник" "причина"' desc="Бан навсегда (время пустое)" />
                                <CommandRow cmd='/ban-ip "ник" "время" "причина"' desc="Бан по IP" />
                            </AccordionItem>

                            <AccordionItem title="Муты (Mutes)">
                                <CommandRow cmd='/tempmute "ник" "время" "причина"' desc="Временный мут" />
                                <CommandRow cmd='/mute "ник" "причина"' desc="Мут навсегда" />
                                <CommandRow cmd='/mute-ip "ник" "время" "причина"' desc="Мут по IP" />
                            </AccordionItem>

                             <AccordionItem title="Слежка (Spec)">
                                <CommandRow cmd='/spec go "ник" "причина"' desc="Начать слежку" />
                                <CommandRow cmd='/spec off' desc="Закончить слежку" />
                            </AccordionItem>
                        </div>
                    </div>
                );
            case 'CHEATS':
                return (
                    <div className="space-y-8 animate-fade-in pb-10">
                         <div className="border-b border-white/5 pb-6">
                            <h1 className="text-3xl font-black text-white uppercase tracking-tight">Проверка на читы</h1>
                            <p className="text-gray-500 text-sm mt-2 font-mono">Методические материалы.</p>
                        </div>

                        <div className="p-8 bg-gradient-to-br from-[#111] to-[#0d0d0d] border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center gap-6 group hover:border-blue-500/30 transition-all">
                             <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)] group-hover:scale-110 transition-transform duration-500">
                                 <Icons.Book />
                             </div>
                             <div>
                                <h3 className="text-white font-bold text-xl mb-2">Мануал по проверкам</h3>
                                <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
                                    Полная инструкция по выявлению стороннего ПО, работе с AnyDesk и Process Hacker.
                                </p>
                             </div>
                             
                             <a 
                                href="https://docs.google.com/document/d/1Z4rMTVPlx6JnveAWcXi25xT1vP9kszFnJhGLh31PTws/edit?tab=t.0#heading=h.pvg5l5t96qdg" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1"
                             >
                                Открыть Мануал <Icons.ExternalLink />
                             </a>
                        </div>
                    </div>
                );
            case 'PROMOTIONS':
                return (
                    <div className="space-y-8 animate-fade-in pb-10">
                        <div className="border-b border-white/5 pb-6">
                            <h1 className="text-3xl font-black text-white uppercase tracking-tight">Система повышения</h1>
                            <p className="text-gray-500 text-sm mt-2 font-mono">Карьерная лестница и критерии роста.</p>
                        </div>

                        <div className="relative border-l-2 border-white/10 ml-3 space-y-12 py-2">
                            {/* Step 1: Trainee -> JrMod */}
                            <div className="relative pl-8">
                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 transition-all duration-500 z-10 ${userLevel >= 0 ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-[#111] border-gray-700'}`}></div>
                                <div className={`absolute left-[-1px] top-4 w-[2px] h-[calc(100%+48px)] transition-all duration-700 ${userLevel >= 1 ? 'bg-emerald-500' : 'bg-transparent'}`}></div>
                                
                                <h3 className={`text-lg font-bold mb-1 ${userLevel >= 0 ? 'text-white' : 'text-gray-500'}`}>Trainee <span className="text-gray-600 mx-2">→</span> Junior Moderator</h3>
                                <div className={`bg-[#111] border p-4 rounded-xl mt-3 space-y-2 transition-colors ${userLevel >= 0 ? 'border-emerald-500/30' : 'border-white/5 opacity-50'}`}>
                                    <div className="flex items-center gap-2 text-xs text-gray-400"><Icons.Clock /> Отработать минимум 3 дня</div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400"><Icons.Check /> Не иметь активных выговоров</div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400"><Icons.TrendingUp /> Показать хороший актив</div>
                                    <div className="flex items-center gap-2 text-xs text-purple-400 font-bold"><Icons.Book /> Пройти обзвон у куратора</div>
                                </div>
                            </div>

                             {/* Step 2: JrMod -> Moderator */}
                             <div className="relative pl-8">
                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 transition-all duration-500 z-10 ${userLevel >= 1 ? 'bg-blue-500 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-[#111] border-gray-700'}`}></div>
                                <div className={`absolute left-[-1px] top-4 w-[2px] h-[calc(100%+48px)] transition-all duration-700 ${userLevel >= 2 ? 'bg-blue-500' : 'bg-transparent'}`}></div>

                                <h3 className={`text-lg font-bold mb-1 ${userLevel >= 1 ? 'text-white' : 'text-gray-500'}`}>Junior Moderator <span className="text-gray-600 mx-2">→</span> Moderator</h3>
                                <div className={`bg-[#111] border p-4 rounded-xl mt-3 space-y-2 transition-colors ${userLevel >= 1 ? 'border-blue-500/30' : 'border-white/5 opacity-50'}`}>
                                    <div className="flex items-center gap-2 text-xs text-gray-400"><Icons.Clock /> Отработать минимум 10 дней</div>
                                    <div className="text-xs text-gray-400 pl-6 border-l border-white/10 ml-1">
                                        • Более 50 банов<br/>
                                        • Более 20 проверок
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-purple-400 font-bold"><Icons.Book /> Пройти обзвон у куратора</div>
                                </div>
                            </div>

                            {/* Step 3: Moderator -> Senior */}
                            <div className="relative pl-8">
                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 transition-all duration-500 z-10 ${userLevel >= 2 ? 'bg-purple-500 border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-[#111] border-gray-700'}`}></div>
                                <div className={`absolute left-[-1px] top-4 w-[2px] h-[calc(100%+48px)] transition-all duration-700 ${userLevel >= 3 ? 'bg-purple-500' : 'bg-transparent'}`}></div>

                                <h3 className={`text-lg font-bold mb-1 ${userLevel >= 2 ? 'text-white' : 'text-gray-500'}`}>Moderator <span className="text-gray-600 mx-2">→</span> Senior Moderator</h3>
                                <div className={`bg-[#111] border p-4 rounded-xl mt-3 space-y-2 transition-colors ${userLevel >= 2 ? 'border-purple-500/30' : 'border-white/5 opacity-50'}`}>
                                    <div className="flex items-center gap-2 text-xs text-gray-400"><Icons.Clock /> Отработать минимум 1.5 месяца</div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400"><Icons.Shield /> Хороший опыт проверок</div>
                                     <div className="text-xs text-gray-400 pl-6 border-l border-white/10 ml-1">
                                        • Более 50 банов<br/>
                                        • Более 20 проверок
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-purple-400 font-bold"><Icons.Book /> Пройти обзвон у куратора</div>
                                </div>
                            </div>

                             {/* Step 4: Senior -> Curator */}
                             <div className="relative pl-8">
                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 transition-all duration-500 z-10 ${userLevel >= 3 ? 'bg-orange-500 border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-[#111] border-gray-700'}`}></div>
                                
                                <h3 className={`text-lg font-bold mb-1 ${userLevel >= 3 ? 'text-white' : 'text-gray-500'}`}>Senior Moderator <span className="text-gray-600 mx-2">→</span> Curator</h3>
                                <div className={`bg-[#111] border p-4 rounded-xl mt-3 space-y-2 transition-colors ${userLevel >= 3 ? 'border-orange-500/30' : 'border-white/5 opacity-50'}`}>
                                    <div className="flex items-center gap-2 text-xs text-orange-400 font-bold"><Icons.Award /> Назначение по усмотрению руководства</div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'SALARY':
                return (
                    <div className="space-y-8 animate-fade-in pb-10">
                        <div className="border-b border-white/5 pb-6">
                            <h1 className="text-3xl font-black text-white uppercase tracking-tight">Зарплата и Выплаты</h1>
                            <p className="text-gray-500 text-sm mt-2 font-mono">Тарифы за действия и порядок вывода средств.</p>
                        </div>
                         
                         {/* Rates */}
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-[#111] border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center text-center hover:border-red-500/30 transition-colors group">
                                <div className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2 group-hover:text-red-400">Бан</div>
                                <div className="text-4xl font-black text-white">600 <span className="text-base font-normal text-gray-600">₪</span></div>
                            </div>
                            <div className="bg-[#111] border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center text-center hover:border-orange-500/30 transition-colors group">
                                <div className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2 group-hover:text-orange-400">Мут</div>
                                <div className="text-4xl font-black text-white">200 <span className="text-base font-normal text-gray-600">₪</span></div>
                            </div>
                            <div className="bg-[#111] border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center text-center hover:border-blue-500/30 transition-colors group">
                                <div className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2 group-hover:text-blue-400">Проверка</div>
                                <div className="text-4xl font-black text-white">350 <span className="text-base font-normal text-gray-600">₪</span></div>
                            </div>
                        </div>

                        {/* Info Block */}
                        <div className="bg-gradient-to-br from-[#111] to-[#0d0d0d] border border-white/5 p-6 rounded-2xl relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px]"></div>
                             <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-4 relative z-10">Основные моменты</h3>
                             <ul className="space-y-3 text-sm text-gray-400 relative z-10">
                                <li className="flex items-start gap-3">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
                                    <span>Стажёры (Trainee) не получают зарплату.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div>
                                    <span>Зарплата выдаётся от должности Junior Moderator.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                                    <span>Выплаты производятся в конце недели.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></div>
                                    <span><strong className="text-purple-300">Премия</strong> — дополнительное вознаграждение за отличную активность в течение недели.</span>
                                </li>
                             </ul>
                             
                             <div className="mt-6 pt-6 border-t border-white/5 text-xs text-gray-500 font-mono">
                                Зарплата — это поощрение. Вы можете вывести её на личный аккаунт или твинк через вкладку <span className="text-white font-bold">"Кошелек"</span> в профиле.
                             </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[500px]">
            {/* Sidebar Navigation */}
            <div className="w-full lg:w-72 shrink-0 flex flex-col gap-2">
                <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-2 flex flex-col gap-1 sticky top-6">
                    <div className="px-4 py-3 mb-2 border-b border-white/5">
                        <span className="text-xs font-black uppercase tracking-widest text-gray-500">Навигация</span>
                    </div>
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActivePage(item.id)}
                            className={`group flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all duration-300 ${
                                activePage === item.id 
                                ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)]' 
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon />
                                <span className="text-[11px] font-bold uppercase tracking-wider">{item.label}</span>
                            </div>
                            {activePage === item.id && (
                                <div className="animate-fade-in"><Icons.ChevronRight /></div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-[#0A0A0A] border border-white/5 rounded-2xl p-8 lg:p-12 relative overflow-hidden min-h-[600px]">
                 {/* Background decoration */}
                 <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/5 blur-[100px] pointer-events-none"></div>
                 
                 <div className="relative z-10 max-w-3xl">
                    {renderContent()}
                 </div>
            </div>
        </div>
    );
};

export default Wiki;