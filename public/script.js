// ✅ Initialisation du socket
const socket = io("https://mon-app-chat-production.up.railway.app");

// ✅ Sélection des éléments HTML
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const messagesContainer = document.getElementById("messages");
const fileInput = document.getElementById("file-input");
const pinButton = document.getElementById("pin-button");
const audioButton = document.getElementById("audio-button");
const videoButton = document.getElementById("video-button");

// ✅ Fonction pour envoyer un message texte
sendButton.addEventListener("click", () => {
    const message = messageInput.value.trim();
    if (message) {
        socket.emit("sendMessage", { text: message });
        displayMessage("Moi", message);
        messageInput.value = ""; // Nettoyage du champ
    }
});

// ✅ Fonction pour afficher un message
function displayMessage(user, message) {
    const div = document.createElement("div");
    div.classList.add("message");
    div.innerHTML = `<strong>${user}:</strong> ${message}`;
    messagesContainer.appendChild(div);
}

// ✅ Écouter les messages reçus
socket.on("receiveMessage", (data) => {
    displayMessage(data.user, data.text);
});

// ✅ Fonction pour envoyer un fichier
fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file) {
        socket.emit("sendFile", { fileName: file.name });
        displayMessage("Moi", `📎 Fichier envoyé : ${file.name}`);
    }
});

// ✅ Fonction pour épingler un fichier
pinButton.addEventListener("click", () => {
    if (fileInput.files.length > 0) {
        displayMessage("Moi", `📌 Fichier épinglé : ${fileInput.files[0].name}`);
    } else {
        alert("Sélectionne un fichier avant de l'épingler !");
    }
});

// ✅ Gestion des messages vocaux (enregistrement audio)
audioButton.addEventListener("click", async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const audioChunks = [];

        recorder.ondataavailable = (event) => audioChunks.push(event.data);
        recorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
            const audioUrl = URL.createObjectURL(audioBlob);
            displayMessage("Moi", `<audio controls src="${audioUrl}"></audio>`);
            socket.emit("sendAudio", audioBlob);
        };

        recorder.start();
        setTimeout(() => recorder.stop(), 5000); // Enregistrement 5 sec
    } catch (err) {
        console.error("Erreur audio :", err);
    }
});

// ✅ Gestion des appels vocaux
videoButton.addEventListener("click", async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const video = document.createElement("video");
        video.srcObject = stream;
        video.autoplay = true;
        document.body.appendChild(video);
        socket.emit("startVideoCall", stream);
    } catch (err) {
        console.error("Erreur vidéo :", err);
    }
});

// ✅ Écoute des événements socket pour les appels
socket.on("receiveVideoCall", (stream) => {
    const video = document.createElement("video");
    video.srcObject = stream;
    video.autoplay = true;
    document.body.appendChild(video);
});
