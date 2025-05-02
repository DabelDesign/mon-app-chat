const socket = io("https://mon-app-chat-production.up.railway.app/");

socket.on("connect", () => {
    console.log("✅ Connecté à Socket.IO");
});

const peer = new Peer();

peer.on("open", (id) => {
    console.log(`🟢 Connexion PeerJS établie, ID : ${id}`);
    socket.emit("peer-id", id);
});

peer.on("error", (err) => {
    console.error("❌ Erreur PeerJS :", err);
});

// 🔹 Enregistrement du pseudo
document.getElementById("set-username").addEventListener("click", () => {
    const username = document.getElementById("username-input").value.trim();
    if (username) {
        socket.emit("set-username", username);
    }
});

socket.on("user-list", (users) => {
    const userList = document.getElementById("user-list");
    userList.innerHTML = "";

    Object.values(users).forEach((username) => {
        const option = document.createElement("option");
        option.value = username;
        option.textContent = username;
        userList.appendChild(option);
    });

    console.log("🟢 Liste des utilisateurs mise à jour :", users);
});

// 🔹 Envoi de messages et fichiers
document.getElementById("send-button").addEventListener("click", async () => {
    const recipient = document.getElementById("user-list").value;
    const message = document.getElementById("message-input").value.trim();
    const file = document.getElementById("file-input").files[0];

    if (message || file) {
        const data = { type: "text", content: message };

        if (file) {
            console.log(`📎 Fichier sélectionné : ${file.name}`);
        }

        socket.emit("private-message", { to: recipient, message: data });
    }
});

socket.on("private-message", ({ from, message }) => {
    const chatBox = document.getElementById("chat-box");
    const messageElement = document.createElement("div");

    messageElement.textContent = `De ${from}: ${message.content}`;
    chatBox.appendChild(messageElement);
});

// 🔹 Gestion des appels vidéo et vocaux
peer.on("call", (call) => {
    console.log("📞 Appel entrant détecté !");
});
document.getElementById("video-call").addEventListener("click", () => {
    const recipient = document.getElementById("user-list").value;

    if (!recipient || recipient.trim() === "") {
        alert("❌ Sélectionne un utilisateur avant de lancer l’appel !");
        console.error("❌ Aucun utilisateur sélectionné pour l’appel !");
        return;
    }

    console.log(`📞 Tentative d'appel vidéo vers : ${recipient}`);
    startPrivateVideoCall(recipient);
});

function startPrivateVideoCall(remoteId) {
    if (!remoteId) {
        console.error("❌ Erreur : aucun ID PeerJS pour l’appel !");
        return;
    }

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            console.log("🎥 Caméra et micro détectés !");
            document.getElementById("local-video").srcObject = stream;
            console.log(`📞 Envoi de l'appel PeerJS vers : ${remoteId}`);
            const call = peer.call(remoteId, stream);
            
            call.on("stream", (remoteStream) => {
                document.getElementById("remote-video").srcObject = remoteStream;
                document.getElementById("end-call").style.display = "block";
            });

            call.on("error", (err) => {
                console.error("❌ Erreur PeerJS pendant l’appel :", err);
            });
        })
        .catch((err) => console.error("❌ Erreur d’accès à la caméra/micro :", err));
}

peer.on("call", (call) => {
    console.log("📞 Appel entrant détecté !");
});
document.getElementById("voice-call").addEventListener("click", () => {
    const recipient = document.getElementById("user-list").value;
    
    if (!recipient || recipient.trim() === "") {
        alert("❌ Sélectionne un utilisateur avant de passer un appel vocal !");
        console.error("❌ Aucun utilisateur sélectionné !");
        return;
    }

    console.log(`📞 Tentative d'appel vocal vers : ${recipient}`);
    startPrivateVoiceCall(recipient);
});

function startPrivateVoiceCall(remoteId) {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
            console.log("🎙️ Micro détecté !");
            const call = peer.call(remoteId, stream);
            
            call.on("stream", (remoteStream) => {
                console.log("🎧 Audio reçu !");
            });

            call.on("error", (err) => {
                console.error("❌ Erreur PeerJS lors de l'appel vocal :", err);
            });
        })
        .catch((err) => console.error("❌ Erreur d’accès au micro :", err));
}
