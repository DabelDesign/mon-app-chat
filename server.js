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

// 🔹 Stockage des utilisateurs
const users = {};

// 📂 Servir les fichiers statiques (HTML, CSS, JS)
app.use(express.static("public"));

// 🔹 Sécurité et cache
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache optimisé
    res.setHeader("X-Content-Type-Options", "nosniff"); // Sécurité contre MIME sniffing
    res.removeHeader("X-Powered-By"); // 🔥 Supprime les infos serveur pour éviter l'exposition
    next();
});

io.on("connection", (socket) => {
    console.log(`🔗 Utilisateur connecté : ${socket.id}`);

    // 🔹 Enregistrement du pseudo
    socket.on("set-username", (username) => {
        users[socket.id] = username;
        console.log(`✅ Pseudo enregistré : ${username}`);
        io.emit("user-list", users);
    });

    // 🔹 Déconnexion
    socket.on("disconnect", () => {
        console.log(`❌ Utilisateur déconnecté : ${socket.id}`);
        delete users[socket.id];
        io.emit("user-list", users);
    });

    // 🔹 Gestion des messages privés
    socket.on("private-message", ({ to, message }) => {
        const recipientSocket = Object.keys(users).find(key => users[key] === to);
        if (!recipientSocket) {
            console.error(`❌ Utilisateur introuvable pour l'envoi du message : ${to}`);
            return;
        }

        io.to(recipientSocket).emit("private-message", { from: users[socket.id], message });
        console.log(`📩 Message privé envoyé à ${to}:`, message);
    });

    // 🔹 Enregistrement de l'ID PeerJS
    socket.on("peer-id", (id) => {
        console.log(`🔗 ID PeerJS enregistré : ${id}`);
    });

    // 🔹 Gestion des appels privés
    socket.on("start-private-call", ({ to, peerId }) => {
        const recipientSocket = Object.keys(users).find(key => users[key] === to);
        if (!recipientSocket) {
            console.error(`❌ Impossible de démarrer l'appel : utilisateur introuvable (${to})`);
            return;
        }

        io.to(recipientSocket).emit("incoming-call", peerId);
    });

    socket.on("end-call", () => {
        console.log("🔴 Fin d’appel reçue !");
        io.emit("call-ended");
    });
});

// 🔥 Démarrage du serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
