import io from "socket.io-client";

console.log("📡 Vérification Peer :", typeof Peer);
if (typeof Peer === "undefined") {
    console.error("❌ PeerJS n'est pas chargé correctement !");
} else {
    // Initialisation de PeerJS
    const peer = new Peer();

    peer.on("open", (id) => {
        console.log("🟢 Connexion PeerJS établie, ID :", id);

        // Initialisation de Socket.IO
        const socket = io("https://mon-app-chat-production.up.railway.app");

        socket.on("connect", () => {
            console.log("🔗 Connexion Socket.IO établie !");
            socket.emit("peer-id", id);
        });

        socket.on("peer-connected", (remoteId) => {
            console.log("🔗 Peer distant connecté :", remoteId);
            remotePeerId = remoteId;
        });

        let remotePeerId = null;

        document.getElementById("video-call").addEventListener("click", () => {
            if (!remotePeerId) {
                console.error("❌ Aucun Peer distant trouvé !");
                return;
            }

            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then((stream) => {
                    const call = peer.call(remotePeerId, stream);
                    call.on("stream", (remoteStream) => {
                        document.getElementById("remote-video").srcObject = remoteStream;
                    });

                    document.getElementById("local-video").srcObject = stream;
                }).catch((err) => console.error("❌ Erreur lors de la capture du flux :", err));
        });

        peer.on("call", (call) => {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then((stream) => {
                    call.answer(stream);
                    call.on("stream", (remoteStream) => {
                        document.getElementById("remote-video").srcObject = remoteStream;
                    });

                    document.getElementById("local-video").srcObject = stream;
                }).catch((err) => console.error("❌ Erreur lors de la capture du flux :", err));
        });
    });
}
