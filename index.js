const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Ma base de données temporaire
let commandes = [];
let messagesChat = [];

// --- LOGIQUE DE CONNEXION ---
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === 'admin' && password === 'Arland2026') {
        res.redirect('/admin-dashboard');
    } else if (username === 'pharmacie1' && password === 'p@ss123') {
        res.redirect('/pharmacie-dashboard');
    } else {
        res.redirect('/'); // Retour au formulaire client par défaut
    }
});

// --- INTERFACE ADMIN (Tout voir au même endroit) ---
app.get('/admin-dashboard', (req, res) => {
    let commission = commandes.length * 500; // Exemple : 500 FC par commande
    res.send(`
        <div style="font-family: sans-serif; padding: 20px;">
            <h1 style="color: #2ecc71;">Tableau de Bord Administrateur</h1>
            <div style="display: flex; gap: 20px;">
                <div style="border: 1px solid #ddd; padding: 15px; flex: 1;">
                    <h3>👥 Clients & Commandes</h3>
                    <p>Total : ${commandes.length} commandes en cours.</p>
                </div>
                <div style="border: 1px solid #ddd; padding: 15px; flex: 1;">
                    <h3>🏥 Pharmacies Partenaires</h3>
                    <p>1 active (Prince Pharma)</p>
                </div>
                <div style="border: 1px solid #ddd; padding: 15px; flex: 1; background: #e8f5e9;">
                    <h3>💰 Mes Gains (10%)</h3>
                    <p>Total à percevoir : <strong>${commission} FC</strong></p>
                </div>
            </div>
            <a href="/" style="display: block; margin-top: 20px;">Déconnexion</a>
        </div>
    `);
});

// --- INTERFACE PHARMACIE (Commandes + Chat) ---
app.get('/pharmacie-dashboard', (req, res) => {
    let listeCommandes = commandes.map(c => `<li>${c.client} - <button>Valider</button></li>`).join('');
    res.send(`
        <div style="font-family: sans-serif; padding: 20px;">
            <h1>Espace Pharmacie - Commandes</h1>
            <ul>${listeCommandes || "Aucune commande pour l'instant"}</ul>
            <hr>
            <h3>💬 Chat avec les clients</h3>
            <div style="height: 200px; border: 1px solid #ccc; overflow-y: scroll; padding: 10px;">
                ${messagesChat.map(m => `<p><b>${m.user}:</b> ${m.text}</p>`).join('')}
            </div>
            <input type="text" placeholder="Répondre au client..."> <button>Envoyer</button>
            <br><br><a href="/">Déconnexion</a>
        </div>
    `);
});

app.listen(port, () => {
    console.log(`PharmaDirect Pro lancé sur le port ${port}`);
});
