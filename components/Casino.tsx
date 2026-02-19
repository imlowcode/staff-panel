import React, { useState, useEffect } from 'react';
import { DiscordUser } from '../types';
import { API_BASE_URL } from '../constants';

interface CasinoProps {
    currentUser: DiscordUser;
    onBack: () => void;
}

type GameType = 'coinflip' | 'slots' | 'dice' | null;

const Casino: React.FC<CasinoProps> = ({ currentUser, onBack }) => {
    const [balance, setBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedGame, setSelectedGame] = useState<GameType>(null);
    const [betAmount, setBetAmount] = useState<string>('100');
    const [gameResult, setGameResult] = useState<any>(null);
    const [animating, setAnimating] = useState(false);

    // Game Specific States
    const [prediction, setPrediction] = useState<string>('');

    useEffect(() => {
        fetchBalance();
    }, []);

    const fetchBalance = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/economy/${currentUser.id}`);
            const data = await res.json();
            setBalance(data.balance);
        } catch (e) {
            console.error("Failed to fetch balance", e);
        }
    };

    const handlePlay = async () => {
        if (!selectedGame || !balance) return;
        const bet = parseInt(betAmount);
        if (isNaN(bet) || bet <= 0) return alert("Неверная ставка");
        if (bet > balance) return alert("Недостаточно средств");

        // Validation per game
        if (selectedGame === 'coinflip' && !['heads', 'tails'].includes(prediction)) return alert("Выберите Орёл или Решка");
        if (selectedGame === 'dice' && !['under', 'over', 'exact'].includes(prediction)) return alert("Выберите исход");

        setLoading(true);
        setAnimating(true);
        setGameResult(null);

        // Artificial delay for animation suspense
        setTimeout(async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/casino/play`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: currentUser.id,
                        gameId: selectedGame,
                        betAmount: bet,
                        prediction
                    })
                });

                const data = await res.json();
                
                if (data.error) {
                    alert(data.error);
                    setAnimating(false);
                    setLoading(false);
                    return;
                }

                setGameResult(data);
                setBalance(data.balance);
                setAnimating(false);
                setLoading(false);

            } catch (e) {
                console.error(e);
                setAnimating(false);
                setLoading(false);
                alert("Ошибка игры");
            }
        }, 2000); // 2s animation time
    };

    const renderGameSelector = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
            {/* COINFLIP CARD */}
            <button 
                onClick={() => { setSelectedGame('coinflip'); setPrediction('heads'); }}
                className="group relative bg-[#151515] border border-white/10 rounded-2xl p-8 hover:border-yellow-500/50 transition-all hover:-translate-y-2 hover:shadow-2xl overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-4xl mb-4">🪙</div>
                <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Coinflip</h3>
                <p className="text-gray-500 text-xs font-mono">50/50 Шанс • x2 Выигрыш</p>
            </button>

            {/* SLOTS CARD */}
            <button 
                onClick={() => { setSelectedGame('slots'); setPrediction(''); }}
                className="group relative bg-[#151515] border border-white/10 rounded-2xl p-8 hover:border-purple-500/50 transition-all hover:-translate-y-2 hover:shadow-2xl overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-4xl mb-4">🎰</div>
                <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Slots</h3>
                <p className="text-gray-500 text-xs font-mono">Джекпот x10 • Пары x1.5</p>
            </button>

            {/* DICE CARD */}
            <button 
                onClick={() => { setSelectedGame('dice'); setPrediction('under'); }}
                className="group relative bg-[#151515] border border-white/10 rounded-2xl p-8 hover:border-blue-500/50 transition-all hover:-translate-y-2 hover:shadow-2xl overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-4xl mb-4">🎲</div>
                <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Lucky 7</h3>
                <p className="text-gray-500 text-xs font-mono">Больше/Меньше 7 (x2) • Ровно 7 (x5)</p>
            </button>
        </div>
    );

    const renderActiveGame = () => (
        <div className="w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 relative overflow-hidden animate-fade-in">
            <button 
                onClick={() => { setSelectedGame(null); setGameResult(null); }}
                className="absolute top-6 left-6 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2"
            >
                ← Назад
            </button>

            <div className="flex flex-col items-center mt-8">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-8">
                    {selectedGame === 'coinflip' && 'Coinflip'}
                    {selectedGame === 'slots' && 'Slots'}
                    {selectedGame === 'dice' && 'Lucky 7'}
                </h2>

                {/* GAME VISUALS */}
                <div className="mb-12 min-h-[120px] flex items-center justify-center">
                    {selectedGame === 'coinflip' && (
                        <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center text-5xl bg-[#151515] transition-all duration-500 ${animating ? 'animate-spin border-yellow-500' : 'border-white/20'}`}>
                            {animating ? '❓' : (gameResult ? (gameResult.result.outcome === 'heads' ? '🦅' : '🪙') : '🪙')}
                        </div>
                    )}

                    {selectedGame === 'slots' && (
                        <div className="flex gap-4">
                            {[0, 1, 2].map(i => (
                                <div key={i} className="w-20 h-24 bg-[#151515] border border-white/20 rounded-xl flex items-center justify-center text-4xl overflow-hidden">
                                    <div className={`transition-transform duration-300 ${animating ? 'animate-pulse blur-sm' : ''}`}>
                                        {animating ? '❓' : (gameResult ? gameResult.result.reels[i] : '🍒')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {selectedGame === 'dice' && (
                        <div className="flex gap-6">
                            <div className={`w-24 h-24 bg-[#151515] border-2 rounded-2xl flex items-center justify-center text-4xl ${animating ? 'animate-bounce border-blue-500' : 'border-white/20'}`}>
                                {animating ? '🎲' : (gameResult ? gameResult.result.d1 : 1)}
                            </div>
                            <div className={`w-24 h-24 bg-[#151515] border-2 rounded-2xl flex items-center justify-center text-4xl ${animating ? 'animate-bounce border-blue-500 delay-100' : 'border-white/20'}`}>
                                {animating ? '🎲' : (gameResult ? gameResult.result.d2 : 6)}
                            </div>
                        </div>
                    )}
                </div>

                {/* RESULT MESSAGE */}
                {gameResult && !animating && (
                    <div className={`mb-8 text-center animate-slide-up`}>
                        <div className={`text-2xl font-black uppercase tracking-widest ${gameResult.won ? 'text-green-500' : 'text-red-500'}`}>
                            {gameResult.won ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ'}
                        </div>
                        <div className="text-sm font-mono text-gray-400 mt-1">
                            {gameResult.won ? `+${gameResult.winAmount} 💎` : `-${betAmount} 💎`}
                        </div>
                    </div>
                )}

                {/* CONTROLS */}
                <div className="w-full max-w-md space-y-6">
                    
                    {/* PREDICTION SELECTORS */}
                    {selectedGame === 'coinflip' && (
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setPrediction('heads')}
                                className={`p-4 rounded-xl border font-bold uppercase tracking-widest transition-all ${prediction === 'heads' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500' : 'bg-[#151515] border-white/10 text-gray-500 hover:bg-white/5'}`}
                            >
                                Орёл 🦅
                            </button>
                            <button 
                                onClick={() => setPrediction('tails')}
                                className={`p-4 rounded-xl border font-bold uppercase tracking-widest transition-all ${prediction === 'tails' ? 'bg-gray-500/20 border-gray-500 text-gray-300' : 'bg-[#151515] border-white/10 text-gray-500 hover:bg-white/5'}`}
                            >
                                Решка 🪙
                            </button>
                        </div>
                    )}

                    {selectedGame === 'dice' && (
                        <div className="grid grid-cols-3 gap-2">
                            <button 
                                onClick={() => setPrediction('under')}
                                className={`p-3 rounded-xl border font-bold uppercase text-[10px] tracking-widest transition-all ${prediction === 'under' ? 'bg-blue-500/20 border-blue-500 text-blue-500' : 'bg-[#151515] border-white/10 text-gray-500 hover:bg-white/5'}`}
                            >
                                Меньше 7 (x2)
                            </button>
                            <button 
                                onClick={() => setPrediction('exact')}
                                className={`p-3 rounded-xl border font-bold uppercase text-[10px] tracking-widest transition-all ${prediction === 'exact' ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-[#151515] border-white/10 text-gray-500 hover:bg-white/5'}`}
                            >
                                Ровно 7 (x5)
                            </button>
                            <button 
                                onClick={() => setPrediction('over')}
                                className={`p-3 rounded-xl border font-bold uppercase text-[10px] tracking-widest transition-all ${prediction === 'over' ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-[#151515] border-white/10 text-gray-500 hover:bg-white/5'}`}
                            >
                                Больше 7 (x2)
                            </button>
                        </div>
                    )}

                    {/* BET INPUT */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 font-bold">💎</div>
                        <input 
                            type="number" 
                            value={betAmount}
                            onChange={(e) => setBetAmount(e.target.value)}
                            className="w-full bg-[#151515] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white font-mono font-bold focus:outline-none focus:border-purple-500 transition-colors"
                            placeholder="Сумма ставки"
                        />
                    </div>

                    {/* PLAY BUTTON */}
                    <button 
                        onClick={handlePlay}
                        disabled={loading || animating}
                        className="w-full bg-white text-black font-black uppercase tracking-widest py-4 rounded-xl hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                    >
                        {loading || animating ? 'Играем...' : 'Сделать ставку'}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col items-center w-full animate-fade-in">
            {/* BALANCE HEADER */}
            <div className="mb-12 text-center">
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600 uppercase tracking-tighter mb-2">
                    NullX Casino
                </h1>
                <div className="inline-flex items-center gap-2 bg-[#151515] border border-white/10 px-6 py-2 rounded-full">
                    <span className="text-2xl">💎</span>
                    <span className="text-xl font-mono font-bold text-white">
                        {balance !== null ? balance.toLocaleString() : '...'}
                    </span>
                </div>
            </div>

            {selectedGame ? renderActiveGame() : renderGameSelector()}
        </div>
    );
};

export default Casino;
