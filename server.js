require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

const server = http.createServer(app);
const io = new Server(server, {
    transports: ['websocket', 'polling'],
    cors: {
        origin: CLIENT_ORIGIN,
        methods: ["GET", "POST"],
    },
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

io.on('connection', (socket) => {
    console.log('✅ Un utilisateur s\'est connecté.');

    // Gestion des événements
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg); // Diffuse le message à tous les clients
    });

    socket.on('offer', (offer) => {
        socket.broadcast.emit('offer', offer); // Diffuse l'offre de connexion
    });

    socket.on('answer', (answer) => {
        socket.broadcast.emit('answer', answer); // Diffuse la réponse
    });

    socket.on('candidate', (candidate) => {
        socket.broadcast.emit('candidate', candidate); // Diffuse le candidat ICE
    });

    socket.on('end call', () => {
        console.log('🔚 Appel terminé par un utilisateur.');
        socket.broadcast.emit('end call'); // Informe tous les autres utilisateurs
    });

    socket.on('disconnect', () => {
        console.log('❌ Un utilisateur s\'est déconnecté.');
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
