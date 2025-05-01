import Peer from "peerjs";
import io from "socket.io-client";

// 🔹 Initialisation de Socket.IO
const socket = io("https://mon-app-chat-production.up.railway.app/");
socket.on("connect", () => console.log("✅ Connecté à Socket.IO"));
socket.on("connect_error", (err) => console.error("❌ Erreur de connexion à Socket.IO :", err));

document.addEventListener("DOMContentLoaded", () => {
    const remoteVideo = document.getElementById("remote-video");
    const localVideo = document.getElementById("local-video");

    if (!remoteVideo || !localVideo) {
        console.error("❌ Les éléments vidéo ne sont pas chargés !");
        return;
    }

    const peer = new Peer();
    let remotePeerId = null;

    peer.on("open", (id) => {
        console.log("🟢 Connexion PeerJS établie, ID :", id);
        socket.emit("peer-id", id);
    });

    socket.on("peer-connected", (id) => {
        console.log("🔗 Peer distant connecté :", id);
        remotePeerId = id;
    });

    // 🔹 Fonction pour démarrer un appel vidéo
    function startVideoCall(remoteId) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                localVideo.srcObject = stream;
                const call = peer.call(remoteId, stream);
                call.on("stream", (remoteStream) => {
                    remoteVideo.srcObject = remoteStream;
                });
            })
            .catch((err) => console.error("❌ Erreur d'accès à la caméra/micro :", err));
    }

    // 🔹 Fonction pour démarrer un appel vocal (sans vidéo)
    function startVoiceCall(remoteId) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
                const call = peer.call(remoteId, stream);
                call.on("stream", (remoteStream) => {
                    const audio = new Audio();
                    audio.srcObject = remoteStream;
                    audio.play();
                });
            })
            .catch((err) => console.error("❌ Erreur d'accès au micro :", err));
    }

    document.getElementById("video-call").addEventListener("click", () => {
        if (!remotePeerId) {
            console.error("❌ Aucun Peer distant trouvé !");
            return;
        }
        startVideoCall(remotePeerId);
    });

    document.getElementById("voice-call").addEventListener("click", () => {
        if (!remotePeerId) {
            console.error("❌ Aucun Peer distant trouvé !");
            return;
        }
        startVoiceCall(remotePeerId);
    });

    peer.on("call", (call) => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                call.answer(stream);
                localVideo.srcObject = stream;
                call.on("stream", (remoteStream) => {
                    remoteVideo.srcObject = remoteStream;
                });
            })
            .catch((err) => console.error("❌ Erreur d'accès à la caméra/micro :", err));
    });

    // 🔹 Fonction d'enregistrement et d'envoi des messages vocaux
    let mediaRecorder;
    document.getElementById("record-button").addEventListener("click", () => {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();

            mediaRecorder.ondataavailable = (event) => {
                const audioFile = new Blob([event.data], { type: "audio/mp3" });
                const formData = new FormData();
                formData.append("file", audioFile);

                fetch("/upload", { method: "POST", body: formData })
                    .then((res) => res.json())
                    .then((data) => socket.emit("message", { type: "audio", fileUrl: data.fileUrl }))
                    .catch((err) => console.error("❌ Erreur d'enregistrement vocal :", err));
            };

            setTimeout(() => {
                mediaRecorder.stop();
            }, 5000);
        });
    });

    // 🔹 Gestion de l'envoi de messages texte et fichiers
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
                    const response = await fetch("/upload", { method: "POST", body: formData });
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

    // 🔹 Réception des messages et affichage
    socket.on("message", (msg) => {
        const chatBox = document.getElementById("chat-box");
        const messageElement = document.createElement("div");

        if (msg.type === "text") {
            messageElement.textContent = msg.content;
        } else if (msg.type === "file") {
            messageElement.innerHTML = `<a href="${msg.fileUrl}" download="${msg.fileName}">📎 ${msg.fileName}</a>`;
        } else if (msg.type === "audio") {
            messageElement.innerHTML = `<audio controls><source src="${msg.fileUrl}" type="audio/mp3"></audio>`;
        }

        chatBox.appendChild(messageElement);
    });
});
