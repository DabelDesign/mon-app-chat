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

// Gestion de l'envoi de messages textuels
sendButton.addEventListener('click', () => {
    const msg = { user: username, content: messageInput.value, color: userColor };
    if (msg.content.trim() !== '') {
        socket.emit('chat message', msg);
        messageInput.value = '';
    }
});

socket.on('chat message', (msg) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong style="color:${msg.color}">${msg.user}:</strong> ${msg.content}`;
    messages.appendChild(li);
    messages.scrollTop = messages.scrollHeight;
});

// Gestion des appels WebRTC
const peerConnection = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
        localVideo.srcObject = stream;
        localVideo.pause(); // Empêcher la lecture automatique
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    })
    .catch(error => console.error("Erreur accès caméra/micro :", error));

peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
};

document.getElementById("startCall").addEventListener("click", async () => {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("offer", offer);
});

document.getElementById("stopCall").addEventListener("click", () => {
    if (localVideo.srcObject) {
        localVideo.srcObject.getTracks().forEach(track => track.stop());
        localVideo.srcObject = null;
    }
    if (remoteVideo.srcObject) {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
    }

    peerConnection.close();
    console.log("Appel terminé.");
});

// Gestion des messages vocaux avec correction
let mediaRecorder;
let audioChunks = [];

navigator.mediaDevices.getUserMedia({ audio: true })
    .then((stream) => {
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (event) => {
            if (mediaRecorder.state === "inactive") {
                audioChunks.push(event.data);
                const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
                socket.emit("voice message", audioBlob);
            }
        };

        recordButton.addEventListener("click", () => {
            if (mediaRecorder.state === "recording") {
                mediaRecorder.stop();
                recordButton.textContent = "🎤 Enregistrer";
            } else {
                audioChunks = [];
                mediaRecorder.start();
                recordButton.textContent = "🛑 Stop";
            }
        });
    })
    .catch(error => console.error("Erreur accès au micro :", error));

socket.on("voice message", (audioBlob) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audioElement = document.createElement("audio");
    audioElement.src = audioUrl;
    audioElement.controls = true;
    document.body.appendChild(audioElement);
});
