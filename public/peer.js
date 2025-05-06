import Peer from "peerjs";
import io from "socket.io-client";

// 🔹 Initialisation de Socket.IO
const socket = io("https://mon-app-chat-production.up.railway.app/");

socket.on("connect", () => console.log("✅ Connecté à Socket.IO"));
socket.on("connect_error", (err) => handleError("Socket.IO", err));

const remoteVideo = document.getElementById("remote-video");
const localVideo = document.getElementById("local-video");

if (!remoteVideo || !localVideo) {
    throw new Error("❌ Les éléments vidéo ne sont pas disponibles !");
}

// 🔹 Fonction de gestion des erreurs
function handleError(source, err) {
    console.error(`❌ [${source}] Erreur :`, err);
    alert(`Erreur détectée (${source}) : ${err.message}`);
}

// 🔹 Initialisation de PeerJS avec serveur TURN sécurisé
const peer = new Peer({
    config: {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "turn:your-secure-turn-server.com", username: "your-username", credential: "your-password" }
        ]
    }
});

peer.on("open", (id) => {
    console.log(`🟢 Connexion PeerJS établie, ID : ${id}`);
    socket.emit("peer-id", id);
});

peer.on("error", (err) => handleError("PeerJS", err));

let activeCall = null;

// 🔹 Mise à jour de la liste des utilisateurs
socket.on("user-list", (users) => {
    const userList = document.getElementById("user-list");
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

// 🔹 Fonction pour démarrer un appel
function startCall(remoteId, options) {
    if (!remoteId) {
        console.error("❌ Aucun ID PeerJS pour l’appel !");
        return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("❌ WebRTC non supporté par votre navigateur !");
        return;
    }

    navigator.mediaDevices.getUserMedia(options)
        .then((stream) => {
            localVideo.srcObject = stream;
            activeCall = peer.call(remoteId, stream);

            activeCall.on("stream", (remoteStream) => {
                remoteVideo.srcObject = remoteStream;
                toggleCallButtons(true);
            });

            activeCall.on("close", () => {
                console.log("🔴 L'appel a été terminé !");
                endCall();
            });

            activeCall.on("error", (err) => handleError("PeerJS Call", err));
        })
        .catch((err) => handleError("Accès aux médias", err));
}

// 🔹 Activation dynamique des boutons d’appel
document.getElementById("video-call").addEventListener("click", () => {
    const recipient = document.getElementById("user-list").value;
    if (!recipient) {
        alert("❌ Sélectionne un utilisateur avant l’appel !");
        return;
    }
    startCall(recipient, { video: true, audio: true });
});

document.getElementById("voice-call").addEventListener("click", () => {
    const recipient = document.getElementById("user-list").value;
    if (!recipient) {
        alert("❌ Sélectionne un utilisateur avant l’appel !");
        return;
    }
    startCall(recipient, { audio: true });
});

// 🔹 Fonction pour gérer les boutons d’appel
function toggleCallButtons(state) {
    document.getElementById("video-call").disabled = state;
    document.getElementById("voice-call").disabled = state;
    document.getElementById("end-call").style.display = state ? "block" : "none";
}

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
    toggleCallButtons(false);

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
