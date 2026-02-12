import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// КОНФИГУРАЦИЯ БОТА (Берем из переменных окружения)
const TARGET_GUILD_ID = '1458138848822431770'; 
const STAFF_ROLE_ID = '1458158245700046901';   
const BOT_TOKEN = process.env.BOT_TOKEN; // <-- ТЕПЕРЬ БЕЗОПАСНО

// ID АДМИНИСТРАТОРОВ
const ALLOWED_ADMIN_IDS = [
    '802105175720460318', 
    '440704669178789888', 
    '591281053503848469',
    '1455582084893642998', 
    '846540575032344596', 
    '1468330580910542868'
];

// КОНФИГУРАЦИЯ ЗАРПЛАТ
const SALARY_RATES = {
    BAN: 600,
    MUTE: 200,
    CHECK: 350
};

// ДАТА НАЧАЛА ОТСЧЕТА (11.02.2026)
const START_DATE_LIMIT = new Date('2026-02-11T00:00:00').getTime();

// --- НАСТРОЙКА БАЗ ДАННЫХ ---
// Используем process.env для паролей
const dbLiteBans = mysql.createPool({
    host: process.env.DB_HOST || 'panel.nullx.space',
    user: process.env.DB_USER || 'u1_FAXro5fVCj',
    password: process.env.DB_PASSWORD, // <-- БЕРЕТСЯ ИЗ НАСТРОЕК RENDER
    database: 's1_litebans',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
});

const dbLogs = mysql.createPool({
    host: process.env.DB_LOGS_HOST || 'panel.nullx.space',
    port: 3306,
    user: process.env.DB_LOGS_USER || 'u1_McHWJLbCr4',
    password: process.env.DB_LOGS_PASSWORD, // <-- БЕРЕТСЯ ИЗ НАСТРОЕК RENDER
    database: 's1_logs',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// --- ИНИЦИАЛИЗАЦИЯ ТАБЛИЦ ---
const initDb = async () => {
    try {
        const connection = await dbLogs.getConnection();
        
        // 1. Кошельки
        await connection.query(`
            CREATE TABLE IF NOT EXISTS staff_wallets (
                discord_id VARCHAR(32) PRIMARY KEY,
                balance BIGINT DEFAULT 0
            )
        `);

        // 2. Транзакции
        await connection.query(`
            CREATE TABLE IF NOT EXISTS staff_transactions (
                id VARCHAR(36) PRIMARY KEY,
                discord_id VARCHAR(32),
                type VARCHAR(20),
                amount INT,
                date BIGINT,
                initiator VARCHAR(32),
                comment TEXT,
                INDEX (discord_id)
            )
        `);

        // 3. Профили (Связь Discord <-> IGN)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS staff_profiles (
                discord_id VARCHAR(32) PRIMARY KEY,
                ign VARCHAR(64) NOT NULL
            )
        `);

        // 4. Состояние системы (Для авто-зарплаты)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS system_state (
                service_key VARCHAR(50) PRIMARY KEY,
                value VARCHAR(255)
            )
        `);

        connection.release();
        console.log("✅ Все таблицы БД проверены/созданы в s1_logs");
    } catch (e) {
        console.error("❌ Ошибка инициализации БД:", e);
    }
};
initDb();

// --- SQL ХЕЛПЕРЫ ---

const getIgnByDiscordId = async (discordId) => {
    try {
        const [rows] = await dbLogs.query('SELECT ign FROM staff_profiles WHERE discord_id = ?', [discordId]);
        return rows.length > 0 ? rows[0].ign : null;
    } catch (e) { return null; }
};

const getDiscordIdByIgn = async (ign) => {
    if (!ign) return null;
    try {
        const [rows] = await dbLogs.query('SELECT discord_id FROM staff_profiles WHERE LOWER(ign) = LOWER(?)', [ign]);
        return rows.length > 0 ? rows[0].discord_id : null;
    } catch (e) { return null; }
};

const saveProfileIgn = async (discordId, ign) => {
    await dbLogs.query(
        'INSERT INTO staff_profiles (discord_id, ign) VALUES (?, ?) ON DUPLICATE KEY UPDATE ign = ?',
        [discordId, ign, ign]
    );
};

const getState = async () => {
    try {
        const [rows] = await dbLogs.query('SELECT service_key, value FROM system_state');
        const state = {};
        rows.forEach(row => { state[row.service_key] = row.value; });
        return state;
    } catch (e) { return {}; }
};

const saveState = async (key, value) => {
    await dbLogs.query(
        'INSERT INTO system_state (service_key, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
        [key, String(value), String(value)]
    );
};


// --- СЕРВИС АВТОМАТИЧЕСКОЙ ЗАРПЛАТЫ ---
const startAutoSalaryService = async () => {
    console.log("🔄 Запуск сервиса авто-зарплаты...");
    
    let isProcessing = false;

    // Инициализация
    const state = await getState();
    if (!state.lastBanId) {
        try {
            const [firstBan] = await dbLiteBans.query('SELECT id FROM litebans_bans WHERE time >= ? ORDER BY id ASC LIMIT 1', [START_DATE_LIMIT]);
            const startBanId = firstBan.length > 0 ? firstBan[0].id - 1 : 0;
            await saveState('lastBanId', startBanId);

            const [firstMute] = await dbLiteBans.query('SELECT id FROM litebans_mutes WHERE time >= ? ORDER BY id ASC LIMIT 1', [START_DATE_LIMIT]);
            const startMuteId = firstMute.length > 0 ? firstMute[0].id - 1 : 0;
            await saveState('lastMuteId', startMuteId);

            await saveState('lastCheckDate', START_DATE_LIMIT);
        } catch (e) { console.error("Ошибка инит курсоров", e); }
    }

    const checkNewEntries = async () => {
        if (isProcessing) return;
        isProcessing = true;

        try {
            const currentState = await getState();
            
            // --- 1. БАНЫ ---
            const lastBanId = parseInt(currentState.lastBanId) || 0;
            const [newBans] = await dbLiteBans.query(
                'SELECT * FROM litebans_bans WHERE id > ? AND time >= ? ORDER BY id ASC LIMIT 50', 
                [lastBanId, START_DATE_LIMIT]
            );

            if (newBans.length > 0) {
                let maxId = lastBanId;
                for (const ban of newBans) {
                    maxId = Math.max(maxId, ban.id);
                    const adminIgn = ban.banned_by_name;
                    if (!adminIgn || ['Console','Anticheat','RCON'].includes(adminIgn)) continue;
                    
                    if (await checkTransactionExists(`%бан #${ban.id}%`)) continue;

                    const discordId = await getDiscordIdByIgn(adminIgn);
                    if (discordId) {
                        await addBalance(discordId, SALARY_RATES.BAN, 'AUTO_SALARY', `Зарплата за бан #${ban.id}`);
                        console.log(`💰 [БАН] Выплата -> ${adminIgn}`);
                    }
                }
                await saveState('lastBanId', maxId);
            }

            // --- 2. МУТЫ ---
            const lastMuteId = parseInt(currentState.lastMuteId) || 0;
            const [newMutes] = await dbLiteBans.query(
                'SELECT * FROM litebans_mutes WHERE id > ? AND time >= ? ORDER BY id ASC LIMIT 50', 
                [lastMuteId, START_DATE_LIMIT]
            );

            if (newMutes.length > 0) {
                let maxId = lastMuteId;
                for (const mute of newMutes) {
                    maxId = Math.max(maxId, mute.id);
                    const adminIgn = mute.banned_by_name;
                    if (!adminIgn || ['Console','Anticheat','RCON'].includes(adminIgn)) continue;

                    if (await checkTransactionExists(`%мут #${mute.id}%`)) continue;

                    const discordId = await getDiscordIdByIgn(adminIgn);
                    if (discordId) {
                        await addBalance(discordId, SALARY_RATES.MUTE, 'AUTO_SALARY', `Зарплата за мут #${mute.id}`);
                        console.log(`💰 [МУТ] Выплата -> ${adminIgn}`);
                    }
                }
                await saveState('lastMuteId', maxId);
            }

            // --- 3. ПРОВЕРКИ ---
            const lastCheckDate = parseInt(currentState.lastCheckDate) || START_DATE_LIMIT;
            const [newChecks] = await dbLogs.query(
                'SELECT * FROM revise_logs WHERE date > ? AND date >= ? ORDER BY date ASC LIMIT 50',
                [lastCheckDate, START_DATE_LIMIT]
            );

            if (newChecks.length > 0) {
                let maxDate = lastCheckDate;
                for (const check of newChecks) {
                    maxDate = Math.max(maxDate, check.date);
                    const adminIgn = check.admin;
                    if (!adminIgn) continue;

                    const uniqueCheckTag = `[ID: ${check.date}]`;
                    if (await checkTransactionExists(`%${uniqueCheckTag}%`)) continue;

                    const discordId = await getDiscordIdByIgn(adminIgn);
                    if (discordId) {
                        await addBalance(discordId, SALARY_RATES.CHECK, 'AUTO_SALARY', `Зарплата за проверку ${check.target} ${uniqueCheckTag}`);
                        console.log(`💰 [ПРОВЕРКА] Выплата -> ${adminIgn}`);
                    }
                }
                await saveState('lastCheckDate', maxDate);
            }

        } catch (e) {
            console.error("Ошибка авто-зарплаты:", e);
        } finally {
            isProcessing = false;
        }
    };

    setInterval(checkNewEntries, 30000);
    checkNewEntries();
};

const checkTransactionExists = async (pattern) => {
    const [rows] = await dbLogs.query('SELECT id FROM staff_transactions WHERE comment LIKE ? LIMIT 1', [pattern]);
    return rows.length > 0;
};

const addBalance = async (discordId, amount, type, comment, initiator = 'SYSTEM') => {
    const connection = await dbLogs.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.query('SELECT balance FROM staff_wallets WHERE discord_id = ? FOR UPDATE', [discordId]);
        let currentBalance = rows.length > 0 ? parseInt(rows[0].balance) : 0;
        if (rows.length === 0) await connection.query('INSERT INTO staff_wallets (discord_id, balance) VALUES (?, 0)', [discordId]);
        
        const newBalance = currentBalance + amount;
        await connection.query('UPDATE staff_wallets SET balance = ? WHERE discord_id = ?', [newBalance, discordId]);
        
        await connection.query(
            'INSERT INTO staff_transactions (id, discord_id, type, amount, date, initiator, comment) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [crypto.randomUUID(), discordId, type, amount, Date.now(), initiator, comment]
        );
        await connection.commit();
        return newBalance;
    } catch (e) {
        await connection.rollback();
        throw e;
    } finally {
        connection.release();
    }
};

// --- API ROUTES ---

app.get('/api/check-access/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const response = await fetch(`https://discord.com/api/guilds/${TARGET_GUILD_ID}/members/${userId}`, {
            headers: { 'Authorization': `Bot ${process.env.BOT_TOKEN}` } // Используем ENV
        });
        if (!response.ok) return res.json({ hasAccess: false });
        
        const member = await response.json();
        const hasRole = member.roles && member.roles.includes(STAFF_ROLE_ID);
        res.json({ hasAccess: hasRole });
    } catch (e) {
        res.status(500).json({ error: "Server Error" });
    }
});

app.get('/api/staff', async (req, res) => {
    try {
        const response = await fetch(`https://discord.com/api/guilds/${TARGET_GUILD_ID}/members?limit=1000`, {
            headers: { 'Authorization': `Bot ${process.env.BOT_TOKEN}` } // Используем ENV
        });
        if (!response.ok) return res.status(500).json({ error: "Discord API Error" });

        const members = await response.json();
        const staffMembers = members.filter(member => member.roles && member.roles.includes(STAFF_ROLE_ID));
        
        const [profiles] = await dbLogs.query('SELECT * FROM staff_profiles');
        const profileMap = {};
        profiles.forEach(p => profileMap[p.discord_id] = p.ign);

        const enriched = staffMembers.map(m => ({
            ...m,
            ign: profileMap[m.user.id] || null
        })).sort((a, b) => (a.nick || a.user.username).localeCompare(b.nick || b.user.username));

        res.json(enriched);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/ign', async (req, res) => {
    const { userId, ign } = req.body;
    if (!userId) return res.status(400).json({ error: "No ID" });
    try {
        await saveProfileIgn(userId, ign || '');
        res.json({ success: true, ign });
    } catch (e) {
        res.status(500).json({ error: "DB Error" });
    }
});

app.get('/api/stats/:ign', async (req, res) => {
    const { ign } = req.params;
    try {
        const [bans] = await dbLiteBans.query('SELECT * FROM litebans_bans WHERE banned_by_name = ? ORDER BY time DESC', [ign]);
        const [mutes] = await dbLiteBans.query('SELECT * FROM litebans_mutes WHERE banned_by_name = ? ORDER BY time DESC', [ign]);
        
        let playtime = 0;
        try {
            const [rows] = await dbLogs.query(
                `SELECT SUM(TIMESTAMPDIFF(SECOND, enterDate, IFNULL(exitDate, NOW()))) as t FROM online_logs WHERE player = ?`, 
                [ign]
            );
            if (rows[0]?.t) playtime = Math.round(rows[0].t / 3600);
        } catch (e) {}

        let checks = [];
        try {
            const [c] = await dbLogs.query('SELECT * FROM revise_logs WHERE admin = ? ORDER BY date DESC', [ign]);
            checks = c;
        } catch(e) {}

        res.json({ playtime, bans, mutes, checks });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
});

app.get('/api/economy/:userId', async (req, res) => {
    try {
        const [w] = await dbLogs.query('SELECT balance FROM staff_wallets WHERE discord_id = ?', [req.params.userId]);
        const [t] = await dbLogs.query('SELECT * FROM staff_transactions WHERE discord_id = ? ORDER BY date DESC LIMIT 50', [req.params.userId]);
        res.json({ balance: w[0]?.balance || 0, history: t });
    } catch (e) { res.status(500).json({ error: "DB Error" }); }
});

app.post('/api/economy/withdraw', async (req, res) => {
    const { userId, amount, ign } = req.body;
    const val = parseInt(amount);
    if (val < 5000) return res.status(400).json({ error: "Минимум 5000" });

    try {
        await addBalance(userId, -val, 'WITHDRAW', `Вывод на ${ign}`, userId);
        await dbLogs.query('INSERT INTO commands (command) VALUES (?)', [`p give ${ign} ${val}`]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

app.post('/api/economy/admin/manage', async (req, res) => {
    const { adminId, targetUserId, amount, type } = req.body;
    if (!ALLOWED_ADMIN_IDS.includes(adminId)) return res.status(403).json({ error: "403" });
    
    const val = parseInt(amount);
    const finalAmt = type === 'ADMIN_REMOVE' ? -val : val;
    try {
        await addBalance(targetUserId, finalAmt, type, "Admin Action", adminId);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Error" }); }
});

app.post('/api/economy/admin/withdraw', async (req, res) => {
    const { adminId, targetUserId, amount, ign } = req.body;
    if (!ALLOWED_ADMIN_IDS.includes(adminId)) return res.status(403).json({ error: "403" });
    
    const val = parseInt(amount);
    try {
        await addBalance(targetUserId, -val, 'WITHDRAW', "Admin Forced Withdraw", adminId);
        await dbLogs.query('INSERT INTO commands (command) VALUES (?)', [`p give ${ign} ${val}`]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Error" }); }
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});