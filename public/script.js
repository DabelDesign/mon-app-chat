"use strict";

// 📡 Connexion au serveur (Railway-friendly)
const socket = io("https://mon-app-chat.railway.app", { transports: ["websocket", "polling"], reconnection: true });

// ✅ Indicateur de connexion
const connectionStatus = document.getElementById("connection-status");
socket.on("connect", () => {
    console.log("✅ Connecté au serveur");
    connectionStatus.textContent = "🟢 Connecté";
});
socket.on("disconnect", () => {
    console.warn("❌ Déconnecté du serveur, tentative de reconnexion...");
    connectionStatus.textContent = "🔴 Déconnecté";
});

// 💬 Gestion du chat
const messageInput = document.getElementById("message-input");
const messageList = document.getElementById("messages");

document.getElementById("send-btn").addEventListener("click", () => {
    const message = messageInput.value.trim();
    if (message !== "") {
        socket.emit("chat message", message);
        messageInput.value = "";
    }
});

socket.on("chat message", (msg) => {
    const newMessage = document.createElement("li");
    newMessage.textContent = msg;
    messageList.appendChild(newMessage);
    messageList.scrollTop = messageList.scrollHeight;
});
