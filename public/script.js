"use strict";

// 📡 Connexion au serveur
if (!window.socket) {
    window.socket = io("http://localhost:3000", { transports: ["websocket", "polling"] });
}

// ✅ Indicateur de connexion
const connectionStatus = document.getElementById("connection-status");
socket.on("connect", () => {
    console.log("✅ Connecté au serveur");
    connectionStatus.textContent = "🟢 Connecté";
});
socket.on("disconnect", () => {
    console.log("❌ Déconnecté du serveur");
    connectionStatus.textContent = "🔴 Déconnecté";
});

// 🔥 Suppression de `playsinline` pour Firefox
if (navigator.userAgent.includes("Firefox")) {
    document.querySelectorAll("video").forEach(video => {
        video.removeAttribute("playsinline");
    });
    console.log("🛠 Correction : playsinline supprimé pour Firefox.");
}

// 💬 Envoi des messages
document.getElementById("send-btn").addEventListener("click", () => {
    const messageInput = document.getElementById("message-input");
    const message = messageInput.value.trim();

    if (message !== "") {
        console.log("📤 Message envoyé au serveur :", message);
        socket.emit("chat message", message);
        messageInput.value = "";
    }
});

// ✅ Affichage des messages reçus
socket.on("chat message", (msg) => {
    console.log("📥 Message affiché dans le chat :", msg);
    const messageList = document.getElementById("messages");
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

// 🎤 Démarrer l'appel vidéo
document.getElementById("startVideoCall").addEventListener("click", async () => {
    console.log("📹 Démarrage de l'appel vidéo...");
    
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = stream;
    
    peerConnection = new RTCPeerConnection(config);
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit("candidate", event.candidate);
        }
    };

    peerConnection.ontrack = event => {
        remoteVideo.srcObject = event.streams[0];
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("offer", offer);

    document.getElementById("stopCall").disabled = false; // ✅ Activation du bouton
});

// ✅ Démarrer l'appel vocal
document.getElementById("startVoiceCall").addEventListener("click", async () => {
    console.log("🎤 Démarrage de l'appel vocal...");
    
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioElement.srcObject = stream; // ✅ Attacher l’audio
    
    peerConnection = new RTCPeerConnection(config);
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit("candidate", event.candidate);
        }
    };

    peerConnection.ontrack = event => {
        audioElement.srcObject = event.streams[0]; // ✅ Lire l’audio
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("offer", offer);

    document.getElementById("stopCall").disabled = false; // ✅ Activation du bouton
});

// ❌ Terminer l'appel
document.getElementById("stopCall").addEventListener("click", () => {
    if (peerConnection) {
        console.log("❌ Fin de l'appel, fermeture de WebRTC...");
        
        peerConnection.close();
        peerConnection = null;

        if (localVideo.srcObject) {
            localVideo.srcObject.getTracks().forEach(track => track.stop());
            localVideo.srcObject = null;
        }

        if (remoteVideo.srcObject) {
            remoteVideo.srcObject.getTracks().forEach(track => track.stop());
            remoteVideo.srcObject = null;
        }

        if (audioElement.srcObject) {
            audioElement.srcObject.getTracks().forEach(track => track.stop()); // ✅ Arrêt du son
            audioElement.srcObject = null;
        }

        socket.emit("end-call"); // ✅ Envoi d'un signal de fin d’appel
        document.getElementById("stopCall").disabled = true;
    }
});

// 🔍 Gestion des candidats ICE
socket.on("candidate", async (candidate) => {
    if (peerConnection && peerConnection.remoteDescription) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("✅ Candidat ICE ajouté :", candidate);
    } else {
        console.warn("⚠️ La description distante est null, attente d'une réponse SDP...");
    }
});

// ✅ Réception de l'offre et réponse
socket.on("offer", async (offer) => {
    peerConnection = new RTCPeerConnection(config);
    
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = stream;
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit("candidate", event.candidate);
        }
    };

    peerConnection.ontrack = event => {
        remoteVideo.srcObject = event.streams[0];
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answer", answer);

    document.getElementById("stopCall").disabled = false; // ✅ Activation du bouton
});

// ✅ Réception de la réponse
socket.on("answer", async (answer) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

// ✅ Gestion de la fin d'appel côté réception
socket.on("end-call", () => {
    console.log("🔇 Fin de l'appel distant.");
    if (audioElement.srcObject) {
        audioElement.srcObject.getTracks().forEach(track => track.stop());
        audioElement.srcObject = null;
    }
});
