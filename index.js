const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// BASE DE DONNÉES DES TRANSACTIONS
let commandes = []; 
// BASE DES PHARMACIES PARTENAIRES
let pharmacies = [];

// --- LOGIQUE DE CONNEXION SÉCURISÉE ---
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // VOTRE ACCÈS PROPRIÉTAIRE (Modifiez l'identifiant ici si vous voulez)
    if (username === 'admin' && password === 'Arland2026') {
        res.redirect('/proprietaire-dashboard');
    } else {
        res.send('<h1>Identifiant incorrect</h1><a href="/">Retour</a>');
    }
});

// --- TABLEAU DE BORD DU PROPRIÉTAIRE (VOTRE ESPACE) ---
app.get('/proprietaire-dashboard', (req, res) => {
    // Calculs financiers
    const totalCommandes = commandes.length;
    const CA_Total = totalCommandes * 5000; // Exemple : Panier moyen 5000 FC
    const mesGains = CA_Total * 0.10; // Vos 10%

    res.send(`
        <div style="font-family: 'Segoe UI', sans-serif; padding: 30px; background: #f0f2f5; min-height: 100vh;">
            <header style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h1 style="color: #2ecc71; margin: 0;">PharmaDirect Global Control</h1>
                <span style="font-weight: bold;">Propriétaire : Dr Arland</span>
            </header>

            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 30px;">
                <div style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
                    <h3>📦 Commandes</h3>
                    <p style="font-size: 24px; font-weight: bold;">${totalCommandes}</p>
                </div>
                <div style="background: #2ecc71; color: white; padding: 20px; border-radius: 10px; text-align: center;">
                    <h3>💰 Mes Gains (10%)</h3>
                    <p style="font-size: 24px; font-weight: bold;">${mesGains.toLocaleString()} FC</p>
                </div>
                <div style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
                    <h3>🏥 Pharmacies</h3>
                    <p style="font-size: 24px; font-weight: bold;">${pharmacies.length}</p>
                </div>
                <div style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
                    <h3>📈 Croissance</h3>
                    <p style="font-size: 24px; font-weight: bold; color: #2ecc71;">+100%</p>
                </div>
            </div>

            <div style="margin-top: 30px; background: white; padding: 20px; border-radius: 10px;">
                <h3>📜 Historique des Transactions (Ordonné)</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid #eee; text-align: left;">
                            <th>Date & Heure</th>
                            <th>Client</th>
                            <th>Pharmacie</th>
                            <th>Montant</th>
                            <th>Ma Commission</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${commandes.map(c => `
                            <tr style="border-bottom: 1px solid #eee;">
                                <td>${c.date}</td>
                                <td>${c.client}</td>
                                <td>Prince Pharma</td>
                                <td>5000 FC</td>
                                <td style="color: green; font-weight: bold;">500 FC</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `);
});

app.listen(port, () => {
    console.log("Plateforme PharmaDirect en ligne");
});
