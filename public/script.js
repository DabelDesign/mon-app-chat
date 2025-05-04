const socket = io("https://mon-app-chat-production.up.railway.app/");

socket.on("connect", () => console.log("✅ Connecté à Socket.IO"));

const peer = new Peer({
    config: {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "turn:numb.viagenie.ca", username: "webrtc@live.com", credential: "muazkh" }
        ]
    }
});

peer.on("open", (id) => {
    console.log(`🟢 Connexion PeerJS établie, ID : ${id}`);
    socket.emit("peer-id", id);
});

peer.on("error", (err) => console.error("❌ Erreur PeerJS :", err));

let activeCall = null;

// 🔹 Mise à jour de la liste des utilisateurs
socket.on("user-list", (users) => {
    console.log("🔄 Utilisateurs reçus :", users);

    const userList = document.getElementById("user-list");
    userList.innerHTML = ""; // 🔄 Vide la liste avant de la mettre à jour
    userList.disabled = false; // ✅ Active la sélection des utilisateurs

    Object.entries(users).forEach(([id, username]) => {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = username;
        userList.appendChild(option);
    });

    console.log("🟢 Liste des utilisateurs mise à jour :", users);
});

// 🔹 Fonction pour démarrer un appel
function startCall(remoteId, options) {
    if (!remoteId) {
        console.error("❌ Aucun ID PeerJS pour l’appel !");
        return;
    }

    navigator.mediaDevices.getUserMedia(options)
        .then((stream) => {
            document.getElementById("local-video").srcObject = stream;
            activeCall = peer.call(remoteId, stream);

            activeCall.on("stream", (remoteStream) => {
                document.getElementById("remote-video").srcObject = remoteStream;
                document.getElementById("end-call").style.display = "block";
            });

            activeCall.on("close", () => {
                console.log("🔴 L'appel a été terminé !");
                endCall();
            });

            activeCall.on("error", (err) => console.error("❌ Erreur PeerJS :", err));
        })
        .catch((err) => console.error("❌ Erreur d’accès aux médias :", err));
}

// 🔹 Raccrochage des appels
function endCall() {
    if (activeCall) {
        activeCall.close();
        console.log("🔴 Fermeture de l’appel actif !");
    }

    peer.disconnect();
    console.log("🔴 Déconnexion de PeerJS !");
    
    document.getElementById("local-video").srcObject = null;
    document.getElementById("remote-video").srcObject = null;
    document.getElementById("end-call").style.display = "none";

    socket.emit("end-call");
}

document.getElementById("end-call").addEventListener("click", () => {
    console.log("🔴 Bouton \"Raccrocher\" cliqué !");
    endCall();
});

socket.on("call-ended", () => {
    console.log("🔴 Fin d’appel détectée !");
    endCall();
});
