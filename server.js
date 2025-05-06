require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const { ExpressPeerServer } = require("peer");
const helmet = require("helmet"); // Sécurité HTTP

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// 🔹 Sécurisation HTTP
app.use(helmet());

// 🔹 Initialisation du serveur PeerJS
const peerServer = ExpressPeerServer(server, {
    debug: true,
    path: "/peerjs"
});
app.use("/peerjs", peerServer);

peerServer.on("connection", (client) => {
    console.log(`🟢 Peer connecté : ${client.getId()}`);
});

peerServer.on("error", (err) => {
    console.error("❌ Erreur PeerJS :", err);
    io.emit("peer-error", err.message); // Envoi des erreurs aux clients
});

// 🔹 Stockage des utilisateurs et PeerJS IDs
const users = {};
const peers = {};
const activeCalls = {};

app.use(express.static("public"));

// 🔹 Sécurisation et optimisation des en-têtes HTTP
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "public, max-age=31536000");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.removeHeader("X-Powered-By");
    next();
});

io.on("connection", (socket) => {
    console.log(`🔗 Utilisateur connecté : ${socket.id}`);

    socket.on("set-username", (username) => {
        if (!username || typeof username !== "string") {
            console.warn("⚠️ Username invalide !");
            return;
        }
        users[socket.id] = username;
        console.log(`✅ Pseudo enregistré : ${username}`);
        io.emit("user-list", users);
    });

    socket.on("peer-id", (peerId) => {
        if (!peerId) {
            console.warn("⚠️ ID PeerJS invalide !");
            return;
        }
        peers[socket.id] = peerId;
        console.log(`🔗 ID PeerJS enregistré : ${peerId}`);
    });

    socket.on("disconnect", () => {
        console.log(`❌ Utilisateur déconnecté : ${socket.id}`);
        delete users[socket.id];
        delete peers[socket.id];
        delete activeCalls[socket.id];
        io.emit("user-list", users);
    });

    socket.on("start-private-call", ({ to }) => {
        try {
            const recipientSocket = Object.keys(peers).find((key) => users[key] === to);
            const peerId = peers[socket.id];

            if (!recipientSocket || !peerId || !users[recipientSocket]) {
                throw new Error(`Utilisateur introuvable (${to})`);
            }

            activeCalls[socket.id] = recipientSocket;
            activeCalls[recipientSocket] = socket.id;

            io.to(recipientSocket).emit("incoming-call", peerId);
        } catch (err) {
            console.error(`❌ Impossible de démarrer l'appel : ${err.message}`);
            socket.emit("call-error", err.message);
        }
    });

    socket.on("end-call", () => {
        try {
            const recipientSocket = activeCalls[socket.id];
            if (!recipientSocket || !activeCalls[recipientSocket]) {
                throw new Error("Aucun appel en cours à terminer !");
            }

            console.log(`🔴 Fin d’appel entre ${socket.id} et ${recipientSocket}`);

            io.to(recipientSocket).emit("call-ended");
            io.to(socket.id).emit("call-ended");

            delete activeCalls[socket.id];
            delete activeCalls[recipientSocket];

            console.log("✅ Appel terminé avec succès !");
        } catch (err) {
            console.warn(`❌ Erreur de fin d’appel : ${err.message}`);
        }
    });
});

// 🔹 Vérification du fichier .env et de la variable PORT
const PORT = process.env.PORT || 3000;
if (!process.env.PORT) {
    console.warn("⚠️ PORT non défini dans .env, utilisation du port par défaut 3000");
}

server.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
