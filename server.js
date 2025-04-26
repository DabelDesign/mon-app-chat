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

app.use(express.static(path.join(__dirname, "public")));

// ✅ Ajout des headers de sécurité
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "max-age=3600, must-revalidate");
    res.setHeader("Content-Security-Policy", "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self';");
    next();
});

// 🎯 Gestion des connexions Socket.io
io.on("connection", (socket) => {
    console.log(`✅ Un utilisateur connecté : ${socket.id}`);

    socket.on("chat message", (msg) => {
        io.emit("chat message", msg);
    });

    socket.on("disconnect", () => {
        console.log(`❌ Utilisateur ${socket.id} déconnecté.`);
    });
});

// ✅ Gestion des erreurs du serveur
server.on("error", (err) => {
    console.error("❌ Erreur sur le serveur :", err);
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`🌍 Serveur démarré sur http://localhost:${PORT}`);
});
// Trigger redeploy
