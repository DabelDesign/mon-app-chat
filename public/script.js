// Couleurs pour les utilisateurs
const colors = ["blue", "green", "red", "purple", "orange"];
const userColor = colors[Math.floor(Math.random() * colors.length)];
const username = prompt("Entrez votre pseudo :", "Anonyme");

// Connexion au serveur via WebSocket
const socket = io("http://localhost:3000", {
    transports: ["websocket", "polling"],
});

// Récupération des éléments DOM
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-btn');
const messages = document.getElementById('messages');
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const stopCallButton = document.getElementById("stopCall");
const callDuration = document.getElementById("call-duration");
const startVoiceCallIcon = document.getElementById("startVoiceCall");
const startVideoCallIcon = document.getElementById("startVideoCall");
const callMode = document.getElementById("call-mode");

sendButton.disabled = true;

// Masquer les vidéos par défaut
localVideo.style.display = "none";
remoteVideo.style.display = "none";

messageInput.addEventListener('input', () => {
    sendButton.disabled = messageInput.value.trim() === "";
});

// Envoyer des messages via le chat
sendButton.addEventListener('click', () => {
    const msg = { user: username, content: messageInput.value, color: userColor };
    if (msg.content.trim() !== '') {
        socket.emit('chat message', msg);
        messageInput.value = '';
        sendButton.disabled = true;
    }
});

// Affichage des messages reçus
socket.on('chat message', (msg) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong style="color:${msg.color}">${msg.user}:</strong> ${msg.content}`;
    messages.appendChild(li);
    messages.scrollTop = messages.scrollHeight;
});

// Variables pour les appels
let peerConnection;
let callStartTime;
let callTimerInterval;

// Créer une connexion WebRTC
function createPeerConnection() {
    peerConnection = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });

    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("candidate", event.candidate);
        }
    };
}

// Démarrer le chronomètre de l'appel
function startCallTimer() {
    callStartTime = Date.now();
    callTimerInterval = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - callStartTime) / 1000);
        callDuration.textContent = `⏳ Durée de l'appel : ${elapsedTime} sec`;
    }, 1000);
}

// Arrêter le chronomètre de l'appel
function stopCallTimer() {
    clearInterval(callTimerInterval);
    callDuration.textContent = "⏹️ Appel terminé";
}

// Initialisation de la connexion WebRTC
createPeerConnection();

// Gestion des appels vocaux
startVoiceCallIcon.addEventListener("click", async () => {
    callMode.textContent = "Mode : Vocal";
    localVideo.style.display = "none";
    remoteVideo.style.display = "none";
    startCallTimer();

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit("offer", offer);
    } catch (error) {
        console.error("❌ Erreur lors de l'accès au micro :", error);
    }
});

// Gestion des appels vidéos
startVideoCallIcon.addEventListener("click", async () => {
    callMode.textContent = "Mode : Vidéo";
    localVideo.style.display = "block";
    remoteVideo.style.display = "block";
    startCallTimer();

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        localVideo.srcObject = stream;
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit("offer", offer);
    } catch (error) {
        console.error("❌ Erreur lors de l'accès caméra/micro :", error);
    }
});

// Gestion du bouton "Terminer l'appel"
stopCallButton.addEventListener("click", () => {
    stopCallTimer();
    localVideo.style.display = "none";
    remoteVideo.style.display = "none";

    if (peerConnection) {
        peerConnection.close();
        createPeerConnection();
    }

    if (localVideo.srcObject) {
        localVideo.srcObject.getTracks().forEach(track => track.stop());
        localVideo.srcObject = null;
    }

    if (remoteVideo.srcObject) {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
    }

    socket.emit("end call");
});

// Gestion des événements reçus du serveur
socket.on("offer", async (offer) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answer", answer);
});

socket.on("answer", async (answer) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on("candidate", async (candidate) => {
    if (peerConnection.remoteDescription) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
});

socket.on("end call", () => {
    stopCallTimer();
    localVideo.style.display = "none";
    remoteVideo.style.display = "none";

    if (peerConnection) {
        peerConnection.close();
        createPeerConnection();
    }

    if (localVideo.srcObject) {
        localVideo.srcObject.getTracks().forEach(track => track.stop());
        localVideo.srcObject = null;
    }

    if (remoteVideo.srcObject) {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
    }

    console.log("🔚 Appel terminé par l'autre utilisateur.");
});
