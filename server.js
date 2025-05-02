const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const users = {}; // 🔹 Stocke les pseudos et IDs des utilisateurs

app.use(express.static("public")); // 📂 Sert les fichiers statiques (HTML, CSS, JS)

io.on("connection", (socket) => {
    console.log(`🔗 Utilisateur connecté : ${socket.id}`);

    socket.on("set-username", (username) => {
        users[socket.id] = username; // 🔹 Associe le pseudo à l’ID
        io.emit("user-list", Object.values(users)); // 🔹 Met à jour la liste des pseudos
    });

    socket.on("disconnect", () => {
        console.log(`❌ Utilisateur déconnecté : ${socket.id}`);
        delete users[socket.id]; // 🔹 Supprime l’utilisateur lorsqu’il quitte
        io.emit("user-list", Object.values(users));
    });

    // 🔹 Envoi des messages privés
    socket.on("private-message", ({ to, message }) => {
        io.to(to).emit("message", { from: users[socket.id], message });
    });

    // 🔹 Appels vidéo/vocaux privés
    socket.on("start-private-call", ({ to, peerId }) => {
        io.to(to).emit("incoming-call", peerId);
    });

    socket.on("end-call", () => {
        io.emit("call-ended");
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
