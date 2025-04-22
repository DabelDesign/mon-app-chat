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
    console.log('✅ Un utilisateur s\'est connecté.');
    
    socket.emit('chat history', chatHistory);

    socket.on('chat message', (msg) => {
        chatHistory.push(msg);
        io.emit('chat message', msg);
    });

    socket.on('offer', (offer) => {
        console.log("📡 Offre WebRTC reçue :", offer);
        socket.broadcast.emit('offer', offer);
    });

    socket.on('answer', (answer) => {
        console.log("✅ Réponse WebRTC reçue :", answer);
        socket.broadcast.emit('answer', answer);
    });

    socket.on('candidate', (candidate) => {
        console.log("🔍 Candidat ICE reçu :", candidate);
        socket.broadcast.emit('candidate', candidate);
    });

    socket.on('voice message', (audioData) => {
        console.log("🎙️ Message vocal reçu !");
        socket.broadcast.emit('voice message', audioData);
    });

    socket.on('disconnect', () => {
        console.log('❌ Un utilisateur s\'est déconnecté.');
    });
});

server.listen(3000, () => {
    console.log('🚀 Serveur démarré sur http://localhost:3000');
});
