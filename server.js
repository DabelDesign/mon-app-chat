const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));

// Stocker les identifiants PeerJS des utilisateurs connectés
const peerConnections = {};

io.on("connection", (socket) => {
    console.log("🟢 Un utilisateur s'est connecté");

    // Gestion des identifiants PeerJS
    socket.on("peer-id", (id) => {
        peerConnections[socket.id] = id;
        socket.broadcast.emit("peer-connected", id);
    });

    // Gestion des messages
    socket.on("message", (msg) => {
        io.emit("message", msg);
    });

    // Gestion de l’appel vocal et vidéo
    socket.on("start-call", (data) => {
        socket.broadcast.emit("incoming-call", data);
    });

    // Gestion de la fin des appels
    socket.on("end-call", () => {
        socket.broadcast.emit("call-ended");
    });

    // Déconnexion de l’utilisateur
    socket.on("disconnect", () => {
        console.log("🔴 Un utilisateur s'est déconnecté");
        delete peerConnections[socket.id];
        socket.broadcast.emit("peer-disconnected", socket.id);
    });
});

server.listen(3000, () => {
    console.log("✅ Serveur démarré sur http://localhost:3000");
});
