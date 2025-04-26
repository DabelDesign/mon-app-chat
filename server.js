const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(express.static(path.join(__dirname, "public")));

// ✅ Ajout des headers de sécurité
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "max-age=3600, must-revalidate");
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

server.listen(PORT, () => {
    console.log(`🌍 Serveur démarré sur http://localhost:${PORT}`);
});
