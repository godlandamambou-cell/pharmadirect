const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Configuration pour lire les données des formulaires
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- BASES DE DONNÉES TEMPORAIRES ---
let commandes = []; 
let pharmaciesPartenaires = [];

// 1. LOGIQUE DE CONNEXION (SÉPARÉE)
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Accès PROPRIÉTAIRE (Dr Arland)
    if (username === 'admin' && password === 'Arland2026') {
        return res.redirect('/proprietaire-dashboard');
    }

    // Accès PHARMACIE PARTENAIRE
    const pharmacie = pharmaciesPartenaires.find(p => p.email === username && p.password === password);
    if (pharmacie) {
        return res.redirect(`/pharmacie-dashboard?id=${pharmacie.id}`);
    }

    res.send('<h1>Identifiants incorrects</h1><a href="/">Réessayer</a>');
});

// 2. INSCRIPTION AUTOMATIQUE DES PHARMACIES (SÉCURISÉE)
app.post('/register-pharmacy', (req, res) => {
    const { nomPharmacie, cnop, email, password, nomPharmacien, adresse, telephone } = req.body;

    // Vérification si déjà inscrit
    const existeDeja = pharmaciesPartenaires.find(p => p.email === email || p.cnop === cnop);
    if (existeDeja) {
        return res.send('<h1>Erreur : Email ou CNOP déjà utilisé.</h1><a href="/inscription-pharmacie.html">Retour</a>');
    }

    const nouvellePharmacie = {
        id: Date.now(),
        nom: nomPharmacie,
        pharmacien: nomPharmacien,
        cnop: cnop,
        email: email,
        password: password,
        adresse: adresse,
        tel: telephone,
        dateInscription: new Date().toLocaleString('fr-FR')
    };

    pharmaciesPartenaires.push(nouvellePharmacie);
    res.send(`
        <div style="text-align:center; font-family:sans-serif; padding:50px;">
            <h1 style="color:#2ecc71;">✅ Inscription Validée !</h1>
            <p>Bienvenue Dr ${nomPharmacien}. Votre officine <b>${nomPharmacie}</b> est active.</p>
            <a href="/" style="display:inline-block; background:#2ecc71; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Se connecter</a>
        </div>
    `);
});

// 3. ENVOI DE COMMANDE (Côté Client)
app.post('/commander', (req, res) => {
    const nouvelleCommande = {
        id: Date.now(),
        client: req.body.client,
        statut: 'En attente',
        montant: 5000, // Montant fictif pour calcul
        date: new Date().toLocaleString('fr-FR'),
        timestamp: new Date()
    };
    commandes.push(nouvelleCommande);
    res.send('<h1>✅ Commande envoyée !</h1><a href="/commande-client.html">Retour</a>');
});

// 4. DASHBOARD PROPRIÉTAIRE (VOTRE CENTRE DE CONTRÔLE)
app.get('/proprietaire-dashboard', (req, res) => {
    // Calculs financiers
    const totalCommandes = commandes.length;
    const chiffreAffaire = totalCommandes * 5000;
    const mesGains = chiffreAffaire * 0.10;

    res.send(`
        <div style="font-family:sans-serif; padding:30px; background:#f4f7f6; min-height:100vh;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h1 style="color:#2c3e50;">📊 Global Control - Dr Arland</h1>
                <a href="/" style="color:red; text-decoration:none;">Déconnexion</a>
            </div>

            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:20px; margin:20px 0;">
                <div style="background:white; padding:20px; border-radius:10px; box-shadow:0 2px 5px rgba(0,0,0,0.1);">
                    <h3>📦 Total Commandes</h3>
                    <p style="font-size:24px; font-weight:bold; color:#2ecc71;">${totalCommandes}</p>
                </div>
                <div style="background:white; padding:20px; border-radius:10px; box-shadow:0 2px 5px rgba(0,0,0,0.1);">
                    <h3>💰 Mes Gains (10%)</h3>
                    <p style="font-size:24px; font-weight:bold; color:#e67e22;">${mesGains.toLocaleString()} FC</p>
                </div>
                <div style="background:white; padding:20px; border-radius:10px; box-shadow:0 2px 5px rgba(0,0,0,0.1);">
                    <h3>🏥 Pharmacies Actives</h3>
                    <p style="font-size:24px; font-weight:bold; color:#3498db;">${pharmaciesPartenaires.length}</p>
                </div>
            </div>

            <div style="background:white; padding:20px; border-radius:10px;">
                <h3>📜 Historique des Transactions</h3>
                <table border="1" style="width:100%; border-collapse:collapse; text-align:left;">
                    <tr style="background:#2ecc71; color:white;">
                        <th style="padding:10px;">Date</th><th>Client</th><th>Commission (10%)</th>
                    </tr>
                    ${commandes.map(c => `<tr><td style="padding:10px;">${c.date}</td><td style="padding:10px;">${c.client}</td><td style="padding:10px;">500 FC</td></tr>`).join('')}
                </table>
            </div>

            <div style="background:white; padding:20px; border-radius:10px; margin-top:20px;">
                <h3>🏥 Liste des Pharmacies Partenaires</h3>
                <table border="1" style="width:100%; border-collapse:collapse; text-align:left;">
                    <tr style="background:#3498db; color:white;">
                        <th style="padding:10px;">Pharmacie</th><th>Pharmacien</th><th>CNOP</th><th>Email</th>
                    </tr>
                    ${pharmaciesPartenaires.map(p => `<tr><td style="padding:10px;">${p.nom}</td><td style="padding:10px;">${p.pharmacien}</td><td style="padding:10px;">${p.cnop}</td><td style="padding:10px;">${p.email}</td></tr>`).join('')}
                </table>
            </div>
        </div>
    `);
});

// 5. DASHBOARD PHARMACIE (Espace Partenaire)
app.get('/pharmacie-dashboard', (req, res) => {
    res.send(`
        <div style="font-family:sans-serif; padding:30px;">
            <h1 style="color:#2ecc71;">🏥 Portail Officine Partenaire</h1>
            <h3>Commandes à traiter</h3>
            <ul>
                ${commandes.map(c => `<li>${c.client} (${c.date}) - <button>Prêt</button></li>`).join('')}
            </ul>
            <a href="/">Déconnexion</a>
        </div>
    `);
});

app.listen(port, () => {
    console.log(`Serveur PharmaDirect Global actif sur le port ${port}`);
});
