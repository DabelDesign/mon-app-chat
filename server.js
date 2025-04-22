const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser'); // Assure-toi d'inclure body-parser correctement

const app = express(); // Initialise app AVANT toute configuration

const server = http.createServer(app);
const io = new Server(server, {
    transports: ['websocket', 'polling'],
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

app.use(express.static(path.join(__dirname, 'public')));

// Middleware pour l'encodage et la sécurité
app.use(bodyParser.json({ type: 'application/json; charset=utf-8' }));
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});

io.on('connection', (socket) => {
    console.log('✅ Un utilisateur s\'est connecté.');
    socket.on('disconnect', () => {
        console.log('❌ Un utilisateur s\'est déconnecté.');
    });
});

server.listen(3000, () => {
    console.log('🚀 Serveur démarré sur http://localhost:3000');
});
