const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- BASES DE DONNÉES TEMPORAIRES ---
let commandes = []; 
let pharmaciesPartenaires = [];
let messagesChat = []; 

// --- FONCTION CALCUL ABONNEMENT (2 MOIS) ---
function estPeriodeEssaiFinie(dateInsc) {
    const deuxMoisEnMs = 60 * 24 * 60 * 60 * 1000;
    return (new Date() - new Date(dateInsc)) > deuxMoisEnMs;
}

// 1. CONNEXION SÉCURISÉE (ADMIN & PHARMACIES)
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === 'admin' && password === 'Arland2026') {
        return res.redirect('/proprietaire-dashboard');
    }

    const pharma = pharmaciesPartenaires.find(p => p.email === username && p.password === password);
    if (pharma) {
        if (pharma.bloque) return res.send('<h1>Compte bloqué par l\'administrateur.</h1>');
        
        // Vérification abonnement après 2 mois
        if (estPeriodeEssaiFinie(pharma.dateBrute) && !pharma.abonnementPaye) {
            return res.redirect('/paiement-abonnement.html');
        }
        return res.redirect(`/pharmacie-dashboard?id=${pharma.id}`);
    }
    res.send('<h1>Identifiants incorrects</h1><a href="/">Réessayer</a>');
});

// 2. INSCRIPTION AUTOMATIQUE (META-STYLE)
app.post('/register-pharmacy', (req, res) => {
    const { nomPharmacie, cnop, email, password, nomPharmacien, adresse, telephone } = req.body;

    if (pharmaciesPartenaires.find(p => p.email === email || p.cnop === cnop)) {
        return res.send('<h1>Erreur : CNOP ou Email déjà utilisé.</h1>');
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
        dateBrute: new Date(),
        bloque: false,
        abonnementPaye: false
    };

    pharmaciesPartenaires.push(nouvellePharma);
    res.redirect('/?success=registered');
});

// 3. PAIEMENT CLIENT AVEC DISTRIBUTION AUTOMATIQUE (SPLIT)
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
        pharmaId: pharmaId
    };

    commandes.push(transaction);
    res.json({ success: true, message: "Paiement distribué : 10% vers Arland, 90% vers Pharmacie" });
});

// 4. DASHBOARD PROPRIÉTAIRE (VOTRE CENTRE DE CONTRÔLE)
app.get('/proprietaire-dashboard', (req, res) => {
    let totalGainsArland = commandes.reduce((sum, c) => sum + c.gainArland, 0);

    res.send(`
        <div style="font-family:sans-serif; padding:30px; background:#f4f7f6; min-height:100vh;">
            <h1 style="color:#2c3e50;">🛡️ PharmaDirect Global Control (Arland)</h1>
            
            <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-bottom:30px;">
                <div style="background:white; padding:20px; border-radius:10px; box-shadow:0 2px 10px rgba(0,0,0,0.1);">
                    <h3>💰 Mon Portefeuille (10%)</h3>
                    <p style="font-size:24px; font-weight:bold; color:#e67e22;">${totalGainsArland.toLocaleString()} FC</p>
                </div>
                <div style="background:white; padding:20px; border-radius:10px;">
                    <h3>🏥 Pharmacies Partenaires</h3>
                    <p style="font-size:24px; font-weight:bold; color:#3498db;">${pharmaciesPartenaires.length}</p>
                </div>
                <div style="background:white; padding:20px; border-radius:10px;">
                    <h3>📦 Transactions Totales</h3>
                    <p style="font-size:24px; font-weight:bold;">${commandes.length}</p>
                </div>
            </div>

            <h3>Gestion des Officines</h3>
            <table border="1" style="width:100%; border-collapse:collapse; background:white;">
                <tr style="background:#2ecc71; color:white;">
                    <th style="padding:10px;">Pharmacie</th><th>CNOP</th><th>Status</th><th>Action</th>
                </tr>
                ${pharmaciesPartenaires.map(p => `
                    <tr>
                        <td style="padding:10px;">${p.nom}</td>
                        <td>${p.cnop}</td>
                        <td style="color:${p.bloque ? 'red' : 'green'}">${p.bloque ? 'Bloqué' : 'Actif'}</td>
                        <td>
                            <form action="/admin/bloquer" method="POST" style="display:inline;">
                                <input type="hidden" name="id" value="${p.id}">
                                <button type="submit" style="background:${p.bloque ? '#2ecc71' : '#e74c3c'}; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:5px;">
                                    ${p.bloque ? 'Débloquer' : 'Bloquer'}
                                </button>
                            </form>
                        </td>
                    </tr>
                `).join('')}
            </table>
        </div>
    `);
});

// 5. BOUTON BLOQUER (Action Admin)
app.post('/admin/bloquer', (req, res) => {
    const pharma = pharmaciesPartenaires.find(p => p.id == req.body.id);
    if (pharma) pharma.bloque = !pharma.bloque;
    res.redirect('/proprietaire-dashboard');
});

app.listen(port, () => console.log(`Système Global PharmaDirect prêt sur le port ${port}`));
