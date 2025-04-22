const colors = ["blue", "green", "red", "purple", "orange"];
const userColor = colors[Math.floor(Math.random() * colors.length)];
const username = prompt("Entrez votre pseudo :", "Anonyme");

const socket = io("http://localhost:3000", {
    transports: ["websocket", "polling"],
});

const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-btn');
const messages = document.getElementById('messages');
const recordButton = document.getElementById("record");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const stopCallButton = document.getElementById("stopCall");
const callDuration = document.getElementById("call-duration");

sendButton.disabled = true;

messageInput.addEventListener('input', () => {
    sendButton.disabled = messageInput.value.trim() === "";
});

sendButton.addEventListener('click', () => {
    const msg = { user: username, content: messageInput.value, color: userColor };
    console.log("📤 Envoi du message :", msg);
    if (msg.content.trim() !== '') {
        socket.emit('chat message', msg);
        messageInput.value = '';
        sendButton.disabled = true;
    }
});

socket.on('chat message', (msg) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong style="color:${msg.color}">${msg.user}:</strong> ${msg.content}`;
    messages.appendChild(li);
    messages.scrollTop = messages.scrollHeight;
});

let peerConnection;
let callStartTime;
let callTimerInterval;

function createPeerConnection() {
    peerConnection = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });

    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("candidate", event.candidate);
        }
    };
}

function startCallTimer() {
    callStartTime = Date.now();
    callTimerInterval = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - callStartTime) / 1000);
        callDuration.textContent = `⏳ Durée de l'appel : ${elapsedTime} sec`;
    }, 1000);
}

function stopCallTimer() {
    clearInterval(callTimerInterval);
    callDuration.textContent = "⏹️ Appel terminé";
}

createPeerConnection();

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
        localVideo.srcObject = stream;
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    })
    .catch(error => console.error("❌ Erreur lors de l'accès caméra/micro :", error));

document.getElementById("startCall").addEventListener("click", async () => {
    startCallTimer();
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("offer", offer);
});

document.getElementById("stopCall").addEventListener("click", () => {
    stopCallTimer();

    if (peerConnection) {
        peerConnection.close();
        createPeerConnection();
    }

    if (localVideo.srcObject) {
        localVideo.srcObject.getTracks().forEach(track => track.stop());
        localVideo.srcObject = null;
    }

    if (remoteVideo.srcObject) {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
    }
});

socket.on("offer", async (offer) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answer", answer);
});

socket.on("answer", async (answer) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on("candidate", async (candidate) => {
    if (peerConnection.remoteDescription) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
        console.warn("🚨 Remote description non définie.");
    }
});
