
export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  global_name?: string;
}

export interface GuildMember {
  user: DiscordUser;
  roles: string[];
  nick?: string;
  joined_at: string;
  ign?: string; // Minecraft In-Game Name
}

export enum AuthStatus {
  IDLE,
  LOADING,
  AUTHENTICATED,
  ACCESS_DENIED,
  ERROR
}

// Новые типы для статистики
export interface PlayerBan {
  id: number;
  reason: string;
  banned_by_name: string;
  removed_by_name?: string;
  removed_by_reason?: string;
  removed_by_date?: string; // SQL timestamp
  time: number; // Start time (ms or s)
  until: number; // End time (ms or s, -1 or 0 for perms)
  active: boolean;
}

export interface PlayerMute {
  id: number;
  reason: string;
  banned_by_name: string; // Litebans often uses same col name 'banned_by_name' for mutes
  removed_by_name?: string;
  removed_by_reason?: string;
  removed_by_date?: string;
  time: number;
  until: number;
  active: boolean;
}

export interface PlayerCheck {
  date: number;
  admin: string;
  type: string; // Anydesk/Discord
  target: string;
}

export interface PlayerStats {
  playtime: number; // In hours
  bans: PlayerBan[];
  mutes: PlayerMute[];
  checks: PlayerCheck[];
}

// --- ECONOMY TYPES ---
export interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'ADMIN_ADD' | 'ADMIN_REMOVE' | 'AUTO_SALARY';
  amount: number;
  date: number; // timestamp
  initiator: string; // Discord ID or Name
  comment?: string;
}

export interface EconomyData {
  balance: number;
  history: Transaction[];
}
