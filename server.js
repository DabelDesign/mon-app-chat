require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Connexion à MongoDB
mongoose.connect(process.env.DB_URI)
    .then(() => console.log('✅ Connecté à MongoDB !'))
    .catch((err) => console.error('❌ Erreur de connexion à MongoDB :', err));

// Importation des modèles
const User = require('./models/User');
const Message = require('./models/Message');

const app = express();
const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://192.168.1.13:3000", // Remplace par ton IP si nécessaire
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
        console.log("Message à enregistrer :", req.body); // Log côté serveur
        await message.save();
        console.log("Message enregistré :", message); // Vérification après enregistrement
        res.status(201).send(message);
    } catch (err) {
        console.error("Erreur lors de l'enregistrement :", err);
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

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
    console.log('✅ Un utilisateur s\'est connecté.');

    // Gestion des messages
    socket.on("chat message", (msg) => {
        console.log("Message reçu sur le serveur :", msg); // Log côté serveur
        io.emit("chat message", msg); // Diffusion à tous les utilisateurs
    });

    // Diffusion des offres SDP
    socket.on("offer", (offer) => {
        console.log("Offre SDP reçue sur le serveur :", offer);
        socket.broadcast.emit("offer", offer); // Diffusion aux autres utilisateurs
    });

    // Diffusion des réponses SDP
    socket.on("answer", (answer) => {
        console.log("Réponse SDP reçue sur le serveur :", answer);
        socket.broadcast.emit("answer", answer);
    });

    // Diffusion des candidats ICE
    socket.on("candidate", (candidate) => {
        console.log("Candidat ICE reçu sur le serveur :", candidate);
        socket.broadcast.emit("candidate", candidate);
    });

    // Fin de l'appel
    socket.on("end call", () => {
        console.log("🔚 Appel terminé par un utilisateur.");
        socket.broadcast.emit("end call");
    });

    // Déconnexion
    socket.on('disconnect', () => {
        console.log('❌ Un utilisateur s\'est déconnecté.');
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
