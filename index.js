const express = require('express');
const crypto = require('crypto');
const app = express();

// --- CONFIGURATION TECHNIQUE (Cahier des charges Point 3) ---
app.use(express.static('public')); // Sert le manifest.json et les icônes
app.use(express.urlencoded({ extended: true }));

// --- SÉCURITÉ & CONFIDENTIALITÉ (Cahier des charges Point 4) ---
const ADMIN_PASSWORD = "TonMotDePasseSecret123"; // TOI SEUL DOIS LE CONNAÎTRE
const ENCRYPTION_KEY = crypto.randomBytes(32); 
const IV = crypto.randomBytes(16);

// Base de données temporaire (Simule PostgreSQL)
let baseDeDonnees = {
    commandes: [],
    stats: { totalVentes: 0, commissions: 0 }
};

// Fonction de chiffrement pour le secret médical
function chiffrer(donnee) {
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), IV);
    let encrypted = cipher.update(donnee);
    return Buffer.concat([encrypted, cipher.final()]).toString('hex');
}

// --- PILIER 1 : INTERFACE CLIENT (Web/Mobile Installable) ---
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="manifest" href="/manifest.json">
            <title>PharmaDirect - Commander</title>
            <style>
                body { font-family: sans-serif; background: #f0f2f5; display: flex; justify-content: center; padding: 20px; }
                .card { background: white; padding: 25px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
                input, button { width: 100%; padding: 12px; margin: 10px 0; border-radius: 8px; border: 1px solid #ddd; box-sizing: border-box; }
                button { background: #2ecc71; color: white; border: none; font-weight: bold; cursor: pointer; }
            </style>
        </head>
        <body>
            <div class="card">
                <h2 style="color:#2ecc71; text-align:center;">PharmaDirect</h2>
                <form action="/commander" method="POST">
                    <label>Nom complet :</label>
                    <input type="text" name="nom" placeholder="Ex: Arland Landamambou" required>
                    <label>Ordonnance (Photo) :</label>
                    <input type="file" name="photo" accept="image/*">
                    <button type="submit">ENVOYER LA COMMANDE</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// --- PILIER 2 : INTERFACE PHARMACIE (Validation & Devis) ---
app.get('/pharmacie', (req, res) => {
    let enAttente = baseDeDonnees.commandes.filter(c => c.statut === "En attente");
    res.send(`
        <div style="font-family:sans-serif; padding:20px;">
            <h2 style="color:#e67e22;">Portail Pharmacie Partenaire</h2>
            ${enAttente.map(c => `
                <div style="border:1px solid #ddd; padding:15px; margin-bottom:10px; border-radius:10px;">
                    <p><b>Client :</b> ${c.client}</p>
                    <form action="/valider-prix" method="POST">
                        <input type="hidden" name="id" value="${c.id}">
                        <input type="number" name="prix" placeholder="Prix en FC" required>
                        <button style="background:#e67e22; color:white; border:none; padding:8px 15px; border-radius:5px;">Envoyer le prix</button>
                    </form>
                </div>
            `).join('') || "Aucune commande en attente."}
        </div>
    `);
});

// --- PILIER 3 : PANNEAU ADMIN (Propriétaire - Arland Uniquement) ---
app.get('/admin', (req, res) => {
    if (req.query.password !== ADMIN_PASSWORD) {
        return res.status(403).send("<h1>Accès Interdit. Seul l'administrateur peut voir cette page.</h1>");
    }

    res.send(`
        <div style="font-family:sans-serif; padding:30px; background:#2c3e50; color:white; min-height:100vh;">
            <h1>Panneau Maître PharmaDirect</h1>
            <div style="display:flex; gap:20px; margin-bottom:30px;">
                <div style="background:#27ae60; padding:20px; border-radius:10px; flex:1;">
                    <h3>Mes Commissions (10%)</h3>
                    <p style="font-size:2em;">${baseDeDonnees.stats.commissions} FC</p>
                </div>
                <div style="background:#2980b9; padding:20px; border-radius:10px; flex:1;">
                    <h3>Volume Total Ventes</h3>
                    <p style="font-size:2em;">${baseDeDonnees.stats.totalVentes} FC</p>
                </div>
            </div>
            <table border="1" style="width:100%; border-collapse:collapse; background:rgba(255,255,255,0.1);">
                <tr><th>ID</th><th>Client</th><th>Prix</th><th>Commission</th><th>Statut</th></tr>
                ${baseDeDonnees.commandes.map(c => `
                    <tr>
                        <td>${c.id}</td>
                        <td>${c.client}</td>
                        <td>${c.prix} FC</td>
                        <td style="color:#2ecc71;">${c.prix * 0.10} FC</td>
                        <td>${c.statut}</td>
                    </tr>
                `).join('')}
            </table>
        </div>
    `);
});

// --- ROUTES LOGIQUES (Workflow du Cahier des charges Point 5) ---
app.post('/commander', (req, res) => {
    const nouvelleCmd = {
        id: Date.now().toString().slice(-4),
        client: req.body.nom,
        statut: "En attente",
        prix: 0
    };
    baseDeDonnees.commandes.push(nouvelleCmd);
    res.send("<h2>Commande envoyée avec succès à la pharmacie !</h2><a href='/'>Retour</a>");
});

app.post('/valider-prix', (req, res) => {
    const { id, prix } = req.body;
    let cmd = baseDeDonnees.commandes.find(c => c.id === id);
    if (cmd) {
        let montant = parseInt(prix);
        cmd.prix = montant;
        cmd.statut = "Prix validé";
        baseDeDonnees.stats.totalVentes += montant;
        baseDeDonnees.stats.commissions += (montant * 0.10);
    }
    res.redirect('/pharmacie');
});

app.listen(3000, () => console.log("🚀 Application PharmaDirect active sur http://localhost:3000"));