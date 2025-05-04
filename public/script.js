const socket = io("https://mon-app-chat-production.up.railway.app/");

socket.on("connect", () => console.log("✅ Connecté à Socket.IO"));

const peer = new Peer({
    config: {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "turn:relay.backups.cz", username: "webrtc", credential: "webrtc" }
        ]
    }
});

peer.on("open", (id) => {
    console.log(`🟢 Connexion PeerJS établie, ID : ${id}`);
    socket.emit("peer-id", id);
});

peer.on("error", (err) => console.error("❌ Erreur PeerJS :", err));

// 🔹 Enregistrement du pseudo
document.getElementById("set-username").addEventListener("click", () => {
    const username = document.getElementById("username-input").value.trim();
    if (username) socket.emit("set-username", username);
});

socket.on("user-list", (users) => {
    const userList = document.getElementById("user-list");
    userList.innerHTML = "";

    Object.values(users).forEach((username) => {
        const option = document.createElement("option");
        option.value = username;
        option.textContent = username;
        userList.appendChild(option);
    });

    console.log("🟢 Liste des utilisateurs mise à jour :", users);
});

// 🔹 Envoi de messages
document.getElementById("send-button").addEventListener("click", async () => {
    const recipient = document.getElementById("user-list").value;
    const message = document.getElementById("message-input").value.trim();
    const file = document.getElementById("file-input").files[0];

    if (message || file) {
        const data = { type: "text", content: message };
        if (file) console.log(`📎 Fichier sélectionné : ${file.name}`);
        socket.emit("private-message", { to: recipient, message: data });
    }
});

socket.on("private-message", ({ from, message }) => {
    const chatBox = document.getElementById("chat-box");
    const messageElement = document.createElement("div");
    messageElement.textContent = `De ${from}: ${message.content}`;
    chatBox.appendChild(messageElement);
});

// 🔹 Gestion des appels
function startCall(remoteId, options) {
    if (!remoteId) {
        console.error("❌ Aucun ID PeerJS pour l’appel !");
        return;
    }

    navigator.mediaDevices.getUserMedia(options)
        .then((stream) => {
            console.log("🎥 Média détecté !");
            document.getElementById("local-video").srcObject = stream;
            const call = peer.call(remoteId, stream);

            call.on("stream", (remoteStream) => {
                document.getElementById("remote-video").srcObject = remoteStream;
                document.getElementById("end-call").style.display = "block";
            });

            call.on("error", (err) => console.error("❌ Erreur PeerJS :", err));
        })
        .catch((err) => console.error("❌ Erreur d’accès aux médias :", err));
}

document.getElementById("video-call").addEventListener("click", () => startCall(
    document.getElementById("user-list").value, { video: true, audio: true }
));

document.getElementById("voice-call").addEventListener("click", () => startCall(
    document.getElementById("user-list").value, { audio: true }
));

document.getElementById("end-call").addEventListener("click", () => {
    peer.disconnect();
    console.log("🔴 Appel terminé !");
    document.getElementById("local-video").srcObject = null;
    document.getElementById("remote-video").srcObject = null;
    document.getElementById("end-call").style.display = "none";
    socket.emit("end-call");
});
