document.addEventListener("DOMContentLoaded", () => {
    const localVideo = document.getElementById("local-video");
    const remoteVideo = document.getElementById("remote-video");
    const endCallBtn = document.getElementById("end-call");

    if (!localVideo || !remoteVideo || !endCallBtn) {
        console.error("❌ Les éléments vidéo ne sont pas encore chargés !");
        return;
    }

    document.getElementById("voice-call").addEventListener("click", () => {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
                localVideo.srcObject = stream;
                socket.emit("start-call", { stream });

                endCallBtn.hidden = false;
            });
    });

    document.getElementById("video-call").addEventListener("click", () => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                localVideo.srcObject = stream;
                socket.emit("start-call", { stream });

                endCallBtn.hidden = false;
            });
    });

    document.getElementById("end-call").addEventListener("click", () => {
        const localStream = localVideo.srcObject;
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localVideo.srcObject = null;
            remoteVideo.srcObject = null;
            socket.emit("end-call");

            endCallBtn.hidden = true;
        }
    });

    socket.on("call-started", (data) => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                localVideo.srcObject = stream;
                const call = peer.call(data.peerId, stream);

                call.on("stream", (remoteStream) => {
                    remoteVideo.srcObject = remoteStream;
                });
            });
    });

    socket.on("call-ended", () => {
        remoteVideo.srcObject = null;
        localVideo.srcObject = null;
    });
});
