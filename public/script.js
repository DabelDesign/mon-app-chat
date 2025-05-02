const socket = io("https://mon-app-chat-production.up.railway.app/");

document.addEventListener("DOMContentLoaded", () => {
    const remoteVideo = document.getElementById("remote-video");
    const localVideo = document.getElementById("local-video");
    const endCallBtn = document.getElementById("end-call");
    const recordButton = document.getElementById("record-button");
    const sendButton = document.getElementById("send-button");
    const messageInput = document.getElementById("message-input");
    const chatBox = document.getElementById("chat-box");
    const userList = document.getElementById("user-list"); // ✅ Liste des utilisateurs

    if (!remoteVideo || !localVideo || !endCallBtn || !recordButton || !sendButton || !messageInput || !chatBox || !userList) {
        console.error("❌ Certains éléments ne sont pas chargés !");
        return;
    }

    const peer = new Peer();
    let remotePeerId = null;

    peer.on("open", (id) => {
        console.log("🟢 Connexion PeerJS établie, ID :", id);
        socket.emit("peer-id", id);
    });

    // 🔹 Mise à jour de la liste des utilisateurs connectés
    socket.on("user-list", (users) => {
        userList.innerHTML = "";
        users.forEach((userId) => {
            const option = document.createElement("option");
            option.value = userId;
            option.textContent = `Utilisateur ${userId}`;
            userList.appendChild(option);
        });
    });

    // 🔹 Envoi des messages privés
    sendButton.addEventListener("click", () => {
        const recipientId = userList.value;
        const message = messageInput.value.trim();
        
        if (message && recipientId) {
            socket.emit("private-message", { to: recipientId, message });
            messageInput.value = ""; // ✅ Vide le champ après envoi
        }
    });

    socket.on("private-message", ({ from, message }) => {
        const messageElement = document.createElement("div");
        messageElement.textContent = `De ${from}: ${message}`;
        messageElement.classList.add("message");

        chatBox.appendChild(messageElement); // ✅ Ajoute le message privé à la boîte de discussion
    });

    // 🔹 Appels vidéo/vocaux privés
    document.getElementById("video-call").addEventListener("click", () => {
        const recipientId = userList.value;
        if (recipientId) {
            startPrivateVideoCall(recipientId);
        }
    });

    document.getElementById("voice-call").addEventListener("click", () => {
        const recipientId = userList.value;
        if (recipientId) {
            startPrivateVoiceCall(recipientId);
        }
    });

    endCallBtn.addEventListener("click", () => {
        terminateCall();
    });
});

// 🔹 Fonctions d'appel privé
function startPrivateVideoCall(remoteId) {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            document.getElementById("local-video").srcObject = stream;
            const call = peer.call(remoteId, stream);
            call.on("stream", (remoteStream) => {
                document.getElementById("remote-video").srcObject = remoteStream;
                document.getElementById("end-call").style.display = "block";
            });
        })
        .catch((err) => console.error("❌ Erreur d'accès à la caméra/micro :", err));
}

function startPrivateVoiceCall(remoteId) {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
            const call = peer.call(remoteId, stream);
            call.on("stream", (remoteStream) => {
                const audio = new Audio();
                audio.srcObject = remoteStream;
                audio.play();
                document.getElementById("end-call").style.display = "block";
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
    document.getElementById("end-call").style.display = "none";
}
