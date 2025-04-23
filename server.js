require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Connexion à MongoDB sans options obsolètes
mongoose.connect(process.env.DB_URI)
.then(() => console.log('✅ Connecté à MongoDB !'))
.catch((err) => console.error('❌ Erreur de connexion à MongoDB :', err));

// Importation des modèles
const User = require('./models/User');
const Message = require('./models/Message');

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

// Routes API pour les utilisateurs
app.post('/users', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.status(201).send(user);
    } catch (err) {
        res.status(400).send(err);
    }
});

app.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).send(users);
    } catch (err) {
        res.status(500).send(err);
    }
});

// Routes API pour les messages
app.post('/messages', async (req, res) => {
    try {
        const message = new Message(req.body);
        await message.save();
        res.status(201).send(message);
    } catch (err) {
        res.status(400).send(err);
    }
});

app.get('/messages', async (req, res) => {
    try {
        const messages = await Message.find();
        res.status(200).send(messages);
    } catch (err) {
        res.status(500).send(err);
    }
});

// Gestion des sockets pour le chat et les appels
io.on('connection', (socket) => {
    console.log('✅ Un utilisateur s\'est connecté.');

    // Gestion des messages
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });

    // Gestion des appels
    socket.on('offer', (offer) => {
        socket.broadcast.emit('offer', offer);
    });

    socket.on('answer', (answer) => {
        socket.broadcast.emit('answer', answer);
    });

    socket.on('candidate', (candidate) => {
        socket.broadcast.emit('candidate', candidate);
    });

    socket.on('end call', () => {
        console.log('🔚 Appel terminé par un utilisateur.');
        socket.broadcast.emit('end call');
    });

    socket.on('disconnect', () => {
        console.log('❌ Un utilisateur s\'est déconnecté.');
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
