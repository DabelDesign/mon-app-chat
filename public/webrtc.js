import io from "socket.io-client";

const socket = io("https://mon-app-chat-production.up.railway.app/");

document.addEventListener("DOMContentLoaded", () => {
    const remoteVideo = document.getElementById("remote-video");
    const localVideo = document.getElementById("local-video");
    const endCallBtn = document.getElementById("end-call");
    const videoCallBtn = document.getElementById("video-call");
    const voiceCallBtn = document.getElementById("voice-call");

    if (!remoteVideo || !localVideo || !endCallBtn || !videoCallBtn || !voiceCallBtn) {
        console.error("❌ Certains éléments vidéo ou boutons ne sont pas chargés !");
        return;
    }

    videoCallBtn.addEventListener("click", () => {
        startCall({ video: true, audio: true });
    });

    voiceCallBtn.addEventListener("click", () => {
        startCall({ audio: true });
    });

    endCallBtn.addEventListener("click", () => {
        endCall();
    });

    function startCall(options) {
        navigator.mediaDevices.getUserMedia(options)
            .then((stream) => {
                localVideo.srcObject = stream;
                socket.emit("start-call", options);
                endCallBtn.style.display = "block";
            })
            .catch((error) => {
                console.error("❌ Impossible d’accéder aux médias :", error);
                alert("⚠️ Autorisation requise pour utiliser la caméra et le micro.");
            });
    }

    function endCall() {
        localVideo.style.opacity = "0";
        remoteVideo.style.opacity = "0";

        setTimeout(() => {
            if (localVideo.srcObject) {
                localVideo.srcObject.getTracks().forEach(track => track.stop());
            }

            localVideo.srcObject = null;
            remoteVideo.srcObject = null;
            socket.emit("end-call");
            endCallBtn.style.display = "none";
        }, 300);
    }

    socket.on("call-started", (options) => {
        navigator.mediaDevices.getUserMedia(options)
            .then((stream) => {
                localVideo.srcObject = stream;
                endCallBtn.style.display = "block";
            })
            .catch((error) => {
                console.error("❌ Erreur de démarrage d’appel :", error);
            });
    });

    socket.on("call-ended", () => {
        endCall();
    });
});
