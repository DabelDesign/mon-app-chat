import Peer from "peerjs";
import io from "socket.io-client";

// 🔹 Initialisation de Socket.IO
const socket = io("https://mon-app-chat-production.up.railway.app/");

socket.on("connect", () => console.log("✅ Connecté à Socket.IO"));
socket.on("connect_error", (err) => console.error("❌ Erreur de connexion à Socket.IO :", err));

// 🔹 Vérification des éléments vidéo
const remoteVideo = document.getElementById("remote-video");
const localVideo = document.getElementById("local-video");

if (!remoteVideo || !localVideo) {
    console.error("❌ Les éléments vidéo ne sont pas disponibles !");
}

// 🔹 Initialisation de PeerJS avec un serveur TURN
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

let remotePeerId = null;
socket.on("peer-connected", (id) => {
    console.log(`🔗 Peer distant connecté : ${id}`);
    remotePeerId = id;
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
            localVideo.srcObject = stream;
            const call = peer.call(remoteId, stream);

            call.on("stream", (remoteStream) => {
                remoteVideo.srcObject = remoteStream;
            });

            call.on("close", () => {
                console.log("🔴 L'appel a été terminé !");
                endCall();
            });

            call.on("error", (err) => console.error("❌ Erreur d’appel PeerJS :", err));
        })
        .catch((err) => console.error("❌ Erreur d’accès aux médias :", err));
}

// 🔹 Boutons d'appel
document.getElementById("video-call").addEventListener("click", () => {
    if (!verifyPeerId(remotePeerId)) return;
    startCall(remotePeerId, { video: true, audio: true });
});

document.getElementById("voice-call").addEventListener("click", () => {
    if (!verifyPeerId(remotePeerId)) return;
    startCall(remotePeerId, { audio: true });
});

peer.on("call", (call) => {
    console.log("📞 Appel entrant détecté !");
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            call.answer(stream);
            localVideo.srcObject = stream;
            call.on("stream", (remoteStream) => {
                remoteVideo.srcObject = remoteStream;
            });
            call.on("close", () => {
                console.log("🔴 L'appel a été terminé !");
                endCall();
            });
        })
        .catch((err) => console.error("❌ Erreur d’accès aux médias :", err));
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
