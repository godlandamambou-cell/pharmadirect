const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Configuration pour lire les données des formulaires
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Base de données temporaire (mémoire vive)
let commandes = [];

// 1. LOGIQUE DE CONNEXION (LOGIN)
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === 'admin' && password === 'Arland2026') {
        res.redirect('/admin-dashboard');
    } else if (username === 'pharmacie1' && password === 'p@ss123') {
        res.redirect('/pharmacie-dashboard');
    } else {
        // Si erreur, on renvoie à la page de login avec un petit message
        res.send('<h1>Identifiants incorrects</h1><a href="/">Réessayer</a>');
    }
});

// 2. ENREGISTREMENT D'UNE COMMANDE (Côté Client)
app.post('/commander', (req, res) => {
    const nouvelleCommande = {
        id: Date.now(),
        client: req.body.client,
        statut: 'En attente',
        date: new Date().toLocaleString('fr-FR')
    };
    commandes.push(nouvelleCommande);
    res.send(`
        <div style="text-align:center; font-family:sans-serif; margin-top:50px;">
            <h1 style="color:#2ecc71;">✅ Commande envoyée !</h1>
            <p>Le Dr Arland et la pharmacie traitent votre demande.</p>
            <a href="/commande-client.html" style="color:#2ecc71;">Envoyer une autre ordonnance</a>
        </div>
    `);
});

// 3. TABLEAU DE BORD ADMIN (Ton espace à toi)
app.get('/admin-dashboard', (req, res) => {
    let totalCommandes = commandes.length;
    let commissionTotale = totalCommandes * 1000; // Exemple: 1000 FC par commande
    let tonGain = commissionTotale * 0.10; // Tes 10%

    res.send(`
        <div style="font-family:sans-serif; padding:30px; background:#f4f7f6; min-height:100vh;">
            <h1 style="color:#2c3e50;">👨‍⚕️ Espace Administrateur (Dr Arland)</h1>
            <div style="display:flex; gap:20px; margin-bottom:30px;">
                <div style="background:white; padding:20px; border-radius:10px; flex:1; box-shadow:0 2px 5px rgba(0,0,0,0.1);">
                    <h3>📦 Commandes totales</h3>
                    <p style="font-size:24px; font-weight:bold; color:#2ecc71;">${totalCommandes}</p>
                </div>
                <div style="background:white; padding:20px; border-radius:10px; flex:1; box-shadow:0 2px 5px rgba(0,0,0,0.1);">
                    <h3>💰 Mes Gains (10%)</h3>
                    <p style="font-size:24px; font-weight:bold; color:#e67e22;">${tonGain} FC</p>
                </div>
            </div>
            <h3>Liste des Clients récents</h3>
            <table border="1" style="width:100%; background:white; border-collapse:collapse;">
                <tr style="background:#2ecc71; color:white;">
                    <th style="padding:10px;">Date</th><th style="padding:10px;">Nom du Client</th><th style="padding:10px;">Statut</th>
                </tr>
                ${commandes.map(c => `<tr><td style="padding:10px;">${c.date}</td><td style="padding:10px;">${c.client}</td><td style="padding:10px;">${c.statut}</td></tr>`).join('')}
            </table>
            <br><a href="/" style="color:#7f8c8d;">Déconnexion</a>
        </div>
    `);
});

// 4. TABLEAU DE BORD PHARMACIE (Espace Partenaire)
app.get('/pharmacie-dashboard', (req, res) => {
    res.send(`
        <div style="font-family:sans-serif; padding:30px;">
            <h1 style="color:#2ecc71;">🏥 Espace Pharmacie Partenaire</h1>
            <p>Voici les ordonnances à traiter :</p>
            <ul style="list-style:none; padding:0;">
                ${commandes.length > 0 ? commandes.map(c => `
                    <li style="background:#eee; margin-bottom:10px; padding:15px; border-radius:5px; display:flex; justify-content:space-between;">
                        <span><b>${c.client}</b> (Reçu le ${c.date})</span>
                        <button style="background:#2ecc71; color:white; border:none; padding:5px 10px; border-radius:3px;">Prêt pour livraison</button>
                    </li>
                `).join('') : "<li>Aucune commande pour le moment.</li>"}
            </ul>
            <hr>
            <h3>💬 Chat direct (Bientôt disponible)</h3>
            <a href="/" style="color:#7f8c8d;">Déconnexion</a>
        </div>
    `);
});

app.listen(port, () => {
    console.log(`Serveur PharmaDirect actif sur le port ${port}`);
});
