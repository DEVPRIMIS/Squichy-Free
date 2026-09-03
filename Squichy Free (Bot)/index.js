console.clear();

const util = require('util');
const NOISY_CONSOLE_PATTERNS = [
    'Connection Closed',
    'Cannot derive from empty media key',
    'rate-overlimit',
    'Failed to delete',
    "reading 'title'",
    '@whiskeysockets/baileys',
    'Bad MAC',
    'PreKeyError'
];
function textOfArgs(args) {
    return args.map(a => (typeof a === 'string' ? a : util.inspect(a, { depth: 6 }))).join(' ');
}
function isNoisyLog(args) {
    const text = textOfArgs(args);
    return NOISY_CONSOLE_PATTERNS.some(p => text.includes(p));
}
['log', 'error', 'warn', 'info'].forEach((method) => {
    const original = console[method].bind(console);
    console[method] = (...args) => {
        if (isNoisyLog(args)) return;
        original(...args);
    };
});

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const pino = require('pino');
const chalk = require('chalk');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    jidDecode,
    makeInMemoryStore
} = require('@whiskeysockets/baileys');

const {
    smsg
} = require('./myfunc');

process.on('uncaughtException', (err) => {
});
process.on('unhandledRejection', (reason) => {
});

const PORT = process.env.SERVER_PORT || process.env.PORT || 3000;
const SESSIONS_DIR = path.join(__dirname, 'sessions');
const SETTINGS_DIR = path.join(__dirname, 'settings');
fs.mkdirSync(SESSIONS_DIR, { recursive: true });
fs.mkdirSync(SETTINGS_DIR, { recursive: true });
fs.mkdirSync(path.join(__dirname, 'm'), { recursive: true });

function getSettingsPath(numero) {
    return path.join(SETTINGS_DIR, `${numero}.json`);
}

function loadSessionSettings(numero) {
    try {
        const p = getSettingsPath(numero);
        if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) {}
    return { public: true };
}

function saveSessionSettings(numero, patch) {
    try {
        const current = loadSessionSettings(numero);
        fs.writeFileSync(getSettingsPath(numero), JSON.stringify({ ...current, ...patch }, null, 2));
    } catch (e) {}
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);


app.use(express.json());

const sessions = new Map(); 
const pendingCodes = new Map(); 

function getSessionDir(numero) {
    const clean = numero.replace(/[^0-9]/g, '');
    return path.join(SESSIONS_DIR, clean);
}

function broadcastSessions() {
    const data = [];
    for (const [numero, s] of sessions.entries()) {
        data.push({ numero, status: s.status, connectedAt: s.connectedAt, name: s.name || null });
    }
    io.emit('sessions:update', data);
}

async function loadExistingSessions() {
    if (!fs.existsSync(SESSIONS_DIR)) return;
    const dirs = fs.readdirSync(SESSIONS_DIR);
    for (const dir of dirs) {
        const fullPath = path.join(SESSIONS_DIR, dir);
        if (fs.statSync(fullPath).isDirectory()) {
            const credsFile = path.join(fullPath, 'creds.json');
            if (fs.existsSync(credsFile)) {
                await createSession(dir, null);
            }
        }
    }
}

async function createSession(numero, socketId) {
    const clean = numero.replace(/[^0-9]/g, '');

    if (sessions.has(clean) && sessions.get(clean).status === 'connected') {
        if (socketId) io.to(socketId).emit('error', { message: 'This number is already connected!' });
        return { success: false, error: 'already_connected' };
    }

    const connectedCount = [...sessions.values()].filter(s => s.status === 'connected').length;
    if (connectedCount >= 100 && !sessions.has(clean)) {
        if (socketId) io.to(socketId).emit('error', { message: 'SERVER_FULL' });
        return { success: false, error: 'server_full' };
    }

    sessions.set(clean, { status: 'connecting', connectedAt: null, name: null });
    broadcastSessions();

    try {
        const sessionDir = getSessionDir(clean);
        fs.mkdirSync(sessionDir, { recursive: true });

        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        const Primis = makeWASocket({
            printQRInTerminal: false,
            syncFullHistory: false,
            markOnlineOnConnect: false,
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 0,
            keepAliveIntervalMs: 10000,
            generateHighQualityLinkPreview: true,
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            logger: pino({ level: 'silent' }),
            auth: state
        });

        const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });
        store.bind(Primis.ev);

        const storeClearInterval = setInterval(() => {
            try { store.messages?.clear?.(); store.chats?.clear?.(); } catch (e) {}
        }, 3600000);

        await new Promise(r => setTimeout(r, 3000));

        let pairResult = { success: true };

        if (!Primis.authState.creds.registered) {
            try {
                const code = await Primis.requestPairingCode(clean);
                const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
                pendingCodes.set(clean, formatted);
                io.to(`numero:${clean}`).emit('pairing:code', { numero: clean, code: formatted });
                if (socketId) io.to(socketId).emit('pairing:code', { numero: clean, code: formatted });
                pairResult = { success: true, code: formatted };
            } catch (e) {
                const errMsg = { message: 'Failed to generate code. Check the number.' };
                io.to(`numero:${clean}`).emit('error', errMsg);
                if (socketId) io.to(socketId).emit('error', errMsg);
                clearInterval(storeClearInterval);
                sessions.delete(clean);
                broadcastSessions();
                return { success: false, error: 'pairing_code_failed' };
            }
        }

        Primis.decodeJid = (jid) => {
            if (!jid) return jid;
            if (/:\d+@/gi.test(jid)) {
                let decode = jidDecode(jid) || {};
                return decode.user && decode.server && decode.user + '@' + decode.server || jid;
            } else return jid;
        };

        let node, attrs;
        Primis.ws.on('CB:message', (n) => { node = n.content; attrs = n.attrs; });

        Primis.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                const mek = chatUpdate.messages[0];
                if (!mek.message) return;
                mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
                if (mek.key && mek.key.remoteJid === 'status@broadcast') Primis.readMessages([mek.key]);
                if (!Primis.public && !mek.key.fromMe && chatUpdate.type === 'notify') return;
                if (mek.key.id.startsWith('D5PRIMIS') && mek.key.id.length === 16) return;

                let m = smsg(Primis, mek, store);
                m = { ...m, attributs: attrs, node };


                require('./squichy.js')(Primis, m, chatUpdate, store);
            } catch (error) {
            }
        });

        Primis.sendText = (jid, text, quoted = '', options) => Primis.sendMessage(jid, { text, ...options }, { quoted });

        Primis.public = loadSessionSettings(clean).public !== false;
        Primis.saveSetting = (key, value) => saveSessionSettings(clean, { [key]: value });

        Primis.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
                const name = Primis.user?.name || Primis.user?.id?.split(':')[0] || clean;
                sessions.set(clean, { sock: Primis, store, status: 'connected', connectedAt: new Date().toISOString(), name, _retries: 0 });
                pendingCodes.delete(clean);
                io.to(`numero:${clean}`).emit('session:connected', { numero: clean, name });
                io.emit('session:connected', { numero: clean, name });
                broadcastSessions();
            }

  if (connection === 'close') {
    const code = lastDisconnect?.error?.output?.statusCode;
    const loggedOut = code === DisconnectReason.loggedOut;

    if (loggedOut) {
        clearInterval(storeClearInterval);
        sessions.delete(clean);
        fs.rmSync(getSessionDir(clean), { recursive: true, force: true });
        io.emit('session:disconnected', { numero: clean, reason: 'logged_out' });
        broadcastSessions();
    } else if (!Primis.authState.creds.registered) {
        clearInterval(storeClearInterval);
        sessions.delete(clean);
        fs.rmSync(getSessionDir(clean), { recursive: true, force: true });
        io.to(`numero:${clean}`).emit('error', { message: 'Connection closed before pairing completed. Please try again.' });
        broadcastSessions();
    } else {
        const current = sessions.get(clean) || {};
        const retries = (current._retries || 0) + 1;

        if (retries >= 3) {
            clearInterval(storeClearInterval);
            sessions.delete(clean);
            fs.rmSync(getSessionDir(clean), { recursive: true, force: true });
            io.emit('session:disconnected', { numero: clean, reason: 'unreachable' });
            broadcastSessions();
        } else {
            try { Primis.ev.removeAllListeners(); Primis.end(undefined); } catch (e) {}
            clearInterval(storeClearInterval);
            sessions.set(clean, { ...current, status: 'reconnecting', _retries: retries });
            broadcastSessions();
            setTimeout(() => createSession(clean, null), 5000);
        }
    }
}
        });

        Primis.ev.on('error', (err) => {
        });

        Primis.ev.on('creds.update', saveCreds);

        sessions.set(clean, { ...(sessions.get(clean) || {}), sock: Primis, store });

        return pairResult;

    } catch (err) {
        try { clearInterval(storeClearInterval); } catch (e) {}
        sessions.delete(clean);
        broadcastSessions();
        if (socketId) io.to(socketId).emit('error', { message: 'Internal error, try again.' });
        return { success: false, error: err?.message || 'create_session_error' };
    }
}

const WORKER_SECRET = process.env.WORKER_SECRET || "sqx_worker_9f2a7c1e4b8d3f60";
const MAX_SESSIONS = 100;

app.get('/api/status', (req, res) => {
    const connectedCount = [...sessions.values()].filter(s => s.status === 'connected').length;
    res.json({
        activeSessions: connectedCount,
        maxSessions: MAX_SESSIONS,
        available: connectedCount < MAX_SESSIONS
    });
});

app.post('/api/generate-pair', async (req, res) => {
    const secret = req.headers['x-worker-secret'];
    if (!secret || secret !== WORKER_SECRET) {
        return res.status(401).json({ success: false, error: 'unauthorized' });
    }

    const { numero } = req.body;
    if (!numero) return res.status(400).json({ success: false, error: 'numero_required' });

    try {
        const result = await createSession(numero, null);
        res.json(result || { success: false, error: 'unknown' });
    } catch (e) {
        res.status(500).json({ success: false, error: 'server_error' });
    }
});

app.post('/api/disconnect', async (req, res) => {
    let { numero } = req.body;
    if (!numero) return res.status(400).json({ error: 'Number required' });
    numero = numero.replace(/[^0-9]/g, '');

    const session = sessions.get(numero);
    if (session) {
        try { await session.sock?.logout?.(); } catch {}
        sessions.delete(numero);
        broadcastSessions();
    }
    try { fs.rmSync(getSessionDir(numero), { recursive: true, force: true }); } catch {}

    res.json({ ok: true, hadActiveSession: !!session });
});

app.get('/api/sessions', (req, res) => {
    const data = [];
    for (const [numero, s] of sessions.entries()) {
        data.push({ numero, status: s.status, connectedAt: s.connectedAt, name: s.name || null });
    }
    res.json(data);
});

app.get('/api/code/:numero', (req, res) => {
    const numero = req.params.numero.replace(/[^0-9]/g, '');
    const code = pendingCodes.get(numero);
    const session = sessions.get(numero);
    res.json({
        code: code || null,
        status: session?.status || 'unknown'
    });
});

io.on('connection', (socket) => {

    const data = [];
    for (const [numero, s] of sessions.entries()) {
        data.push({ numero, status: s.status, connectedAt: s.connectedAt, name: s.name });
    }
    socket.emit('sessions:update', data);

    socket.on('connect:numero', async ({ numero, rejoinOnly }) => {
        if (!numero) return;
        const clean = numero.replace(/[^0-9]/g, '');
        socket.join(`numero:${clean}`);
        if (rejoinOnly) return;

        await createSession(clean, socket.id);
    });

    socket.on('disconnect', () => {
    });
});

server.listen(PORT, async () => {
    console.log(chalk.hex('#6c5ce7').bold(`\n╔══════════════════════════════════════╗`));
    console.log(chalk.hex('#6c5ce7').bold(`║   Free Bug — Multi-Session     ║`));
    console.log(chalk.hex('#6c5ce7').bold(`║   http://localhost:${PORT}              ║`));
    console.log(chalk.hex('#6c5ce7').bold(`╚══════════════════════════════════════╝\n`));
    await loadExistingSessions();
});
