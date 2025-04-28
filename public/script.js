"use strict";

// 📡 Connexion Socket.io (avec vérification de disponibilité)
if (typeof io !== "undefined") {
    const socket = io("https://mon-app-chat-production.up.railway.app");

    // ✅ Indicateur de connexion
    const connectionStatus = document.getElementById("connection-status");
    socket.on("connect", () => {
        console.log("✅ Connecté au serveur");
        connectionStatus.textContent = "🟢 Connecté";
    });
    socket.on("disconnect", () => {
        console.warn("❌ Déconnecté du serveur");
        connectionStatus.textContent = "🔴 Déconnecté";
    });

    // 💬 Gestion du chat
    document.getElementById("send-btn").addEventListener("click", () => {
        const messageInput = document.getElementById("message-input");
        const message = messageInput.value.trim();
        if (message) {
            console.log(`📩 Message envoyé : ${message}`);
            socket.emit("chat message", message);
            messageInput.value = "";
        }
    });

    socket.on("chat message", (msg) => {
        console.log(`📨 Message reçu : ${msg}`);
        const messageList = document.getElementById("messages");
        const newMessage = document.createElement("li");
        newMessage.textContent = msg;
        messageList.appendChild(newMessage);
    });
} else {
    console.error("Socket.io non chargé !");
}

// 🎥 Démarrer un appel vidéo
let callStarted = false;

document.getElementById("startVideoCall").addEventListener("click", () => {
    if (!callStarted) {
        callStarted = true;
        navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then((stream) => {
                const localVideo = document.getElementById("localVideo");
                localVideo.srcObject = stream;
                localVideo.play();
                console.log("✅ Appel vidéo démarré !");
            })
            .catch((err) => {
                console.error("❌ Erreur lors de l'accès à la caméra/micro :", err);
            });
    }
});

// 🎧 Démarrer un appel audio
document.getElementById("startVoiceCall").addEventListener("click", () => {
    navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
            const audioElement = document.createElement("audio");
            audioElement.srcObject = stream;
            audioElement.play();
            console.log("✅ Appel vocal démarré !");
        })
        .catch((err) => {
            console.error("❌ Erreur lors de l'accès au microphone :", err);
        });
});

// ❌ Terminer l'appel
document.getElementById("stopCall").addEventListener("click", () => {
    const localVideo = document.getElementById("localVideo");
    const remoteVideo = document.getElementById("remoteVideo");

    if (localVideo.srcObject) {
        localVideo.srcObject.getTracks().forEach(track => track.stop());
        localVideo.srcObject = null;
    }

    if (remoteVideo.srcObject) {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
    }

    callStarted = false;
    console.log("❌ Appel terminé !");
});
