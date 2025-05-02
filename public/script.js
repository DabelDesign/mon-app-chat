const socket = io("https://mon-app-chat-production.up.railway.app/");

socket.on("connect", () => {
    console.log("✅ Connecté à Socket.IO");
});

const peer = new Peer();

peer.on("open", (id) => {
    console.log("🟢 Connexion PeerJS établie, ID :", id);
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
            const formData = new FormData();
            formData.append("file", file);

            try {
                const response = await fetch("/upload", {
                    method: "POST",
                    body: formData
                });

                const result = await response.json();
                data.type = "file";
                data.fileUrl = result.fileUrl;
                data.fileName = file.name;
            } catch (error) {
                console.error("❌ Erreur d'envoi du fichier :", error);
            }
        }

        socket.emit("private-message", { to: recipient, message: data });
        document.getElementById("message-input").value = "";
        document.getElementById("file-input").value = "";
    }
});

socket.on("private-message", ({ from, message }) => {
    const chatBox = document.getElementById("chat-box");
    const messageElement = document.createElement("div");

    if (message.type === "text") {
        messageElement.textContent = `De ${from}: ${message.content}`;
    } else if (message.type === "file") {
        messageElement.innerHTML = `<a href="${message.fileUrl}" download="${message.fileName}">📎 ${message.fileName}</a>`;
    }

    chatBox.appendChild(messageElement);
});

// 🔹 Gestion des appels vidéo et vocaux
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

let recipient = document.getElementById("recipientInput").value;
console.log(`📞 Tentative d'appel vidéo vers : ${recipient}`); // 🔥 LOG POUR DEBUG
startPrivateVideoCall(recipient);


function startPrivateVideoCall(remoteId) {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            document.getElementById("local-video").srcObject = stream;
            const call = peer.call(remoteId, stream);
            call.on("stream", (remoteStream) => {
                document.getElementById("remote-video").srcObject = remoteStream;
                document.getElementById("end-call").style.display = "block";
            });

            call.on("error", (err) => {
                console.error("❌ Erreur lors de l’appel PeerJS :", err);
            });
        })
        .catch((err) => console.error("❌ Erreur d’accès à la caméra/micro :", err));
}

peer.on("call", (call) => {
    console.log("📞 Appel entrant détecté !");
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            call.answer(stream);
            document.getElementById("local-video").srcObject = stream;
            call.on("stream", (remoteStream) => {
                document.getElementById("remote-video").srcObject = remoteStream;
                document.getElementById("end-call").style.display = "block";
            });
        })
        .catch((err) => console.error("❌ Erreur d’accès à la caméra/micro :", err));
});
