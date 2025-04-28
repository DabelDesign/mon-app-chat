const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://mon-app-chat-production.up.railway.app",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, "public")));

// Ajout des headers de sécurité CSP
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "max-age=3600, must-revalidate");
    res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' wss://mon-app-chat-production.up.railway.app https://mon-app-chat-production.up.railway.app;"
    );
    next();
});

// Gestion des connexions Socket.io
io.on("connection", (socket) => {
    console.log(`✅ Utilisateur connecté : ${socket.id}`);

    socket.on("chat message", (msg) => {
        io.emit("chat message", msg);
    });

    socket.on("disconnect", () => {
        console.log(`❌ Utilisateur déconnecté : ${socket.id}`);
    });
});

// Gestion des erreurs serveur
server.on("error", (err) => {
    console.error("❌ Erreur sur le serveur :", err);
});

// Lancement du serveur
server.listen(PORT, "0.0.0.0", () => {
    console.log(`🌍 Serveur démarré sur http://localhost:${PORT}`);
});
