import Peer from "peerjs";
import io from "socket.io-client";

// 🔹 Initialisation de Socket.IO
const socket = io("https://mon-app-chat-production.up.railway.app/");
socket.on("connect", () => console.log("✅ Connecté à Socket.IO"));
socket.on("connect_error", (err) => console.error("❌ Erreur de connexion à Socket.IO :", err));

document.addEventListener("DOMContentLoaded", () => {
    const remoteVideo = document.getElementById("remote-video");
    const localVideo = document.getElementById("local-video");
    const endCallBtn = document.getElementById("end-call");

    if (!remoteVideo || !localVideo || !endCallBtn) {
        console.error("❌ Les éléments vidéo ne sont pas encore chargés !");
    } else {
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

        document.getElementById("video-call").addEventListener("click", () => {
            if (!remotePeerId) {
                console.error("❌ Aucun Peer distant trouvé !");
            } else {
                startVideoCall(remotePeerId);
                endCallBtn.hidden = false; // ✅ Affichage du bouton "Terminer Appel"
            }
        });

        document.getElementById("voice-call").addEventListener("click", () => {
            if (!remotePeerId) {
                console.error("❌ Aucun Peer distant trouvé !");
            } else {
                startVoiceCall(remotePeerId);
                endCallBtn.hidden = false; // ✅ Affichage du bouton "Terminer Appel"
            }
        });

        endCallBtn.addEventListener("click", () => {
            terminateCall();
        });
    }
});

function startVideoCall(remoteId) {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            document.getElementById("local-video").srcObject = stream;
            const call = peer.call(remoteId, stream);
            call.on("stream", (remoteStream) => {
                document.getElementById("remote-video").srcObject = remoteStream;
            });
        })
        .catch((err) => console.error("❌ Erreur d'accès à la caméra/micro :", err));
}

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

function terminateCall() {
    const localStream = document.getElementById("local-video").srcObject;
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        document.getElementById("local-video").srcObject = null;
        document.getElementById("remote-video").srcObject = null;
        socket.emit("end-call");
    }
    document.getElementById("end-call").hidden = true; // ✅ Cache le bouton après la fin de l'appel
}
