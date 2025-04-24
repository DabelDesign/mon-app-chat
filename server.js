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

io.on("connection", (socket) => {
    console.log("✅ Un utilisateur s'est connecté.");

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
        console.log("❌ Un utilisateur s'est déconnecté.");
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
