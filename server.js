const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const users = {}; // 🔹 Stocke les pseudos et leurs ID socket

app.use(express.static("public")); // 📂 Sert les fichiers statiques (HTML, CSS, JS)

io.on("connection", (socket) => {
    console.log(`🔗 Utilisateur connecté : ${socket.id}`);

    socket.on("set-username", (username) => {
        users[socket.id] = username;
        console.log(`✅ Pseudo enregistré : ${username}`);
        io.emit("user-list", Object.values(users));
    });
    

    socket.on("disconnect", () => {
        console.log(`❌ Utilisateur déconnecté : ${socket.id}`);
        delete users[socket.id];
        io.emit("user-list", Object.values(users));
    });

    socket.on("private-message", ({ to, message }) => {
        const recipientSocket = Object.keys(users).find(key => users[key] === to);
        if (recipientSocket) {
            io.to(recipientSocket).emit("message", { from: users[socket.id], message });
        }
    });

    socket.on("start-private-call", ({ to, peerId }) => {
        const recipientSocket = Object.keys(users).find(key => users[key] === to);
        if (recipientSocket) {
            io.to(recipientSocket).emit("incoming-call", peerId);
        }
    });

    socket.on("end-call", () => {
        io.emit("call-ended");
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
