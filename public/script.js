import Peer from "peerjs";
import io from "socket.io-client";

// Initialisation de Socket.IO
const socket = io("https://mon-app-chat-production.up.railway.app/");
socket.on("connect", () => {
    console.log("✅ Connecté à Socket.IO");
});

socket.on("connect_error", (err) => {
    console.error("❌ Erreur de connexion à Socket.IO :", err);
});

// Vérification des éléments vidéo
const remoteVideo = document.getElementById("remote-video");
const localVideo = document.getElementById("local-video");

if (!remoteVideo || !localVideo) {
    console.error("❌ Les éléments vidéo ne sont pas chargés !");
    return;
}

// Gestion des appels vidéo avec PeerJS
const peer = new Peer();

peer.on("open", (id) => {
    console.log("🟢 Connexion PeerJS établie, ID :", id);
    socket.emit("peer-id", id);
});

let remotePeerId = null;
socket.on("peer-connected", (id) => {
    console.log("🔗 Peer distant connecté :", id);
    remotePeerId = id;
});

// Fonction d’appel vidéo
function startCall(remoteId) {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            localVideo.srcObject = stream;
            const call = peer.call(remoteId, stream);
            call.on("stream", (remoteStream) => {
                remoteVideo.srcObject = remoteStream;
            });
        }).catch((err) => console.error("❌ Erreur d'accès à la caméra/micro :", err));
}

document.getElementById("video-call").addEventListener("click", () => {
    if (!remotePeerId) {
        console.error("❌ Aucun Peer distant trouvé !");
        return;
    }
    startCall(remotePeerId);
});

peer.on("call", (call) => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            call.answer(stream);
            localVideo.srcObject = stream;
            call.on("stream", (remoteStream) => {
                remoteVideo.srcObject = remoteStream;
            });
        }).catch((err) => console.error("❌ Erreur d'accès à la caméra/micro :", err));
});

// Gestion de l'envoi de messages et fichiers
document.getElementById("send-button").addEventListener("click", async () => {
    const messageInput = document.getElementById("message-input");
    const fileInput = document.getElementById("file-input");

    const message = messageInput.value.trim();
    const file = fileInput.files[0];

    if (message || file) {
        const data = { type: "text", content: message };

        if (file) {
            const formData = new FormData();
            formData.append("file", file);

            try {
                const response = await fetch("/upload", {
                    method: "POST",
                    body: formData
                });

                const result = await response.json();
                data.type = "file";
                data.fileUrl = result.fileUrl;
                data.fileName = file.name;
                socket.emit("message", data);
            } catch (error) {
                console.error("❌ Erreur d'envoi du fichier :", error);
            }
        } else {
            socket.emit("message", data);
        }

        messageInput.value = "";
        fileInput.value = "";
    }
});

// Réception des messages et affichage
socket.on("message", (msg) => {
    const chatBox = document.getElementById("chat-box");
    const messageElement = document.createElement("div");

    if (msg.type === "text") {
        messageElement.textContent = msg.content;
    } else if (msg.type === "file") {
        messageElement.innerHTML = `<a href="${msg.fileUrl}" download="${msg.fileName}">📎 ${msg.fileName}</a>`;
    }

    chatBox.appendChild(messageElement);
});
