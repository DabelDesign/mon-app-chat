const socket = io("https://mon-app-chat-production.up.railway.app/");
document.addEventListener("DOMContentLoaded", () => {
    const remoteVideo = document.getElementById("remote-video");
    const localVideo = document.getElementById("local-video");
    const endCallBtn = document.getElementById("end-call");
    const recordButton = document.getElementById("record-button");

    if (!remoteVideo || !localVideo || !endCallBtn || !recordButton) {
        console.error("❌ Les éléments vidéo ou audio ne sont pas chargés !");
    } else {
        const peer = new Peer();
        const socket = io("https://mon-app-chat-production.up.railway.app/");
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
                endCallBtn.hidden = false; // ✅ Afficher le bouton "Terminer Appel"
            }
        });

        document.getElementById("voice-call").addEventListener("click", () => {
            if (!remotePeerId) {
                console.error("❌ Aucun Peer distant trouvé !");
            } else {
                startVoiceCall(remotePeerId);
                endCallBtn.hidden = false; // ✅ Afficher le bouton "Terminer Appel"
            }
        });

        endCallBtn.addEventListener("click", () => {
            terminateCall();
        });

        // 🔹 Enregistrement des messages vocaux
        let mediaRecorder;
        recordButton.addEventListener("click", () => {
            navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();

                mediaRecorder.ondataavailable = (event) => {
                    const audioFile = new Blob([event.data], { type: "audio/mp3" });
                    const formData = new FormData();
                    formData.append("file", audioFile);

                    fetch("/upload", { method: "POST", body: formData })
                        .then((res) => res.json())
                        .then((data) => socket.emit("message", { type: "audio", fileUrl: data.fileUrl }))
                        .catch((err) => console.error("❌ Erreur d'enregistrement vocal :", err));
                };

                setTimeout(() => {
                    mediaRecorder.stop();
                }, 5000);
            });
        });
    }
});
