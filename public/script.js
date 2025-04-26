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

// 🔥 Correction Firefox pour `playsinline`
document.querySelectorAll("video").forEach(video => {
    video.removeAttribute("playsinline");
});

// 💬 Gestion du chat
const messageInput = document.getElementById("message-input");
const messageList = document.getElementById("messages");

document.getElementById("send-btn").addEventListener("click", () => {
    const message = messageInput.value.trim();
    if (message !== "") {
        console.log("📤 Message envoyé :", message);
        socket.emit("chat message", message);
        messageInput.value = "";
    }
});

socket.on("chat message", (msg) => {
    const newMessage = document.createElement("li");
    newMessage.textContent = msg;
    messageList.appendChild(newMessage);
    messageList.scrollTop = messageList.scrollHeight; // ✅ Scroll automatique
});

// 🎥 **Gestion des appels WebRTC**
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const audioElement = document.getElementById("audioElement");

let peerConnection;
const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

// 🔥 Initialisation de WebRTC
const initWebRTC = async (audioOnly = false) => {
    const constraints = audioOnly ? { audio: true } : { video: true, audio: true };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    if (!audioOnly) localVideo.srcObject = stream;
    else audioElement.srcObject = stream;

    peerConnection = new RTCPeerConnection(config);
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

    peerConnection.onicecandidate = event => {
        if (event.candidate) socket.emit("candidate", event.candidate);
    };

    peerConnection.ontrack = event => {
        if (!audioOnly) remoteVideo.srcObject = event.streams[0];
        else audioElement.srcObject = event.streams[0];
    };

    return stream;
};

// 🎤 **Démarrer un appel**
const startCall = async (audioOnly = false) => {
    console.log(audioOnly ? "🎤 Démarrage appel vocal..." : "📹 Démarrage appel vidéo...");
    await initWebRTC(audioOnly);

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("offer", offer);
    document.getElementById("stopCall").disabled = false;
};

document.getElementById("startVideoCall").addEventListener("click", () => startCall(false));
document.getElementById("startVoiceCall").addEventListener("click", () => startCall(true));

// ❌ **Terminer un appel**
document.getElementById("stopCall").addEventListener("click", () => {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
        [localVideo, remoteVideo, audioElement].forEach(el => {
            if (el.srcObject) {
                el.srcObject.getTracks().forEach(track => track.stop());
                el.srcObject = null;
            }
        });
        socket.emit("end-call");
        document.getElementById("stopCall").disabled = true;
        console.log("❌ Appel terminé.");
    }
});

// 🔍 **Gestion des candidats ICE**
socket.on("candidate", async (candidate) => {
    if (peerConnection && peerConnection.remoteDescription) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
});

// ✅ **Réception de l’offre WebRTC**
socket.on("offer", async (offer) => {
    await initWebRTC();
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answer", answer);
    document.getElementById("stopCall").disabled = false;
});

// ✅ **Réception de la réponse WebRTC**
socket.on("answer", async (answer) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

// ✅ **Gestion de la fin d’appel**
socket.on("end-call", () => {
    console.log("🔇 Fin d’appel signalée.");
    [audioElement, remoteVideo].forEach(el => {
        if (el.srcObject) {
            el.srcObject.getTracks().forEach(track => track.stop());
            el.srcObject = null;
        }
    });
});
