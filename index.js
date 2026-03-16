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

// --- DATA ---
let pharmacies = [{ id: "pharma_1", nom: "Pharmacie de la Gombe", email: "pharma@test.com", password: "123", commune: "Gombe" }];
let transactions = [];

// --- LOGIQUE TEMPS RÉEL ---
io.on('connection', (socket) => {
    socket.on('join-room', (userId) => socket.join(userId));

    // Messagerie
    socket.on('send-message', (data) => {
        io.to(data.to).emit('receive-message', data);
        io.emit('admin-monitor-chat', { ...data, time: new Date().toLocaleTimeString() });
    });

    // Paiement & Commissions
    socket.on('valider-paiement', (cmd) => {
        const commission = cmd.montant * 0.10;
        const totalPharma = cmd.montant * 0.90;
        const dataFinal = { ...cmd, commission, totalPharma, id: Date.now() };
        
        transactions.push(dataFinal);
        io.emit('admin-new-transaction', dataFinal); // Alerte l'admin (Son $$$)
        io.to(cmd.pharmaId).emit('alerte-commande', dataFinal); // Alerte la pharma
    });
});

// LOGIN REDIRECTION
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'Arland2026') return res.redirect('/admin-control');
    const pharma = pharmacies.find(p => p.email === username);
    if (pharma) return res.redirect(`/pharma-dashboard.html?id=${pharma.id}`);
    res.redirect('/client-home.html');
});

// ÉCRAN ADMIN (VOTRE INTERFACE META-CONTROL)
app.get('/admin-control', (req, res) => {
    res.send(`
        <body style="font-family:sans-serif; background:#0f172a; color:white; padding:20px;">
            <h1 style="color:#2ecc71;">🛡️ PharmaDirect Global Monitor</h1>
            <div style="display:flex; gap:20px; margin-bottom:20px;">
                <div style="background:#1e293b; padding:20px; border-radius:15px; flex:1; border-bottom:5px solid #2ecc71;">
                    <h3>Mes Gains (10%)</h3>
                    <h2 id="solde" style="color:#2ecc71; font-size:40px;">0 FC</h2>
                </div>
                <div style="background:#1e293b; padding:20px; border-radius:15px; flex:1;">
                    <h3>Transactions Live</h3>
                    <div id="logs" style="height:100px; overflow-y:auto; font-size:12px;"></div>
                </div>
            </div>
            <div style="background:#1e293b; padding:20px; border-radius:15px; height:350px;">
                <h3>💬 Surveillance des Chats (Meta-Style)</h3>
                <div id="chat-monitor" style="height:280px; overflow-y:auto; background:#000; padding:10px; border-radius:10px; font-family:monospace; color:#0f0;"></div>
            </div>
            <audio id="cash-sound" src="https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3"></audio>
            <script src="/socket.io/socket.io.js"></script>
            <script>
                const socket = io();
                let total = 0;
                socket.on('admin-new-transaction', d => {
                    document.getElementById('cash-sound').play();
                    total += d.commission;
                    document.getElementById('solde').innerText = total.toLocaleString() + ' FC';
                    document.getElementById('logs').innerHTML += '<p>✅ Gain +' + d.commission + ' FC (' + d.pharmaNom + ')</p>';
                });
                socket.on('admin-monitor-chat', d => {
                    document.getElementById('chat-monitor').innerHTML += '<p>[' + d.time + '] <b>' + d.senderName + ':</b> ' + d.msg + '</p>';
                });
            </script>
        </body>
    `);
});

server.listen(port, () => console.log('🚀 PharmaDirect opérationnel sur le port 3000'));
