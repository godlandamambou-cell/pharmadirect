const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- BASE DE DONNÉES TEMPORAIRE ---
let pharmacies = [
    { id: "pharma_1", nom: "Pharmacie de la Gombe", email: "gombe@pharma.com", password: "123", commune: "Gombe" }
];
let clients = [];
let transactions = []; 

// --- LOGIQUE TEMPS RÉEL (STYLE META) ---
io.on('connection', (socket) => {
    console.log('⚡ Un utilisateur s\'est connecté');

    // Rejoindre une salle privée (soit son ID client, soit son ID pharma)
    socket.on('join-room', (userId) => {
        socket.join(userId);
        console.log(`Utilisateur ${userId} a rejoint sa salle privée`);
    });

    // --- SYSTÈME DE MESSAGERIE (CHAT) ---
    socket.on('send-message', (data) => {
        // data contient: { from, to, msg, senderName }
        
        // 1. Envoyer au destinataire
        io.to(data.to).emit('receive-message', data);
        
        // 2. SURVEILLANCE ADMIN (Votre écran Meta-Control)
        io.emit('admin-monitor-chat', {
            ...data,
            timestamp: new Date().toLocaleTimeString()
        });
    });

    // --- TRANSACTION ET COMMISSION ---
    socket.on('valider-paiement', (cmd) => {
        const commission = cmd.montant * 0.10;
        const netPharma = cmd.montant * 0.90;

        const detailCmd = {
            id: "CMD-" + Date.now(),
            ...cmd,
            commission,
            netPharma,
            date: new Date().toLocaleString()
        };

        transactions.push(detailCmd);
        
        // Notification à la pharmacie et à l'admin
        io.to(cmd.pharmaId).emit('alerte-sonore', detailCmd);
        io.emit('admin-new-transac', detailCmd);
    });
});

// --- ROUTES ---

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === 'admin' && password === 'Arland2026') {
        return res.redirect('/admin-control');
    }

    const pharma = pharmacies.find(p => p.email === username && p.password === password);
    if (pharma) return res.redirect(`/pharma-dashboard.html?id=${pharma.id}`);

    res.redirect('/client-home.html');
});

// VOTRE ÉCRAN DE CONTRÔLE TOTAL
app.get('/admin-control', (req, res) => {
    res.send(`
        <body style="font-family:sans-serif; background:#121212; color:white; padding:20px;">
            <h1 style="color:#2ecc71;">🛡️ PharmaDirect Global Monitor</h1>
            
            <div style="display:flex; gap:20px; margin-bottom:20px;">
                <div style="background:#1e1e1e; padding:20px; border-radius:15px; flex:1; border-bottom:4px solid #e67e22;">
                    <h3>Mes Gains (10%)</h3>
                    <h2 id="gain-total" style="color:#e67e22;">0 FC</h2>
                </div>
                <div style="background:#1e1e1e; padding:20px; border-radius:15px; flex:1; border-bottom:4px solid #3498db;">
                    <h3>Alertes Live</h3>
                    <div id="status">Système Opérationnel ✅</div>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                <div style="background:#1e1e1e; padding:20px; border-radius:15px; height:450px;">
                    <h3>💬 Espionnage des Conversations (Meta-Style)</h3>
                    <div id="chat-monitor" style="height:350px; overflow-y:auto; background:#000; padding:10px; border-radius:10px; font-family:monospace;"></div>
                </div>
                <div style="background:#1e1e1e; padding:20px; border-radius:15px; height:450px;">
                    <h3>💰 Transactions & Commissions</h3>
                    <div id="transac-monitor" style="height:350px; overflow-y:auto;"></div>
                </div>
            </div>

            <script src="/socket.io/socket.io.js"></script>
            <script>
                const socket = io();
                let totalGagne = 0;

                // Surveiller les messages en direct
                socket.on('admin-monitor-chat', (data) => {
                    const el = document.getElementById('chat-monitor');
                    const msgDiv = document.createElement('div');
                    msgDiv.innerHTML = '<span style="color:#888">['+data.timestamp+']</span> <b style="color:#2ecc71">'+data.senderName+'</b> -> '+data.msg;
                    msgDiv.style.borderBottom = "1px solid #222";
                    msgDiv.style.padding = "5px";
                    el.prepend(msgDiv);
                });

                // Surveiller les paiements
                socket.on('admin-new-transac', (data) => {
                    const el = document.getElementById('transac-monitor');
                    totalGagne += data.commission;
                    document.getElementById('gain-total').innerText = totalGagne + ' FC';
                    el.innerHTML += '<div style="background:#2ecc7122; padding:10px; margin-bottom:5px; border-radius:5px;">✅ +'+data.commission+' FC (10% de '+data.montant+' FC)</div>';
                });
            </script>
        </body>
    `);
});

server.listen(port, () => {
    console.log('🚀 Serveur PharmaDirect prêt sur http://localhost:' + port);
});
