const peer = new Peer(); // Création d'un identifiant unique pour chaque utilisateur
let remotePeerId = null; // Stockage de l'ID PeerJS distant

peer.on("open", (id) => {
    console.log("🟢 Connexion PeerJS établie, ID :", id);
    socket.emit("peer-id", id);
});

// Réception de l'identifiant PeerJS d'un autre utilisateur
socket.on("peer-connected", (id) => {
    console.log("🔗 Peer distant connecté :", id);
    remotePeerId = id; // Stocker l'identifiant du peer distant
});

// Déclencher un appel vidéo
document.getElementById("video-call").addEventListener("click", () => {
    if (!remotePeerId) {
        console.error("❌ Aucun Peer distant trouvé !");
        return;
    }

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            document.getElementById("local-video").srcObject = stream;
            const call = peer.call(remotePeerId, stream);
            call.on("stream", (remoteStream) => {
                document.getElementById("remote-video").srcObject = remoteStream;
            });
        })
        .catch(error => console.error("❌ Erreur d’accès à la caméra/micro :", error));
});

// Déclencher un appel vocal
document.getElementById("voice-call").addEventListener("click", () => {
    if (!remotePeerId) {
        console.error("❌ Aucun Peer distant trouvé !");
        return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
            document.getElementById("local-video").srcObject = stream;
            const call = peer.call(remotePeerId, stream);
            call.on("stream", (remoteStream) => {
                document.getElementById("remote-video").srcObject = remoteStream;
            });
        })
        .catch(error => console.error("❌ Erreur d’accès au micro :", error));
});

// Réception d'un appel entrant
peer.on("call", (call) => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            call.answer(stream); // Répondre à l'appel
            document.getElementById("local-video").srcObject = stream;
            call.on("stream", (remoteStream) => {
                document.getElementById("remote-video").srcObject = remoteStream;
            });
        })
        .catch(error => console.error("❌ Erreur d’accès à la caméra/micro :", error));
});
