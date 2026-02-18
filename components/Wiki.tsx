import React, { useState } from 'react';

// --- ICONS ---
const Icons = {
    Book: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
    Shield: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
    TrendingUp: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>,
    DollarSign: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
    ChevronRight: () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
};

type WikiPage = 'REGULATIONS' | 'CHEATS' | 'PROMOTIONS' | 'SALARY';

const Wiki: React.FC = () => {
    const [activePage, setActivePage] = useState<WikiPage>('REGULATIONS');

    const menuItems: { id: WikiPage; label: string; icon: React.FC }[] = [
        { id: 'REGULATIONS', label: 'Внутренний регламент', icon: Icons.Book },
        { id: 'CHEATS', label: 'Проверка на читы', icon: Icons.Shield },
        { id: 'PROMOTIONS', label: 'Повышения', icon: Icons.TrendingUp },
        { id: 'SALARY', label: 'Зарплата', icon: Icons.DollarSign },
    ];

    const renderContent = () => {
        switch (activePage) {
            case 'REGULATIONS':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="border-b border-white/5 pb-4 mb-6">
                            <h1 className="text-3xl font-black text-white uppercase tracking-tight">Внутренний регламент</h1>
                            <p className="text-gray-500 text-sm mt-2 font-mono">Правила и обязанности персонала проекта.</p>
                        </div>
                        <div className="text-gray-400 text-sm leading-relaxed space-y-4">
                            <p>Информация загружается...</p>
                            {/* Placeholder for content */}
                            <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse"></div>
                            <div className="h-4 w-1/2 bg-white/5 rounded animate-pulse"></div>
                            <div className="h-4 w-5/6 bg-white/5 rounded animate-pulse"></div>
                        </div>
                    </div>
                );
            case 'CHEATS':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="border-b border-white/5 pb-4 mb-6">
                            <h1 className="text-3xl font-black text-white uppercase tracking-tight">Проверка на читы</h1>
                            <p className="text-gray-500 text-sm mt-2 font-mono">Методички и инструменты для выявления ПО.</p>
                        </div>
                        <div className="text-gray-400 text-sm leading-relaxed space-y-4">
                            <p>Информация загружается...</p>
                             <div className="h-32 w-full bg-white/5 rounded-xl border border-white/5 flex items-center justify-center">
                                <span className="text-gray-600 text-xs font-mono uppercase">Видео-гайд скоро будет доступен</span>
                             </div>
                        </div>
                    </div>
                );
            case 'PROMOTIONS':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="border-b border-white/5 pb-4 mb-6">
                            <h1 className="text-3xl font-black text-white uppercase tracking-tight">Система повышения</h1>
                            <p className="text-gray-500 text-sm mt-2 font-mono">Критерии для карьерного роста.</p>
                        </div>
                        <div className="text-gray-400 text-sm leading-relaxed space-y-4">
                             <p>Информация загружается...</p>
                        </div>
                    </div>
                );
            case 'SALARY':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="border-b border-white/5 pb-4 mb-6">
                            <h1 className="text-3xl font-black text-white uppercase tracking-tight">Зарплата и Выплаты</h1>
                            <p className="text-gray-500 text-sm mt-2 font-mono">Тарифы за действия и порядок вывода средств.</p>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-[#111] border border-white/5 p-4 rounded-xl">
                                <div className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Бан</div>
                                <div className="text-2xl font-bold text-red-400">600 ₪</div>
                            </div>
                            <div className="bg-[#111] border border-white/5 p-4 rounded-xl">
                                <div className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Мут</div>
                                <div className="text-2xl font-bold text-orange-400">200 ₪</div>
                            </div>
                            <div className="bg-[#111] border border-white/5 p-4 rounded-xl">
                                <div className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Проверка</div>
                                <div className="text-2xl font-bold text-blue-400">350 ₪</div>
                            </div>
                        </div>
                        <div className="text-gray-400 text-sm leading-relaxed">
                             <p>Для вывода средств используйте вкладку "Кошелек" в вашем профиле.</p>
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