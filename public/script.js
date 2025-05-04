const socket = io("https://mon-app-chat-production.up.railway.app/");

socket.on("connect", () => console.log("✅ Connecté à Socket.IO"));

const peer = new Peer({
    config: {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "turn:numb.viagenie.ca", username: "webrtc@live.com", credential: "muazkh" }
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

    Object.entries(users).forEach(([id, username]) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = username;
        userList.appendChild(option);
    });

    console.log("🟢 Liste des utilisateurs mise à jour :", users);
});

// 🔹 Vérification avant appel
function verifyPeerId(remoteId) {
    if (!remoteId || remoteId.length < 5) {
        console.error("❌ ID PeerJS invalide !");
        return false;
    }
    console.log(`📞 Tentative de connexion avec Peer : ${remoteId}`);
    return true;
}

// 🔹 Fonction générique pour démarrer un appel
function startCall(remoteId, options) {
    if (!verifyPeerId(remoteId)) return;

    navigator.mediaDevices.getUserMedia(options)
        .then((stream) => {
            document.getElementById("local-video").srcObject = stream;
            const call = peer.call(remoteId, stream);

            call.on("stream", (remoteStream) => {
                document.getElementById("remote-video").srcObject = remoteStream;
                document.getElementById("end-call").style.display = "block";
            });

            call.on("close", () => {
                console.log("🔴 L'appel a été terminé !");
                endCall();
            });

            call.on("error", (err) => console.error("❌ Erreur PeerJS :", err));
        })
        .catch((err) => console.error("❌ Erreur d’accès aux médias :", err));
}

document.getElementById("video-call").addEventListener("click", () => {
    const recipient = document.getElementById("user-list").value;
    if (!verifyPeerId(recipient)) return alert("❌ Sélectionne un utilisateur avant l’appel !");
    startCall(recipient, { video: true, audio: true });
});

document.getElementById("voice-call").addEventListener("click", () => {
    const recipient = document.getElementById("user-list").value;
    if (!verifyPeerId(recipient)) return alert("❌ Sélectionne un utilisateur avant l’appel !");
    startCall(recipient, { audio: true });
});

// 🔹 Fonction pour raccrocher correctement les appels
function endCall() {
    if (peer) {
        peer.destroy();
        console.log("🔴 Appel terminé !");
    }

    document.getElementById("local-video").srcObject = null;
    document.getElementById("remote-video").srcObject = null;
    document.getElementById("end-call").style.display = "none";

    socket.emit("end-call");
}

document.getElementById("end-call").addEventListener("click", endCall);

socket.on("call-ended", () => {
    console.log("🔴 Fin d’appel détectée !");
    endCall();
});

// 🔹 Gestion des messages et fichiers
document.getElementById("send-button").addEventListener("click", async () => {
    const messageInput = document.getElementById("message-input");
    const fileInput = document.getElementById("file-input");

    const message = messageInput.value.trim();
    const file = fileInput.files[0];

    if (message || file) {
        const data = { type: "text", content: message };

        if (file) {
            try {
                const formData = new FormData();
                formData.append("file", file);
                const response = await fetch("/upload", { method: "POST", body: formData });
                const result = await response.json();
                data.type = "file";
                data.fileUrl = result.fileUrl;
                data.fileName = file.name;
            } catch (error) {
                console.error("❌ Erreur d’envoi du fichier :", error);
                return;
            }
        }

        socket.emit("message", data);
        messageInput.value = "";
        fileInput.value = "";
    }
});

// 🔹 Réception des messages
socket.on("message", (msg) => {
    const chatBox = document.getElementById("chat-box");
    const messageElement = document.createElement("div");

    messageElement.innerHTML = msg.type === "text"
        ? msg.content
        : `<a href="${msg.fileUrl}" download="${msg.fileName}">📎 ${msg.fileName}</a>`;

    chatBox.appendChild(messageElement);
});
