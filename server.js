const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const multer = require("multer");
const { PeerServer } = require("peer");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Servir le dossier public
app.use(express.static("public", {
    setHeaders: (res) => {
        res.setHeader("Cache-Control", "public, max-age=86400");
    }
}));

// Configuration de Multer pour uploader les fichiers
const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("file"), (req, res) => {
    res.json({ fileUrl: `/uploads/${req.file.filename}` });
});

// Initialisation du serveur PeerJS
const peerServer = PeerServer({ port: 9000, path: "/peerjs" });
app.use("/peerjs", peerServer);

// Stocker les identifiants PeerJS des utilisateurs connectés
const peerConnections = {};

// Gestion des connexions Socket.IO
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

    // Gestion des appels vocaux et vidéo
    socket.on("start-call", (data) => {
        socket.broadcast.emit("incoming-call", data);
    });

    // Fin des appels
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

// Démarrage du serveur sur un port libre
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});
