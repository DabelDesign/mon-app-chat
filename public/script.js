// Initialiser Socket.IO
const socket = io('https://mon-app-chat-production.up.railway.app');

// Gérer les appels
document.getElementById('startVoiceCall').addEventListener('click', () => {
    socket.emit('start vocal call');
    console.log('Appel vocal démarré');
});

document.getElementById('startVideoCall').addEventListener('click', () => {
    socket.emit('start video call');
    console.log('Appel vidéo démarré');
});

document.getElementById('stopCall').addEventListener('click', () => {
    socket.emit('end call');
    console.log('Appel terminé');
});

// Gérer les messages
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendMessage");

// Activer/désactiver le bouton en fonction du contenu du champ
messageInput.addEventListener("input", () => {
    sendButton.disabled = messageInput.value.trim() === ""; // Désactive si vide
});

// Gestionnaire d'envoi
sendButton.addEventListener("click", () => {
    const message = messageInput.value.trim();
    if (message !== "") {
        socket.emit("chat message", message); // Émet le message via Socket.IO
        console.log("Message envoyé :", message);
        messageInput.value = ""; // Réinitialise le champ
        sendButton.disabled = true; // Désactive le bouton après envoi
    }
});


// Réception des messages
socket.on('chat message', (msg) => {
    console.log('Nouveau message reçu :', msg);
});
