const socket = io("https://mon-app-chat-production.up.railway.app/");

document.addEventListener("DOMContentLoaded", () => {
    const remoteVideo = document.getElementById("remote-video");
    const localVideo = document.getElementById("local-video");
    const endCallBtn = document.getElementById("end-call");

    if (!remoteVideo || !localVideo || !endCallBtn) {
        console.error("❌ Les éléments vidéo ne sont pas chargés !");
        return;
    }

    document.getElementById("video-call").addEventListener("click", () => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                localVideo.srcObject = stream;
                socket.emit("start-call", { type: "video" });
                endCallBtn.style.display = "block";
            })
            .catch((error) => {
                console.error("❌ Impossible d'accéder à la caméra/micro :", error);
                alert("⚠️ Veuillez autoriser l'accès à votre caméra et micro.");
            });
    });

    document.getElementById("voice-call").addEventListener("click", () => {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
                socket.emit("start-call", { type: "audio" });
                endCallBtn.style.display = "block";
            })
            .catch((error) => {
                console.error("❌ Erreur d’accès au micro :", error);
            });
    });

    endCallBtn.addEventListener("click", () => {
        endCall();
    });

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

    socket.on("call-started", () => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                localVideo.srcObject = stream;
                endCallBtn.style.display = "block";
            });
    });

    socket.on("call-ended", () => {
        endCall();
    });
});
