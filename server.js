const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

// Sert les fichiers statiques dans "public"
app.use(express.static('public'));

// Configurer Socket.io
io.on('connection', (socket) => {
    console.log('Un utilisateur est connecté.');

    // Écoute les messages de chat
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg); // Diffuse à tous
    });

    socket.on('disconnect', () => {
        console.log('Un utilisateur s\'est déconnecté.');
    });
});

// Démarre le serveur
server.listen(PORT, () => {
    console.log(`Serveur en écoute sur http://localhost:${PORT}`);
});
