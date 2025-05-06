const io = require("socket.io-client");  // ✅ Correction pour CommonJS
const socket = io("https://mon-app-chat-production.up.railway.app/");

document.addEventListener("DOMContentLoaded", () => {
    const remoteVideo = document.getElementById("remote-video");
    const localVideo = document.getElementById("local-video");
    const endCallBtn = document.getElementById("end-call");
    const videoCallBtn = document.getElementById("video-call");
    const voiceCallBtn = document.getElementById("voice-call");

    if (!remoteVideo || !localVideo || !endCallBtn || !videoCallBtn || !voiceCallBtn) {
        handleError("DOM", "Certains éléments vidéo ou boutons ne sont pas chargés !");
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

    function handleError(source, err) {
        console.error(`❌ [${source}] Erreur :`, err);
        alert(`⚠️ Erreur détectée (${source}) : ${err.message || err}`);
    }

    function startCall(options) {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            handleError("WebRTC", "WebRTC non supporté par votre navigateur !");
            return;
        }

        navigator.mediaDevices.getUserMedia(options)
            .then((stream) => {
                localVideo.srcObject = stream;
                socket.emit("start-call", options);
                toggleCallButtons(true);
            })
            .catch((error) => handleError("Accès médias", error));
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
            toggleCallButtons(false);
        }, 300);
    }

    function toggleCallButtons(state) {
        videoCallBtn.disabled = state;
        voiceCallBtn.disabled = state;
        endCallBtn.style.display = state ? "block" : "none";
    }

    socket.on("call-started", (options) => {
        navigator.mediaDevices.getUserMedia(options)
            .then((stream) => {
                localVideo.srcObject = stream;
                toggleCallButtons(true);
            })
            .catch((error) => handleError("Démarrage appel", error));
    });

    socket.on("call-ended", () => {
        endCall();
    });
});
