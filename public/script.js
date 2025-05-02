// 🔹 Vérification que PeerJS et Socket.IO sont chargés globalement
const Peer = window.Peer;
const socket = window.io("https://mon-app-chat-production.up.railway.app/");

socket.on("connect", () => {
    console.log("✅ Connecté à Socket.IO");
});

const peer = new Peer();

peer.on("open", (id) => {
    console.log("🟢 Connexion PeerJS établie, ID :", id);
    socket.emit("peer-id", id);
});

peer.on("error", (err) => {
    console.error("❌ Erreur PeerJS :", err);
});

// 🔹 Envoi et réception des messages
document.getElementById("send-button").addEventListener("click", () => {
    const recipient = document.getElementById("user-list").value;
    const message = document.getElementById("message-input").value.trim();
    
    if (message && recipient) {
        socket.emit("private-message", { to: recipient, message });
        document.getElementById("message-input").value = "";
    }
});

socket.on("private-message", ({ from, message }) => {
    const chatBox = document.getElementById("chat-box");
    const messageElement = document.createElement("div");
    messageElement.textContent = `De ${from}: ${message}`;
    chatBox.appendChild(messageElement);
});

// 🔹 Gestion des appels vidéo
document.getElementById("video-call").addEventListener("click", () => {
    const recipient = document.getElementById("user-list").value;
    if (!recipient) {
        console.error("❌ Aucun utilisateur sélectionné pour l’appel !");
        return;
    }

    startPrivateVideoCall(recipient);
});

function startPrivateVideoCall(remoteId) {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            document.getElementById("local-video").srcObject = stream;
            const call = peer.call(remoteId, stream);
            call.on("stream", (remoteStream) => {
                document.getElementById("remote-video").srcObject = remoteStream;
                document.getElementById("end-call").style.display = "block";
            });

            call.on("error", (err) => {
                console.error("❌ Erreur lors de l’appel PeerJS :", err);
            });
        })
        .catch((err) => console.error("❌ Erreur d’accès à la caméra/micro :", err));
}

document.getElementById("end-call").addEventListener("click", () => {
    const localStream = document.getElementById("local-video").srcObject;
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        document.getElementById("local-video").srcObject = null;
        document.getElementById("remote-video").srcObject = null;
        socket.emit("end-call");
    }
    document.getElementById("end-call").style.display = "none";
});

socket.on("call-ended", () => {
    document.getElementById("remote-video").srcObject = null;
    document.getElementById("local-video").srcObject = null;
    document.getElementById("end-call").style.display = "none";
});
