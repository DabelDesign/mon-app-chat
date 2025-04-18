const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const upload = multer();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { transports: ['websocket'] });

app.use(express.static('public')); // Sert les fichiers statiques

io.on('connection', (socket) => {
    console.log('Un utilisateur s\'est connecté.');

    socket.on('chat message', (data) => {
        console.log('Message reçu :', data);
        io.emit('chat message', data);
    });

    socket.on('voice message', (audioBlob) => {
        io.emit('voice message', audioBlob);
    });

    socket.on('disconnect', () => {
        console.log('Un utilisateur s\'est déconnecté.');
    });
});

server.listen(3000, () => {
    console.log('Serveur en écoute sur http://localhost:3000');
});
