const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const { PeerServer } = require("peer");
const peerServer = PeerServer({ port: 9000, path: "/peerjs" });

peerServer.on("connection", (client) => {
    console.log(`🟢 Peer connecté : ${client.getId()}`);
});

const users = {}; // 🔹 Stocke les pseudos et leurs ID socket

app.use(express.static("public")); // 📂 Sert les fichiers statiques (HTML, CSS, JS)

// 🔹 Sécurité et cache
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
        io.emit("user-list", users);
    });

    socket.on("disconnect", () => {
        console.log(`❌ Utilisateur déconnecté : ${socket.id}`);
        delete users[socket.id];
        io.emit("user-list", users);
    });

    socket.on("private-message", ({ to, message }) => {
        const recipientSocket = Object.keys(users).find(key => users[key] === to);
        if (recipientSocket) {
            io.to(recipientSocket).emit("private-message", { from: users[socket.id], message });
        }
        console.log(`📩 Message privé envoyé à ${to}: ${message}`);
    });
    
    socket.on("private-message", ({ to, message }) => {
        const recipientSocket = Object.keys(users).find(key => users[key] === to);
        if (recipientSocket) {
            io.to(recipientSocket).emit("private-message", { from: users[socket.id], message });
        }
        console.log(`📩 Message privé envoyé à ${to}: ${message}`);
    });
    socket.on("peer-id", (id) => {
        console.log(`🔗 ID PeerJS enregistré : ${id}`);
    });
    
    
    socket.on("start-private-call", ({ to, peerId }) => {
        const recipientSocket = Object.keys(users).find(key => users[key] === to);
        if (recipientSocket) {
            io.to(recipientSocket).emit("incoming-call", peerId);
        }
    });

    socket.on("end-call", () => {
        console.log("🔴 Fin d’appel reçue !");
        io.emit("call-ended");
    });
}); // 🔹 Ajout de la accolade manquante pour fermer le bloc io.on("connection")

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
})