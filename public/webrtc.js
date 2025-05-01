import io from "https://cdn.jsdelivr.net/npm/socket.io-client@4.3.2/dist/socket.io.min.js"; // ✅ Import Socket.IO via CDN

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
                    endCallBtn.hidden = false;
                });
        });

        document.getElementById("voice-call").addEventListener("click", () => {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then((stream) => {
                    socket.emit("start-call", { stream });
                    endCallBtn.hidden = false;
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
            endCallBtn.hidden = true;
        });

        socket.on("call-started", (data) => {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then((stream) => {
                    localVideo.srcObject = stream;
                });
        });

        socket.on("call-ended", () => {
            remoteVideo.srcObject = null;
            localVideo.srcObject = null;
        });
    }
});
