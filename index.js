const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } // Important pour le déploiement en ligne
});

// Render utilise un port dynamique, on doit donc utiliser process.env.PORT
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- DONNÉES ---
let pharmacies = [{ id: "pharma_1", nom: "Pharmacie de la Gombe", email: "pharma@test.com", password: "123", commune: "Gombe" }];
let transactions = [];

// --- LOGIQUE SOCKET.IO ---
io.on('connection', (socket) => {
    socket.on('join-room', (userId) => socket.join(userId));

    socket.on('send-message', (data) => {
        io.to(data.to).emit('receive-message', data);
        io.emit('admin-monitor-chat', { ...data, time: new Date().toLocaleTimeString() });
    });

    socket.on('valider-paiement', (cmd) => {
        const commission = cmd.montant * 0.10;
        const totalPharma = cmd.montant * 0.90;
        const dataFinal = { ...cmd, commission, totalPharma, id: Date.now() };
        transactions.push(dataFinal);
        io.emit('admin-new-transaction', dataFinal); 
    });
});

// --- ROUTES ---

// Accueil
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'client-home.html'));
});

// Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'Arland2026') return res.redirect('/admin-control');
    const pharma = pharmacies.find(p => p.email === username);
    if (pharma) return res.redirect(`/pharma-dashboard.html?id=${pharma.id}`);
    res.redirect('/client-home.html');
});

// ADMIN CONTROL (Vérifiez bien cette route)
app.get('/admin-control', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Admin - PharmaDirect</title>
            <style>
                body { font-family:sans-serif; background:#0f172a; color:white; padding:20px; }
                .grid { display:flex; gap:20px; margin-bottom:20px; }
                .card { background:#1e293b; padding:20px; border-radius:15px; flex:1; border-bottom:5px solid #2ecc71; }
                #chat-monitor { height:250px; overflow-y:auto; background:#000; padding:10px; border-radius:10px; font-family:monospace; color:#0f0; }
            </style>
        </head>
        <body>
            <h1>🛡️ Admin PharmaDirect</h1>
            <div class="grid">
                <div class="card">
                    <h3>Mes Gains (10%)</h3>
                    <h2 id="solde" style="color:#2ecc71; font-size:40px;">0 FC</h2>
                </div>
            </div>
            <div class="card">
                <h3>💬 Chat en direct</h3>
                <div id="chat-monitor"></div>
            </div>
            <audio id="cash-sound" src="https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3"></audio>
            <script src="/socket.io/socket.io.js"></script>
            <script>
                const socket = io();
                let total = 0;
                socket.on('admin-new-transaction', d => {
                    document.getElementById('cash-sound').play().catch(() => {});
                    total += d.commission;
                    document.getElementById('solde').innerText = total.toLocaleString() + ' FC';
                });
                socket.on('admin-monitor-chat', d => {
                    document.getElementById('chat-monitor').innerHTML += '<p>[' + d.time + '] ' + d.senderName + ': ' + d.msg + '</p>';
                });
            </script>
        </body>
        </html>
    `);
});

server.listen(port, () => {
    console.log('Serveur lancé sur le port ' + port);
});
