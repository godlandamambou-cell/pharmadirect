const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- DONNÉES ---
let pharmacies = [];
let clients = [];
const catalogueProduits = {
    medicaments: [
        { id: 1, nom: "Paracétamol 500mg", prix: 2500, image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200", desc: "Douleurs et fièvre" },
        { id: 2, nom: "Ibuprofène 400mg", prix: 4500, image: "https://images.unsplash.com/photo-1550572017-ed20015dd085?w=200", desc: "Anti-inflammatoire" }
    ],
    beaute: {
        visage: [{ id: 10, nom: "Crème Hydratante Bio", prix: 15000, image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200", desc: "Peaux sensibles" }],
        cheveux: [{ id: 20, nom: "Shampoing Fortifiant", prix: 8500, image: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=200", desc: "Anti-chute" }],
        corps: [{ id: 30, nom: "Lait Corporel Karité", prix: 12000, image: "https://images.unsplash.com/photo-1552046122-03184de85e08?w=200", desc: "Nutrition intense" }]
    }
};

// --- LOGIQUE TEMPS RÉEL ---
io.on('connection', (socket) => {
    socket.on('join-pharma', (id) => socket.join(`pharma-${id}`));
    socket.on('nouvelle-commande', (data) => {
        io.to(`pharma-${data.pharmaId}`).emit('alerte-sonore', data);
    });
});

// --- ROUTES ---
app.get('/api/produits', (req, res) => res.json(catalogueProduits));

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'Arland2026') return res.redirect('/proprietaire-dashboard');
    const pharma = pharmacies.find(p => p.email === username);
    if (pharma) return res.redirect(`/pharma-dashboard.html?id=${pharma.id}`);
    res.redirect('/client-home.html');
});

server.listen(port, () => {
    console.log(`🚀 Application PharmaDirect active sur http://localhost:${port}`);
});
