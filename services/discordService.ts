
import { DISCORD_CLIENT_ID, TARGET_GUILD_ID, STAFF_ROLE_ID, BOT_TOKEN, getRedirectUri, API_BASE_URL } from '../constants';
import { DiscordUser, GuildMember } from '../types';

export const getLoginUrl = () => {
  const redirectUri = encodeURIComponent(getRedirectUri());
  // Scopes: identify (получить профиль)
  const scope = encodeURIComponent('identify'); // guilds.members.read убрал, так как проверяем через бэк
  return `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}`;
};

export const fetchCurrentUser = async (accessToken: string): Promise<DiscordUser> => {
  const response = await fetch('https://discord.com/api/users/@me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }

  return response.json();
};

export const checkUserRole = async (userId: string): Promise<boolean> => {
  try {
    // Используем константу URL
    const response = await fetch(`${API_BASE_URL}/api/check-access/${userId}`);
    
    if (!response.ok) {
        return false;
    }

    const data = await response.json();
    return data.hasAccess;
  } catch (error) {
    console.error("Error checking role:", error);
    return false;
  }
};

export const fetchStaffMembers = async (): Promise<GuildMember[]> => {
  // Используем константу URL
  const API_URL = `${API_BASE_URL}/api/staff`;
  
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Ошибка сервера: ${response.status}`);
    }

    const members: GuildMember[] = await response.json();
    
    // Сортировка по нику для красоты
    members.sort((a, b) => {
        const nameA = a.nick || a.user.global_name || a.user.username;
        const nameB = b.nick || b.user.global_name || b.user.username;
        return nameA.localeCompare(nameB);
    });

    return members;

  } catch (error) {
    console.error("Failed to fetch staff members:", error);
    throw error;
  }
};

export const updateMemberIgn = async (userId: string, ign: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/ign`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, ign })
    });

    if (!response.ok) {
        throw new Error("Failed to update IGN");
    }
};
