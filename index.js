const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;

// Configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Bases de données temporaires
let pharmacies = [];
let clients = [];
let commandes = [];

// --- LOGIQUE DES NOTIFICATIONS (SOCKET.IO) ---
io.on('connection', (socket) => {
    console.log('Connexion établie pour alertes');

    socket.on('join-pharma', (pharmaId) => {
        socket.join(`pharma-${pharmaId}`);
        console.log(`Pharmacie ${pharmaId} connectée`);
    });

    socket.on('nouvelle-commande', (data) => {
        io.to(`pharma-${data.pharmaId}`).emit('alerte-sonore', {
            message: "URGENT : Nouvelle ordonnance reçue !",
            client: data.clientNom
        });
    });
});

// --- ROUTES ---

// Inscription Pharmacie
app.post('/register-pharma', (req, res) => {
    const newPharma = { id: Date.now(), ...req.body, bloque: false };
    pharmacies.push(newPharma);
    res.redirect('/?reg=success');
});

// Inscription Client
app.post('/register-client', (req, res) => {
    const newClient = { id: Date.now(), ...req.body };
    clients.push(newClient);
    res.redirect('/client-home.html');
});

// Login universel
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'Arland2026') return res.redirect('/proprietaire-dashboard');
    
    const pharma = pharmacies.find(p => p.email === username && p.password === password);
    if (pharma) return res.redirect(`/pharma-dashboard.html?id=${pharma.id}`);

    const client = clients.find(c => c.email === username && c.password === password);
    if (client) return res.redirect('/client-home.html');

    res.send("Identifiants incorrects");
});

// Démarrage avec SERVER et non APP
server.listen(port, () => {
    console.log(`=========================================`);
    console.log(`PHARMADIRECT : http://localhost:${port}`);
    console.log(`=========================================`);
});
