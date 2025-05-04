const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const { PeerServer } = require("peer");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// 🔹 Initialisation du serveur PeerJS
const peerServer = PeerServer({ port: 9000, path: "/peerjs" });
peerServer.on("connection", (client) => {
    console.log(`🟢 Peer connecté : ${client.getId()}`);
});

// 🔹 Stockage des utilisateurs et PeerJS IDs
const users = {};
const peers = {};
const activeCalls = {}; // 🔹 Suivi des appels en cours

app.use(express.static("public"));

app.use((req, res, next) => {
    res.setHeader("Cache-Control", "public, max-age=31536000");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.removeHeader("X-Powered-By");
    next();
});

io.on("connection", (socket) => {
    console.log(`🔗 Utilisateur connecté : ${socket.id}`);

    socket.on("set-username", (username) => {
        users[socket.id] = username;
        console.log(`✅ Pseudo enregistré : ${username}`);
        io.emit("user-list", users); // 🔹 Mise à jour immédiate de la liste des utilisateurs
    });

    socket.on("peer-id", (peerId) => {
        peers[socket.id] = peerId;
        console.log(`🔗 ID PeerJS enregistré : ${peerId}`);
    });

    socket.on("disconnect", () => {
        console.log(`❌ Utilisateur déconnecté : ${socket.id}`);
        delete users[socket.id];
        delete peers[socket.id];
        delete activeCalls[socket.id];

        io.emit("user-list", users); // 🔹 Mise à jour après une déconnexion
    });

    // 🔹 Gestion des appels privés
    socket.on("start-private-call", ({ to }) => {
        const recipientSocket = Object.keys(users).find(key => users[key] === to);
        const peerId = peers[socket.id];

        if (!recipientSocket || !peerId) {
            console.error(`❌ Impossible de démarrer l'appel : utilisateur ou PeerJS ID introuvable (${to})`);
            return;
        }

        activeCalls[socket.id] = recipientSocket;
        activeCalls[recipientSocket] = socket.id;

        io.to(recipientSocket).emit("incoming-call", peerId);
    });

    // 🔹 Gestion du raccrochage des appels
    socket.on("end-call", () => {
        const recipientSocket = activeCalls[socket.id];
        if (!recipientSocket) {
            console.error("❌ Aucun appel en cours à terminer !");
            return;
        }

        console.log(`🔴 Fin d’appel entre ${socket.id} et ${recipientSocket}`);

        io.to(recipientSocket).emit("call-ended");
        io.to(socket.id).emit("call-ended");

        delete activeCalls[socket.id];
        delete activeCalls[recipientSocket];

        console.log("✅ Appel terminé avec succès !");
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
