const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    transports: ['websocket', 'polling'],
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

let chatHistory = [];

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('Un utilisateur s\'est connecté.');
    socket.emit('chat history', chatHistory);

    socket.on('chat message', (msg) => {
        chatHistory.push(msg);
        io.emit('chat message', msg);
    });

    // Gestion des appels WebRTC
    socket.on('offer', (offer) => socket.broadcast.emit('offer', offer));
    socket.on('answer', (answer) => socket.broadcast.emit('answer', answer));
    socket.on('candidate', (candidate) => socket.broadcast.emit('candidate', candidate));

    // Gestion des messages vocaux
    socket.on('voice message', (audioBlob) => socket.broadcast.emit('voice message', audioBlob));

    socket.on('disconnect', () => {
        console.log('Un utilisateur s\'est déconnecté.');
    });
});

server.listen(3000, () => {
    console.log('Serveur démarré sur http://localhost:3000');
});
