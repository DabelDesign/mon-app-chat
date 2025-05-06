require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const { ExpressPeerServer } = require("peer");
const helmet = require("helmet");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// 🔹 Sécurisation HTTP
app.use(helmet());

// 🔹 Initialisation du serveur PeerJS
const peerServer = ExpressPeerServer(server, { debug: true, path: "/peerjs" });
app.use("/peerjs", peerServer);

peerServer.on("connection", (client) => console.log(`🟢 Peer connecté : ${client.getId()}`));
peerServer.on("error", (err) => {
    console.error("❌ Erreur PeerJS :", err);
    io.emit("peer-error", err.message);
});

// 🔹 Stockage des utilisateurs
const users = {};
const peers = {};
const activeCalls = {};

app.use(express.static("public"));

// 🔹 Sécurisation & optimisation des en-têtes HTTP
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "public, max-age=31536000");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.removeHeader("X-Powered-By");
    next();
});

io.on("connection", (socket) => {
    console.log(`🔗 Utilisateur connecté : ${socket.id}`);

    socket.on("set-username", (username) => {
        if (!username || typeof username !== "string") return;
        users[socket.id] = username;
        console.log(`✅ Pseudo enregistré : ${username}`);
        io.emit("user-list", users);
    });

    socket.on("peer-id", (peerId) => {
        if (!peerId) return;
        peers[socket.id] = peerId;
        console.log(`🔗 ID PeerJS enregistré : ${peerId}`);
    });

    socket.on("disconnect", () => {
        delete users[socket.id];
        delete peers[socket.id];
        delete activeCalls[socket.id];
        io.emit("user-list", users);
    });

    socket.on("start-private-call", ({ to }) => {
        const recipientSocket = Object.keys(peers).find((key) => users[key] === to);
        const peerId = peers[socket.id];

        if (!recipientSocket || !peerId || !users[recipientSocket]) {
            console.error(`❌ Impossible de démarrer l'appel : utilisateur introuvable (${to})`);
            socket.emit("call-error", "L'utilisateur n'est pas disponible");
            return;
        }

        activeCalls[socket.id] = recipientSocket;
        activeCalls[recipientSocket] = socket.id;

        io.to(recipientSocket).emit("incoming-call", peerId);
    });

    socket.on("end-call", () => {
        const recipientSocket = activeCalls[socket.id];
        if (!recipientSocket) return;

        io.to(recipientSocket).emit("call-ended");
        io.to(socket.id).emit("call-ended");

        delete activeCalls[socket.id];
        delete activeCalls[recipientSocket];

        console.log("✅ Appel terminé !");
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Serveur démarré sur le port ${PORT}`));
