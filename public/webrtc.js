const localVideo = document.getElementById("local-video");
const remoteVideo = document.getElementById("remote-video");
const endCallBtn = document.getElementById("end-call");

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
