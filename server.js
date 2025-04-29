require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('Utilisateur connecté :', socket.id);

    socket.on('startCall', () => {
        socket.broadcast.emit('startCall');
    });

    socket.on('offer', (offer) => {
        socket.broadcast.emit('offer', offer);
    });

    socket.on('answer', (answer) => {
        socket.broadcast.emit('answer', answer);
    });

    socket.on('iceCandidate', (candidate) => {
        socket.broadcast.emit('iceCandidate', candidate);
    });

    socket.on('chatMessage', (message) => {
        io.emit('chatMessage', message);
    });

    socket.on('disconnect', () => {
        console.log('Utilisateur déconnecté :', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

