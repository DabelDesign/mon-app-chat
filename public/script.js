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

let peerConnection;

function createPeerConnection() {
    peerConnection = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });

    peerConnection.ontrack = (event) => {
        console.log("📡 Flux vidéo reçu !");
        remoteVideo.srcObject = event.streams[0];

        if (remoteVideo.srcObject) {
            console.log("✅ Vidéo distante affichée !");
        }
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("candidate", event.candidate);
            console.log("🔍 Candidat ICE envoyé :", event.candidate);
        }
    };
}

createPeerConnection();

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
        localVideo.srcObject = stream;
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    })
    .catch(error => console.error("❌ Erreur accès caméra/micro :", error));

document.getElementById("startCall").addEventListener("click", async () => {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("offer", offer);
    console.log("📞 Appel lancé !");
});

document.getElementById("stopCall").addEventListener("click", () => {
    if (peerConnection) {
        peerConnection.close();
        console.log("❌ Appel terminé.");
        createPeerConnection(); // Réinitialiser la connexion
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
    console.log("✅ Réponse WebRTC envoyée !");
});

socket.on("answer", async (answer) => {
    if (peerConnection.signalingState !== "stable") {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        console.log("🔁 Réponse WebRTC appliquée !");
    }
});

socket.on("candidate", (candidate) => {
    console.log("🔄 Candidat ICE reçu :", candidate);
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

// Gestion des messages vocaux
let mediaRecorder;

navigator.mediaDevices.getUserMedia({ audio: true })
    .then((stream) => {
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
            if (mediaRecorder.state === "inactive") {
                socket.emit("voice message", event.data);
            }
        };

        recordButton.addEventListener("click", () => {
            if (mediaRecorder.state === "recording") {
                mediaRecorder.stop();
            } else {
                mediaRecorder.start();
            }
        });
    });

socket.on("voice message", (audioData) => {
    const audioBlob = new Blob([audioData], { type: "audio/webm" });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audioElement = document.createElement("audio");
    audioElement.src = audioUrl;
    audioElement.controls = true;
    document.getElementById("chat-container").appendChild(audioElement);
});
