// 🔹 Initialisation de Socket.IO
const socket = io("https://mon-app-chat-production.up.railway.app/");

document.addEventListener("DOMContentLoaded", () => {
    const remoteVideo = document.getElementById("remote-video");
    const localVideo = document.getElementById("local-video");
    const endCallBtn = document.getElementById("end-call");

    if (!remoteVideo || !localVideo || !endCallBtn) {
        console.error("❌ Les éléments vidéo ne sont pas chargés !");
    } else {
        document.getElementById("video-call").addEventListener("click", () => {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then((stream) => {
                    localVideo.srcObject = stream;
                    socket.emit("start-call", { stream });
                    endCallBtn.style.display = "block"; // ✅ Afficher le bouton "Terminer Appel"
                });
        });

        document.getElementById("voice-call").addEventListener("click", () => {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then((stream) => {
                    socket.emit("start-call", { stream });
                    endCallBtn.style.display = "block"; // ✅ Afficher le bouton "Terminer Appel"
                });
        });

        endCallBtn.addEventListener("click", () => {
            const localStream = localVideo.srcObject;
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
                localVideo.srcObject = null;
                remoteVideo.srcObject = null;
                socket.emit("end-call");
            }
            endCallBtn.style.display = "none"; // ✅ Cacher après avoir raccroché
        });

        socket.on("call-started", (data) => {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then((stream) => {
                    localVideo.srcObject = stream;
                    endCallBtn.style.display = "block"; // ✅ S'assurer que le bouton apparaît
                });
        });

        socket.on("call-ended", () => {
            remoteVideo.srcObject = null;
            localVideo.srcObject = null;
            endCallBtn.style.display = "none"; // ✅ Cacher après la fin de l’appel
        });
    }
});