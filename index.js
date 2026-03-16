const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- DONNÉES EN MÉMOIRE ---
let utilisateurs = [
    { id: "admin_1", role: "ADMIN", nom: "Dr Arland", login: "admin", mdp: "Arland2026" },
    { id: "pharma_1", role: "PHARMA", nom: "Pharmacie Gombe", login: "pharma1", mdp: "123" }
];

// --- LOGIQUE SOCKET (MESSAGERIE & PAIEMENT) ---
io.on('connection', (socket) => {
    socket.on('join', (userId) => socket.join(userId));

    socket.on('message-privé', (data) => {
        io.to(data.to).emit('nouveau-msg', data);
        io.emit('surveillance-admin', data); // Vous voyez tout
    });

    socket.on('paiement-client', (pay) => {
        const commission = pay.montant * 0.10;
        const alerte = { ...pay, commission, heure: new Date().toLocaleTimeString() };
        io.emit('alerte-admin-commission', alerte);
        io.to(pay.pharmaId).emit('commande-pharma', alerte);
    });
});

// --- ROUTE UNIQUE D'INSCRIPTION ET CONNEXION ---
app.post('/auth', (req, res) => {
    const { login, mdp, action } = req.body;

    if (action === "inscription") {
        const nouveau = { id: "client_" + Date.now(), role: "CLIENT", nom: req.body.nom, login, mdp };
        utilisateurs.push(nouveau);
        return res.json(nouveau);
    } else {
        const user = utilisateurs.find(u => u.login === login && u.mdp === mdp);
        if (user) return res.json(user);
        res.status(401).json({ error: "Identifiants incorrects" });
    }
});

server.listen(port, () => console.log('Serveur PharmaDirect sur port ' + port));
