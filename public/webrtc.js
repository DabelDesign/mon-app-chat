const localVideo = document.getElementById("local-video");
const remoteVideo = document.getElementById("remote-video");
const endCallBtn = document.getElementById("end-call");

document.getElementById("video-call").addEventListener("click", () => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            localVideo.srcObject = stream;
            socket.emit("start-call", { stream });

            endCallBtn.hidden = false; // Afficher le bouton rouge
        });
});

document.getElementById("voice-call").addEventListener("click", () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
            localVideo.srcObject = stream;
            socket.emit("start-call", { stream });

            endCallBtn.hidden = false; // Afficher le bouton rouge
        });
});

document.getElementById("end-call").addEventListener("click", () => {
    const localStream = localVideo.srcObject;
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localVideo.srcObject = null;
        remoteVideo.srcObject = null;
        socket.emit("end-call");

        endCallBtn.hidden = true; // Cacher le bouton rouge
    }
});

socket.on("incoming-call", (data) => {
    remoteVideo.srcObject = data.stream;
});

socket.on("call-ended", () => {
    remoteVideo.srcObject = null;
    endCallBtn.hidden = true; // Cacher le bouton rouge
});
