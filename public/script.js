import Peer from "peerjs";
import io from "socket.io-client";

const socket = io("https://mon-app-chat-production.up.railway.app/");

socket.on("connect", () => {
    console.log("✅ Connecté à Socket.IO");
});

const peer = new Peer();

peer.on("open", (id) => {
    console.log("🟢 Connexion PeerJS établie, ID :", id);
    socket.emit("peer-id", id);
});

document.getElementById("set-username").addEventListener("click", () => {
    const username = document.getElementById("username-input").value.trim();
    if (username) {
        socket.emit("set-username", username);
    }
});

// 🔹 Envoi et réception des messages
document.getElementById("send-button").addEventListener("click", () => {
    const recipient = document.getElementById("user-list").value;
    const message = document.getElementById("message-input").value.trim();
    
    if (message && recipient) {
        socket.emit("private-message", { to: recipient, message });
        document.getElementById("message-input").value = "";
    }
});

socket.on("private-message", ({ from, message }) => {
    const chatBox = document.getElementById("chat-box");
    const messageElement = document.createElement("div");
    messageElement.textContent = `De ${from}: ${message}`;
    chatBox.appendChild(messageElement);
});
