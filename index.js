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
let messagesChat = []; 

// --- FONCTION DE CALCUL D'ABONNEMENT (60 JOURS / 2 MOIS) ---
function estPeriodeEssaiFinie(dateInsc) {
    const deuxMoisEnMs = 60 * 24 * 60 * 60 * 1000;
    return (new Date() - new Date(dateInsc)) > deuxMoisEnMs;
}

// --- 1. CONNEXION SÉCURISÉE (ADMIN & PHARMACIES) ---
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Accès PROPRIÉTAIRE (Admin)
    if (username === 'admin' && password === 'Arland2026') {
        return res.redirect('/proprietaire-dashboard');
    }

    // Accès PHARMACIE PARTENAIRE
    const pharma = pharmaciesPartenaires.find(p => p.email === username && p.password === password);
    if (pharma) {
        if (pharma.bloque) return res.send('<h1>Compte bloqué. Contactez l\'administrateur PharmaDirect.</h1>');
        
        // Vérification automatique de l'abonnement
        if (estPeriodeEssaiFinie(pharma.dateBrute) && !pharma.abonnementPaye) {
            return res.redirect('/paiement-abonnement.html');
        }
        return res.redirect(`/pharmacie-dashboard?id=${pharma.id}`);
    }
    res.send('<h1>Identifiants incorrects</h1><a href="/">Réessayer</a>');
});

// --- 2. INSCRIPTION DES PHARMACIES (VALIDATION AUTO) ---
app.post('/register-pharmacy', (req, res) => {
    const { nomPharmacie, cnop, email, password, nomPharmacien, adresse, telephone } = req.body;

    if (pharmaciesPartenaires.find(p => p.email === email || p.cnop === cnop)) {
        return res.send('<h1>Erreur : Email ou CNOP déjà utilisé.</h1><a href="/inscription-pharmacie.html">Retour</a>');
    }

    const nouvellePharma = {
        id: Date.now(),
        nom: nomPharmacie,
        pharmacien: nomPharmacien,
        cnop: cnop,
        email: email,
        password: password,
        adresse: adresse,
        tel: telephone,
        dateInscription: new Date().toLocaleDateString('fr-FR'),
        dateBrute: new Date(), // Date réelle pour calcul des 2 mois
        bloque: false,
        abonnementPaye: false
    };

    pharmaciesPartenaires.push(nouvellePharma);
    res.redirect('/?success=registered');
});

// --- 3. PAIEMENT CLIENT AVEC DISTRIBUTION AUTO (10% AR LAND) ---
app.post('/api/paiement-client', (req, res) => {
    const { montant, clientName, pharmaId } = req.body;
    
    const partArland = montant * 0.10;
    const partPharma = montant * 0.90;

    const transaction = {
        id: Date.now(),
        client: clientName,
        montantTotal: montant,
        gainArland: partArland,
        gainPharma: partPharma,
        date: new Date().toLocaleString('fr-FR'),
        pharmaId: pharmaId,
        statut: 'Payé'
    };

    commandes.push(transaction);
    res.json({ success: true, distribution: { admin: partArland, pharmacie: partPharma } });
});

// --- 4. ROUTES DU CHAT (ORDRE & SÉCURITÉ) ---
app.post('/api/chat/envoyer', (req, res) => {
    const { commandeId, expediteur, texte } = req.body;
    const nouveauMsg = {
        commandeId,
        expediteur, // "Pharmacie" ou "Client"
        texte,
        date: new Date().toLocaleTimeString('fr-FR')
    };
    messagesChat.push(nouveauMsg);
    res.json({ success: true, message: nouveauMsg });
});

app.get('/api/chat/historique/:commandeId', (req, res) => {
    const historique = messagesChat.filter(m => m.commandeId == req.params.commandeId);
    res.json(historique);
});

// --- 5. DASHBOARD PROPRIÉTAIRE (DR ARLAND) ---
app.get('/proprietaire-dashboard', (req, res) => {
    const totalGainsArland = commandes.reduce((sum, c) => sum + c.gainArland, 0);

    res.send(`
        <div style="font-family:sans-serif; padding:30px; background:#f4f7f6; min-height:100vh;">
            <div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:20px; border-radius:10px; box-shadow:0 2px 5px rgba(0,0,0,0.1);">
                <h1 style="color:#2ecc71; margin:0;">🛡️ PharmaDirect Global Control</h1>
                <span style="font-weight:bold;">Dr Arland Landamambou</span>
            </div>

            <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin:25px 0;">
                <div style="background:white; padding:20px; border-radius:10px; text-align:center; border-bottom:4px solid #e67e22;">
                    <h3>💰 Mon Portefeuille (10%)</h3>
                    <p style="font-size:24px; font-weight:bold; color:#e67e22;">${totalGainsArland.toLocaleString()} FC</p>
                </div>
                <div style="background:white; padding:20px; border-radius:10px; text-align:center; border-bottom:4px solid #3498db;">
                    <h3>🏥 Pharmacies Actives</h3>
                    <p style="font-size:24px; font-weight:bold; color:#3498db;">${pharmaciesPartenaires.length}</p>
                </div>
                <div style="background:white; padding:20px; border-radius:10px; text-align:center; border-bottom:4px solid #2ecc71;">
                    <h3>📦 Commandes Globales</h3>
                    <p style="font-size:24px; font-weight:bold; color:#2ecc71;">${commandes.length}</p>
                </div>
            </div>

            <div style="background:white; padding:25px; border-radius:10px; box-shadow:0 2px 5px rgba(0,0,0,0.05);">
                <h3>Gestion des Pharmacies Partenaires</h3>
                <table border="0" style="width:100%; border-collapse:collapse; text-align:left;">
                    <tr style="background:#f8f9fa; border-bottom:2px solid #eee;">
                        <th style="padding:15px;">Pharmacie</th>
                        <th>CNOP</th>
                        <th>Statut</th>
                        <th>Action</th>
                    </tr>
                    ${pharmaciesPartenaires.map(p => `
                        <tr style="border-bottom:1px solid #eee;">
                            <td style="padding:15px;"><b>${p.nom}</b><br><small>${p.adresse}</small></td>
                            <td>${p.cnop}</td>
                            <td style="color:${p.bloque ? 'red' : 'green'}"><b>${p.bloque ? 'Bloqué' : 'Actif'}</b></td>
                            <td>
                                <form action="/admin/bloquer" method="POST">
                                    <input type="hidden" name="id" value="${p.id}">
                                    <button type="submit" style="background:${p.bloque ? '#2ecc71' : '#e74c3c'}; color:white; border:none; padding:8px 15px; cursor:pointer; border-radius:5px;">
                                        ${p.bloque ? 'Débloquer' : 'Bloquer l\'accès'}
                                    </button>
                                </form>
                            </td>
                        </tr>
                    `).join('')}
                </table>
            </div>
        </div>
    `);
});

// --- 6. ACTION ADMIN : BLOQUER/DÉBLOQUER ---
app.post('/admin/bloquer', (req, res) => {
    const pharma = pharmaciesPartenaires.find(p => p.id == req.body.id);
    if (pharma) pharma.bloque = !pharma.bloque;
    res.redirect('/proprietaire-dashboard');
});

// --- DÉMARRAGE DU SERVEUR ---
app.listen(port, () => {
    console.log(`-------------------------------------------`);
    console.log(`PHARMADIRECT GLOBAL SYSTEM READY`);
    console.log(`Propriétaire: Arland Landamambou`);
    console.log(`Port: ${port}`);
    console.log(`-------------------------------------------`);
});
