const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const multer = require("multer");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 📌 Définition du dossier public
app.use("/peer.js", express.static(path.join(__dirname, "public", "peer.js")));
app.use("/webrtc.js", express.static(path.join(__dirname, "public", "webrtc.js")));

app.use(express.static(path.join(__dirname, "public")));

// 📌 Configuration du stockage des fichiers audio
const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage });

// 📌 Route pour l’upload de fichiers audio
app.post("/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "Aucun fichier envoyé" });
    }
    res.json({ fileUrl: `/uploads/${req.file.filename}` });
});

// 📌 Gestion de Socket.IO
io.on("connection", (socket) => {
    console.log("🟢 Nouvel utilisateur connecté :", socket.id);

    socket.on("message", (data) => {
        io.emit("message", data); // Diffusion du message à tous
    });

    socket.on("peer-id", (peerId) => {
        console.log("🔗 Peer connecté :", peerId);
        socket.broadcast.emit("peer-connected", peerId);
    });

    socket.on("disconnect", () => {
        console.log("❌ Utilisateur déconnecté :", socket.id);
    });
});

// 📌 Lancement du serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`));
