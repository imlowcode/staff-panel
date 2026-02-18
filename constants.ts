

// SECURITY WARNING: In a real production app, never expose the BOT_TOKEN in the frontend.
// It should be handled by a backend server. This is for demonstration purposes only.

// НОВЫЕ ДАННЫЕ ОТ ПОЛЬЗОВАТЕЛЯ
export const DISCORD_CLIENT_ID = '1471476282696011879'; 
export const TARGET_GUILD_ID = '1458138848822431770'; 
export const STAFF_ROLE_ID = '1458158245700046901';   
// BOT_TOKEN удален из фронтенда для безопасности. Бэкенд использует его через переменные окружения.
export const BOT_TOKEN = ''; 

// API BASE URL - ВАЖНО ДЛЯ ХОСТИНГА
const isProduction = () => {
    try {
        if ((import.meta as any)?.env?.PROD) return true;
        if (typeof window !== 'undefined') {
             return window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        }
    } catch (e) { }
    return false;
};

export const API_BASE_URL = isProduction()
    ? 'https://staff-api-x7tt.onrender.com' 
    : 'http://localhost:3001';

// Список ID пользователей, которым разрешено менять IGN
export const ALLOWED_ADMIN_IDS = [
    '802105175720460318', 
    '591281053503848469',
    '1455582084893642998', 
    '846540575032344596', 
    '1468330580910542868'
];

// КОНФИГУРАЦИЯ ИЕРАРХИИ РОЛЕЙ (От самой важной к самой низкой)
export const ROLE_HIERARCHY = [
  {
    id: '1458159802105594061',
    name: 'Chief Moderator',
    color: 'from-red-500 to-orange-600',
    shadow: 'shadow-red-500/40',
    badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40'
  },
  {
    id: '1458277039399374991',
    name: 'Curator Moderator',
    color: 'from-orange-400 to-amber-500',
    shadow: 'shadow-orange-500/40',
    badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40'
  },
  {
    id: '1458159110720589944',
    name: 'Senior Moderator',
    color: 'from-purple-500 to-pink-600',
    shadow: 'shadow-purple-500/40',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
  },
  {
    id: '1458158896894967879',
    name: 'Moderator',
    color: 'from-blue-500 to-indigo-600',
    shadow: 'shadow-blue-500/40',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
  },
  {
    id: '1458158059187732666',
    name: 'Junior Moderator',
    color: 'from-cyan-400 to-blue-500',
    shadow: 'shadow-cyan-500/40',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
  },
  {
    id: '1459285694458626222',
    name: 'Trainee',
    color: 'from-emerald-400 to-green-500',
    shadow: 'shadow-emerald-500/40',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  }
];

// Функция для получения точного Redirect URI
export const getRedirectUri = () => {
  if (typeof window !== 'undefined') {
    let url = window.location.origin;
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    return url;
  }
  return 'http://localhost:3000';
};