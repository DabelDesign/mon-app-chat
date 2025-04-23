// Définir les couleurs pour les utilisateurs
const colors = ["blue", "green", "red", "purple", "orange"];
const userColor = colors[Math.floor(Math.random() * colors.length)];

// Demander le pseudo de l'utilisateur avec validation
const username = (() => {
    let name;
    do {
        name = prompt("Entrez votre pseudo :", "Anonyme").trim();
        if (!name) {
            alert("Veuillez entrer un pseudo valide !");
        }
    } while (!name);
    return name;
})();

// Connexion au serveur via WebSocket
const socket = io("http://localhost:3000", {
    transports: ["websocket", "polling"],
});

// Vérifier la connexion au serveur
socket.on("connect", () => {
    console.log("✅ Connecté au serveur Socket.IO");
});

// Récupérer les éléments du DOM
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-btn");
const messages = document.getElementById("messages");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const stopCallButton = document.getElementById("stopCall");
const callDuration = document.getElementById("call-duration");
const startVoiceCallIcon = document.getElementById("startVoiceCall");
const startVideoCallIcon = document.getElementById("startVideoCall");
const callMode = document.getElementById("call-mode");

// Désactiver certains éléments par défaut
sendButton.disabled = true;
localVideo.style.display = "none";
remoteVideo.style.display = "none";
stopCallButton.disabled = true;

// Activer le bouton d'envoi de message lorsque du texte est saisi
messageInput.addEventListener("input", () => {
    sendButton.disabled = messageInput.value.trim() === "";
});

// Envoyer des messages dans le chat
sendButton.addEventListener("click", () => {
    const msg = {
        user: username,
        content: messageInput.value.trim(),
        color: userColor,
    };
    if (msg.content !== "") {
        console.log("Message envoyé :", msg); // Log côté client
        socket.emit("chat message", msg);
        messageInput.value = "";
        sendButton.disabled = true;
    }
});

// Afficher les messages reçus
socket.on("chat message", (msg) => {
    console.log("Message reçu côté client :", msg); // Log côté client
    const li = document.createElement("li");
    li.innerHTML = `<strong style="color:${msg.color}">${msg.user}:</strong> ${msg.content}`;
    messages.appendChild(li);
    messages.scrollTop = messages.scrollHeight; // Faire défiler automatiquement
});

// Variables pour les appels
let peerConnection;
let callStartTime;
let callTimerInterval;

// Créer une connexion WebRTC
function createPeerConnection() {
    peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0]; // Associer la vidéo distante
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log("Candidat ICE local :", event.candidate);
            socket.emit("candidate", event.candidate); // Envoyer le candidat au serveur
        }
    };

    peerConnection.addEventListener("signalingstatechange", () => {
        console.log("État de signalisation WebRTC :", peerConnection.signalingState);
    });
}

// Initialiser une connexion WebRTC
createPeerConnection();

// Démarrer le chronomètre
function startCallTimer() {
    callStartTime = Date.now();
    callTimerInterval = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - callStartTime) / 1000);
        callDuration.textContent = `⏳ Durée de l'appel : ${elapsedTime} sec`;
    }, 1000);
}

// Arrêter le chronomètre
function stopCallTimer() {
    clearInterval(callTimerInterval);
    callDuration.textContent = "⏹️ Appel terminé";
}

// Gérer les appels vocaux
startVoiceCallIcon.addEventListener("click", async () => {
    stopCallButton.disabled = false;
    callMode.textContent = "Mode : Vocal";
    localVideo.style.display = "none";
    remoteVideo.style.display = "none";

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        console.log("Offre SDP créée et envoyée :", offer); // Log côté client
        socket.emit("offer", offer);
        startCallTimer();
    } catch (error) {
        console.error("❌ Erreur lors de l'accès au micro :", error);
    }
});

// Gérer les appels vidéos
startVideoCallIcon.addEventListener("click", async () => {
    stopCallButton.disabled = false;
    callMode.textContent = "Mode : Vidéo";
    localVideo.style.display = "block";
    remoteVideo.style.display = "block";

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        localVideo.srcObject = stream;
        stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        console.log("Offre SDP créée et envoyée :", offer); // Log côté client
        socket.emit("offer", offer);
        startCallTimer();
    } catch (error) {
        console.error("❌ Erreur lors de l'accès caméra/micro :", error);
    }
});

// Gérer l'arrêt de l'appel
stopCallButton.addEventListener("click", () => {
    stopCallButton.disabled = true;
    stopCallTimer();

    localVideo.style.display = "none";
    remoteVideo.style.display = "none";

    if (peerConnection) {
        peerConnection.close();
        createPeerConnection();
    }

    socket.emit("end call");
});

// Gérer la réception des offres
socket.on("offer", async (offer) => {
    try {
        console.log("Offre SDP reçue côté client :", offer); // Vérification côté client
        if (peerConnection.signalingState === "stable") {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            console.log("Réponse SDP créée et envoyée :", answer); // Log côté client
            socket.emit("answer", answer);
        } else {
            console.warn(
                "L'état de signalisation n'est pas stable lors de la réception de l'offre :",
                peerConnection.signalingState
            );
        }
    } catch (error) {
        console.error("Erreur lors de la gestion de l'offre SDP :", error);
    }
});

// Gérer la réception des réponses SDP
socket.on("answer", async (answer) => {
    try {
        console.log("Réponse SDP reçue côté client :", answer); // Vérification côté client
        if (peerConnection.signalingState === "have-local-offer") {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        } else {
            console.warn(
                "L'état de signalisation n'est pas adapté à la réception d'une réponse :",
                peerConnection.signalingState
            );
        }
    } catch (error) {
        console.error("Erreur lors de la gestion de la réponse SDP :", error);
    }
});

// Gérer les candidats ICE
socket.on("candidate", async (candidate) => {
    try {
        console.log("Candidat ICE reçu côté client :", candidate); // Log côté client
        if (candidate) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
    } catch (error) {
        console.error("Erreur lors de l'ajout d'un candidat ICE :", error);
    }
});

// Gérer la fin de l'appel
socket.on("end call", () => {
    stopCallButton.disabled = true;
    stopCallTimer();

    if (peerConnection) {
        peerConnection.close();
        createPeerConnection();
    }

    console.log("🔚 Appel terminé par l'autre utilisateur.");
});
