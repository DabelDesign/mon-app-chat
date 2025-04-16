const express = require('express');
const http = require('http');
const compression = require('compression');
const { Server } = require('socket.io');
const mongoose = require('mongoose'); // MongoDB

const app = express();
const server = http.createServer(app);

// Configuration Socket.io pour utiliser uniquement WebSocket
const io = new Server(server, {
    transports: ['websocket'], // Force l'utilisation des WebSocket uniquement
    pingInterval: 25000,       // Intervalle de ping (25 secondes)
    pingTimeout: 5000,         // Timeout avant déconnexion (5 secondes)
});

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/chatDB')
    .then(() => console.log('Connecté à MongoDB'))
    .catch((err) => console.error('Erreur de connexion à MongoDB', err));

// Définition du modèle pour les messages
const messageSchema = new mongoose.Schema({
    user: String,
    color: String,
    content: String,
    timestamp: { type: Date, default: Date.now },
});
const Message = mongoose.model('Message', messageSchema);

const PORT = 3000;

// Middleware pour compresser les réponses HTTP
app.use(compression());

// Middleware global pour définir le charset utf-8 sur toutes les réponses
app.use((req, res, next) => {
    const contentType = res.getHeader('Content-Type');
    if (contentType && !contentType.includes('charset')) {
        res.setHeader('Content-Type', `${contentType}; charset=utf-8`);
    }
    next();
});

// Sert les fichiers statiques (HTML, CSS, JS) avec type MIME explicite
app.use(express.static('public', {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) res.setHeader('Content-Type', 'text/css; charset=utf-8');
        else if (path.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        else if (path.endsWith('.html')) res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
}));

// Socket.io - Gestion des connexions et enregistrement des messages
io.on('connection', async (socket) => {
    console.log('Un utilisateur est connecté.');

    try {
        // Récupérer les anciens messages depuis MongoDB
        const messages = await Message.find().limit(50).sort({ timestamp: -1 });
        socket.emit('previous messages', messages.reverse());
    } catch (err) {
        console.error('Erreur lors de la récupération des messages :', err);
    }

    // Écoute des nouveaux messages et sauvegarde
    socket.on('chat message', async (data) => {
        try {
            const newMessage = new Message(data);
            await newMessage.save();
            io.emit('chat message', data); // Diffusion à tous les utilisateurs
        } catch (err) {
            console.error('Erreur lors de l\'enregistrement du message :', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('Un utilisateur s\'est déconnecté.');
    });
});

// Démarrage du serveur
server.listen(PORT, () => {
    console.log(`Serveur en écoute sur http://localhost:${PORT}`);
});
