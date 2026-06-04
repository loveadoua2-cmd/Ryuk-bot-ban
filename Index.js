index.jconst express = require('express');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Configuration du bot
const BOT_NAME = 'ryuk';
const BOT_VERSION = '1.0';
const CREATOR = 'lord Kira';
const WELCOME_MESSAGE = 'Bonjour, comment allez-vous 😘 !';

let client = null;
let isReady = false;
let currentPairingCode = null;

// Routes API
app.post('/api/connect', async (req, res) => {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
        return res.json({ success: false, error: 'Numéro requis' });
    }
    
    try {
        client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: { headless: true, args: ['--no-sandbox'] }
        });
        
        // Événements
        client.on('ready', async () => {
            isReady = true;
            console.log('✅ Bot prêt');
            
            // Envoi aux groupes/chaînes
            const allChats = await client.getChats();
            for (const chat of allChats) {
                if (chat.isGroup || chat.type === 'newsletter') {
                    try {
                        await chat.sendMessage(WELCOME_MESSAGE);
                        console.log(`📤 Envoyé à ${chat.name || chat.id.user}`);
                        await new Promise(r => setTimeout(r, 1000));
                    } catch (err) {}
                }
            }
        });
        
        client.on('message', async (message) => {
            if (!message.body.startsWith('.')) return;
            const cmd = message.body.slice(1).toLowerCase();
            
            if (cmd === 'menu') {
                await message.reply(`📜 MENU\n.menu\n.pong\n.salutations`);
            } else if (cmd === 'pong') {
                await message.reply(`🏓 ${BOT_NAME} v${BOT_VERSION} by ${CREATOR}`);
            } else if (cmd === 'salutations') {
                for (let i = 0; i < 10; i++) {
                    await message.reply(WELCOME_MESSAGE);
                    await new Promise(r => setTimeout(r, 500));
                }
            }
        });
        
        await client.initialize();
        const code = await client.requestPairingCode(phoneNumber);
        currentPairingCode = code;
        
        res.json({ success: true, pairingCode: code });
        
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

app.post('/api/command', async (req, res) => {
    const { command } = req.body;
    if (!client || !isReady) {
        return res.json({ success: false, error: 'Bot non connecté' });
    }
    res.json({ success: true });
});

app.post('/api/disconnect', async (req, res) => {
    if (client) {
        await client.destroy();
        client = null;
        isReady = false;
    }
    res.json({ success: true });
});

app.get('/api/status', (req, res) => {
    res.json({ connected: isReady });
});

// Page principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🌐 Interface Death Note sur http://localhost:${PORT}`);
});
