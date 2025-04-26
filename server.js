const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const cors = require("cors");
const compression = require("compression");

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
});

// ✅ Ajout de la compression pour améliorer les performances
app.use(compression());

// ✅ Ajout de la gestion avancée des CORS
const corsOptions = {
    origin: ["http://localhost:3000", "https://mon-app-chat.railway.app"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
};
app.use(cors(corsOptions));

// ✅ Servir les fichiers statiques (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// ✅ Ajout d’une politique de sécurité Content Security Policy (CSP)
app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self'; style-src 'self' 'unsafe-inline';");
    next();
});

// 🎯 Gestion des connexions Socket.io
io.on("connection", (socket) => {
    console.log(`✅ Un utilisateur connecté : ${socket.id}`);

    // 💬 Gestion du chat
    socket.on("chat message", (msg) => {
        console.log("💬 Message reçu :", msg);
        io.emit("chat message", msg);
    });

    // 📡 Gestion des appels WebRTC
    socket.on("offer", (offer) => {
        console.log("📡 Offre SDP reçue :", offer);
        socket.broadcast.emit("offer", offer);
    });

    socket.on("answer", (answer) => {
        console.log("✅ Réponse SDP reçue :", answer);
        socket.broadcast.emit("answer", answer);
    });

    socket.on("candidate", (candidate) => {
        console.log("🔍 Candidat ICE reçu :", candidate);
        socket.broadcast.emit("candidate", candidate);
    });

    // 🔇 Gestion de la fin d’appel
    socket.on("end-call", () => {
        console.log("🔇 Fin d’appel signalée.");
        io.emit("end-call");
    });

    socket.on("disconnect", () => {
        console.log(`❌ Utilisateur ${socket.id} déconnecté.`);
    });
});

// 🚀 Démarrer le serveur
server.listen(PORT, () => {
    console.log(`🌍 Serveur démarré sur http://localhost:${PORT}`);
});
