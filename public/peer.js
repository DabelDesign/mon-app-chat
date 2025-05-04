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

let activeCall = null;

socket.on("peer-connected", (id) => {
    console.log(`🔗 Peer distant connecté : ${id}`);
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
            activeCall = peer.call(remoteId, stream);

            activeCall.on("stream", (remoteStream) => {
                remoteVideo.srcObject = remoteStream;
            });

            activeCall.on("close", () => {
                console.log("🔴 L'appel a été terminé !");
                endCall();
            });

            activeCall.on("error", (err) => console.error("❌ Erreur d’appel PeerJS :", err));
        })
        .catch((err) => console.error("❌ Erreur d’accès aux médias :", err));
}

// 🔹 Raccrochage des appels
function endCall() {
    if (activeCall) {
        activeCall.close();
        console.log("🔴 Fermeture de l’appel actif !");
    }

    peer.disconnect();
    console.log("🔴 Déconnexion de PeerJS !");
    
    document.getElementById("local-video").srcObject = null;
    document.getElementById("remote-video").srcObject = null;
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

// 🔹 Réception des appels entrants
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
                console.log("🔴 L'appel entrant a été terminé !");
                endCall();
            });
        })
        .catch((err) => console.error("❌ Erreur d’accès aux médias :", err));
});
