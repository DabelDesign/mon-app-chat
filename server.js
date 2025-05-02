const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const users = {}; // 🔹 Stocke les utilisateurs connectés

app.use(express.static("public")); // 📂 Sert les fichiers statiques (HTML, CSS, JS)

io.on("connection", (socket) => {
    console.log(`🔗 Utilisateur connecté : ${socket.id}`);
    users[socket.id] = socket.id; // 🔹 Assigne un ID unique à chaque utilisateur

    // Envoyer la liste des utilisateurs connectés
    io.emit("user-list", Object.values(users));

    socket.on("disconnect", () => {
        console.log(`❌ Utilisateur déconnecté : ${socket.id}`);
        delete users[socket.id]; // 🔹 Supprimer l'utilisateur déconnecté
        io.emit("user-list", Object.values(users)); // 🔹 Mettre à jour la liste des utilisateurs
    });

    // 🔹 Envoi des messages privés
    socket.on("private-message", ({ to, message }) => {
        io.to(to).emit("message", { from: socket.id, message });
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
