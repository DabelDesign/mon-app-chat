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
        return;
    }

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            const call = peer.call(remotePeerId, stream);
            call.on("stream", (remoteStream) => {
                remoteVideo.srcObject = remoteStream;
            });

            localVideo.srcObject = stream;
        });
});

peer.on("call", (call) => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            call.answer(stream);
            call.on("stream", (remoteStream) => {
                remoteVideo.srcObject = remoteStream;
            });

            localVideo.srcObject = stream;
        });
});
