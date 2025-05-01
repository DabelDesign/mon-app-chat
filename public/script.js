const socket = io("https://mon-app-chat-production.up.railway.app/");

document.addEventListener("DOMContentLoaded", () => {
    const remoteVideo = document.getElementById("remote-video");
    const localVideo = document.getElementById("local-video");
    const endCallBtn = document.getElementById("end-call");
    const recordButton = document.getElementById("record-button");
    const sendButton = document.getElementById("send-button");
    const messageInput = document.getElementById("message-input");
    const chatBox = document.getElementById("chat-box");

    if (!remoteVideo || !localVideo || !endCallBtn || !recordButton || !sendButton || !messageInput || !chatBox) {
        console.error("❌ Certains éléments ne sont pas chargés !");
        return;
    }

    const peer = new Peer();
    let remotePeerId = null;

    peer.on("open", (id) => {
        console.log("🟢 Connexion PeerJS établie, ID :", id);
        socket.emit("peer-id", id);
    });

    socket.on("peer-connected", (id) => {
        console.log("🔗 Peer distant connecté :", id);
        remotePeerId = id;
    });

    document.getElementById("video-call").addEventListener("click", () => {
        if (!remotePeerId) {
            console.error("❌ Aucun Peer distant trouvé !");
        } else {
            startVideoCall(remotePeerId);
        }
    });

    document.getElementById("voice-call").addEventListener("click", () => {
        if (!remotePeerId) {
            console.error("❌ Aucun Peer distant trouvé !");
        } else {
            startVoiceCall(remotePeerId);
        }
    });

    endCallBtn.addEventListener("click", () => {
        terminateCall();
    });

    // 🔹 Enregistrement des messages vocaux
    let mediaRecorder;
    recordButton.addEventListener("click", () => {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();

            mediaRecorder.ondataavailable = (event) => {
                const audioFile = new Blob([event.data], { type: "audio/mp3" });
                const formData = new FormData();
                formData.append("file", audioFile);

                fetch("/upload", { method: "POST", body: formData })
                    .then((res) => res.json())
                    .then((data) => socket.emit("message", { type: "audio", fileUrl: data.fileUrl }))
                    .catch((err) => console.error("❌ Erreur d'enregistrement vocal :", err));
            };

            setTimeout(() => {
                mediaRecorder.stop();
            }, 5000);
        });
    });

    // 🔹 Gestion des messages texte
    sendButton.addEventListener("click", () => {
        const message = messageInput.value.trim();
        if (message) {
            socket.emit("message", message);
            messageInput.value = ""; // ✅ Vide le champ après envoi
        }
    });

    socket.on("message", (message) => {
        const messageElement = document.createElement("div");
        messageElement.textContent = message;
        messageElement.classList.add("message");

        chatBox.appendChild(messageElement); // ✅ Ajoute le message à la boîte de discussion
    });
});

// 🔹 Fonctions corrigées
function startVideoCall(remoteId) {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            document.getElementById("local-video").srcObject = stream;
            const call = peer.call(remoteId, stream);
            call.on("stream", (remoteStream) => {
                document.getElementById("remote-video").srcObject = remoteStream;
                document.getElementById("end-call").style.display = "block"; // ✅ Afficher "Terminer Appel"
            });
        })
        .catch((err) => console.error("❌ Erreur d'accès à la caméra/micro :", err));
}

function startVoiceCall(remoteId) {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
            const call = peer.call(remoteId, stream);
            call.on("stream", (remoteStream) => {
                const audio = new Audio();
                audio.srcObject = remoteStream;
                audio.play();
                document.getElementById("end-call").style.display = "block"; // ✅ Afficher "Terminer Appel"
            });
        })
        .catch((err) => console.error("❌ Erreur d'accès au micro :", err));
}

function terminateCall() {
    const localStream = document.getElementById("local-video").srcObject;
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        document.getElementById("local-video").srcObject = null;
        document.getElementById("remote-video").srcObject = null;
        socket.emit("end-call");
    }
    document.getElementById("end-call").style.display = "none"; // ✅ Cacher le bouton après raccrochage
}
