import Peer from "peerjs";
import io from "socket.io-client";

// 🔹 Initialisation de Socket.IO
const socket = io("https://mon-app-chat-production.up.railway.app/");

socket.on("connect", () => console.log("✅ Connecté à Socket.IO"));

socket.on("connect_error", (err) => console.error("❌ Erreur de connexion à Socket.IO :", err));

// 🔹 Vérification des éléments vidéo
const remoteVideo = document.getElementById("remote-video");
const localVideo = document.getElementById("local-video");
const userList = document.getElementById("user-list");

if (!remoteVideo || !localVideo || !userList) {
    throw new Error("❌ Certains éléments vidéo ou la liste des utilisateurs ne sont pas disponibles !");
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

peer.on("error", (err) => console.error("❌ Erreur PeerJS :", err));

let activeCall = null;

// 🔹 Mise à jour de la liste des utilisateurs
socket.on("user-list", (users) => {
    console.log("🔄 Mise à jour de la liste des utilisateurs :", users);
    userList.innerHTML = "";

    if (!users || Object.keys(users).length === 0) {
        console.warn("⚠️ Aucun utilisateur connecté !");
        userList.disabled = true;
        return;
    }

    userList.disabled = false;
    Object.entries(users).forEach(([id, username]) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = username;
        userList.appendChild(option);
    });

    console.log("🟢 Liste des utilisateurs mise à jour :", users);
});

// 🔹 Activation dynamique des boutons d’appel
userList.addEventListener("change", (event) => {
    const callButtons = document.querySelectorAll("#video-call, #voice-call");
    callButtons.forEach((btn) => btn.disabled = !event.target.value);
});

// 🔹 Fonction pour démarrer un appel
function startCall(remoteId, options) {
    if (!remoteId) {
        console.error("❌ Aucun ID PeerJS pour l’appel !");
        return;
    }

    navigator.mediaDevices.getUserMedia(options)
        .then((stream) => {
            localVideo.srcObject = stream;
            activeCall = peer.call(remoteId, stream, { metadata: { video: options.video } });

            activeCall.on("stream", (remoteStream) => {
                remoteVideo.srcObject = remoteStream;
                document.getElementById("end-call").style.display = "block";
            });

            activeCall.on("close", () => {
                console.log("🔴 L'appel a été terminé !");
                endCall();
            });

            activeCall.on("error", (err) => console.error("❌ Erreur PeerJS :", err));
        })
        .catch((err) => console.error("❌ Erreur d’accès aux médias :", err));
}

// 🔹 Gestion des appels entrants
peer.on("call", (call) => {
    console.log("📞 Appel entrant détecté !");
    navigator.mediaDevices.getUserMedia(call.metadata.video ? { video: true, audio: true } : { audio: true })
        .then((stream) => {
            call.answer(stream);
            localVideo.srcObject = stream;

            call.on("stream", (remoteStream) => {
                remoteVideo.srcObject = remoteStream;
            });

            call.on("close", () => {
                console.log("🔴 L'appel entrant a été terminé !");
                endCall();
            });
        })
        .catch((err) => console.error("❌ Erreur d’accès aux médias :", err));
});

// 🔹 Boutons d’appel
document.getElementById("video-call").addEventListener("click", () => {
    const recipient = userList.value;
    if (!recipient) {
        alert("❌ Sélectionne un utilisateur avant l’appel !");
        return;
    }
    startCall(recipient, { video: true, audio: true });
});

document.getElementById("voice-call").addEventListener("click", () => {
    const recipient = userList.value;
    if (!recipient) {
        alert("❌ Sélectionne un utilisateur avant l’appel !");
        return;
    }
    startCall(recipient, { audio: true });
});

// 🔹 Raccrochage des appels
function endCall() {
    if (activeCall) {
        activeCall.close();
        console.log("🔴 Fermeture de l’appel actif !");
    }

    peer.disconnect();
    console.log("🔴 Déconnexion de PeerJS !");

    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
    document.getElementById("end-call").style.display = "none";

    socket.emit("end-call");
}

document.getElementById("end-call").addEventListener("click", () => {
    console.log("🔴 Bouton \"Raccrocher\" cliqué !");
    endCall();
});

socket.on("call-ended", () => {
    console.log("🔴 Fin d’appel détectée !");
    endCall();
});
