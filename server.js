const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Création du serveur HTTP
const server = http.createServer(app);

// Configuration de Socket.IO
const io = new Server(server, {
    transports: ["websocket", "polling"],
    cors: {
        origin: "https://mon-app-chat-production.up.railway.app",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, "public")));

// Ajouter des headers de sécurité
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
});
app.disable("x-powered-by");

// Gestion des connexions
io.on("connection", (socket) => {
    console.log(`Utilisateur connecté : ${socket.id}`);

    // Gérer les messages texte
    socket.on("chat message", (msg) => {
        io.emit("chat message", msg);
        console.log(`Message reçu : ${msg}`);
    });

    // Gestion des déconnexions
    socket.on("disconnect", () => {
        console.log(`Utilisateur déconnecté : ${socket.id}`);
    });
});

// Lancer le serveur
server.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
