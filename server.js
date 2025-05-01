const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public"))); // Serveur des fichiers statiques

io.on("connection", (socket) => {
    console.log("🟢 Un utilisateur connecté :", socket.id);

    socket.on("start-call", (data) => {
        console.log("📞 Début d'un appel");
        socket.broadcast.emit("call-started", data);
    });

    socket.on("peer-id", (id) => {
        console.log("🔗 ID Peer reçu :", id);
        socket.broadcast.emit("peer-connected", id);
    });

    socket.on("end-call", () => {
        console.log("❌ Appel terminé");
        socket.broadcast.emit("call-ended");
    });

    socket.on("message", (msg) => {
        console.log("💬 Message reçu :", msg);
        io.emit("message", msg);
    });

    socket.on("disconnect", () => {
        console.log("🔴 Un utilisateur s'est déconnecté :", socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
