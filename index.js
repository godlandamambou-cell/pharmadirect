const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Configuration des Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- BASES DE DONNÉES TEMPORAIRES (À remplacer par MongoDB plus tard) ---
let pharmacies = [];
let clients = [];
let commandes = [];
let messagesChat = [];

// Liste des communes de Kinshasa pour la sélection
const communesKinshasa = [
    "Gombe", "Ngaliema", "Limete", "Kasa-Vubu", "Lingwala", 
    "Bandalungwa", "Barumbu", "Kintambo", "Masina", "Ndjili"
];

// --- LOGIQUE DE SÉCURITÉ & ABONNEMENT ---
function estAbonnementValide(pharma) {
    const deuxMoisEnMs = 60 * 24 * 60 * 60 * 1000;
    const finEssai = new Date(pharma.dateInscBrute).getTime() + deuxMoisEnMs;
    return Date.now() < finEssai || pharma.abonnementPaye === true;
}

// --- 1. AUTHENTIFICATION MULTI-COMPTES ---
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // A. PROPRIÉTAIRE (Admin)
    if (username === 'admin' && password === 'Arland2026') {
        return res.redirect('/proprietaire-dashboard');
    }

    // B. PHARMACIE PARTENAIRE
    const pharma = pharmacies.find(p => p.email === username && p.password === password);
    if (pharma) {
        if (pharma.bloque) return res.send("Compte bloqué. Contactez le Dr Arland.");
        if (!estAbonnementValide(pharma)) return res.redirect('/paiement-abonnement.html');
        return res.redirect(`/pharma-dashboard?id=${pharma.id}`);
    }

    // C. CLIENT
    const client = clients.find(c => c.email === username && c.password === password);
    if (client) return res.redirect(`/client-home?id=${client.id}`);

    res.status(401).send("Identifiants incorrects.");
});

// --- 2. INSCRIPTION PHARMACIE (Validation Automatique) ---
app.post('/register-pharma', (req, res) => {
    const newPharma = {
        id: Date.now(),
        ...req.body, // nomPharmacie, cnop, email, password, commune, etc.
        dateInscBrute: new Date(),
        bloque: false,
        abonnementPaye: false
    };
    pharmacies.push(newPharma);
    res.redirect('/?reg=success');
});

// --- 3. INSCRIPTION CLIENT ---
app.post('/register-client', (req, res) => {
    const newClient = {
        id: Date.now(),
        ...req.body, // nom, email, telephone, commune
        dateInsc: new Date().toLocaleDateString()
    };
    clients.push(newClient);
    res.redirect('/?reg=success');
});

// --- 4. GESTION DES COMMANDES & ORDINANCES ---
app.post('/api/commander-ordonnance', (req, res) => {
    const { clientId, pharmaId, imageOrdonnance, commune } = req.body;
    
    const nouvelleCommande = {
        id: "CMD-" + Date.now(),
        clientId,
        pharmaId,
        image: imageOrdonnance,
        statut: "En attente d'analyse",
        date: new Date().toLocaleString(),
        montant: 0, // Sera fixé par le pharmacien après analyse
        commissionPayee: false
    };
    
    commandes.push(nouvelleCommande);
    // Ici, on pourrait déclencher une notification sonore côté pharmacie via WebSockets
    res.json({ success: true, message: "Ordonnance envoyée à la pharmacie sélectionnée." });
});

// --- 5. SYSTÈME DE CHAT ---
app.post('/api/chat/envoyer', (req, res) => {
    const msg = { ...req.body, time: new Date().toLocaleTimeString() };
    messagesChat.push(msg);
    res.json({ success: true });
});

app.get('/api/chat/historique/:commandeId', (req, res) => {
    const flux = messagesChat.filter(m => m.commandeId == req.params.commandeId);
    res.json(flux);
});

// --- 6. DASHBOARD PROPRIÉTAIRE (DR ARLAND) ---
app.get('/proprietaire-dashboard', (req, res) => {
    const gainsAdmin = commandes.reduce((sum, c) => sum + (c.montant * 0.10), 0);
    
    res.send(`
        <div style="font-family:sans-serif; padding:40px; background:#f4f7f6;">
            <h1 style="color:#2ecc71;">🛡️ PharmaDirect Global Control</h1>
            <div style="display:flex; gap:20px;">
                <div style="background:white; padding:20px; border-radius:15px; flex:1; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
                    <h3>Portefeuille Commission (10%)</h3>
                    <p style="font-size:24px; color:#e67e22; font-weight:bold;">${gainsAdmin.toLocaleString()} FC</p>
                </div>
                <div style="background:white; padding:20px; border-radius:15px; flex:1;">
                    <h3>Pharmacies Partenaires</h3>
                    <p style="font-size:24px; color:#3498db; font-weight:bold;">${pharmacies.length}</p>
                </div>
            </div>
            <br>
            <h3>Pharmacies à Kinshasa</h3>
            <table border="0" style="width:100%; background:white; border-radius:10px; overflow:hidden;">
                <tr style="background:#eee; text-align:left;">
                    <th style="padding:15px;">Pharmacie</th><th>Commune</th><th>Action</th>
                </tr>
                ${pharmacies.map(p => `
                    <tr>
                        <td style="padding:15px;">${p.nomPharmacie}</td>
                        <td>${p.commune}</td>
                        <td><button style="background:red; color:white; border:none; padding:5px 10px; border-radius:5px;">Bloquer</button></td>
                    </tr>
                `).join('')}
            </table>
        </div>
    `);
});

// --- 7. API POUR RÉCUPÉRER LES PHARMACIES PAR COMMUNE ---
app.get('/api/pharmacies-par-commune/:commune', (req, res) => {
    const result = pharmacies.filter(p => p.commune === req.params.commune && !p.bloque);
    res.json(result);
});

// Lancement du serveur
app.listen(port, () => {
    console.log(`===========================================`);
    console.log(`   PHARMADIRECT ACTIF SUR LE PORT ${port}   `);
    console.log(`   Propriétaire : Dr Arland Landamambou   `);
    console.log(`===========================================`);
});
