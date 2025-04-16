const socket = io({
    transports: ['websocket'], // Force uniquement l'utilisation de WebSocket
});

// Ajouter un pseudonyme et une couleur à l'utilisateur
const user = prompt("Entrez votre pseudonyme :") || "Anonyme";
const userColor = prompt("Choisissez une couleur (par exemple, 'red', 'blue', 'green') :") || "black";

const sendButton = document.getElementById('send-btn');
const messageInput = document.getElementById('message-input');
const messagesContainer = document.getElementById('messages');

// Fonction pour obtenir l'heure actuelle
function getTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// Fonction pour ajouter des messages avec l'heure et la couleur
function addMessage(data, isSelf = false) {
    const newMessage = document.createElement('li');
    newMessage.style.color = data.color; // Appliquer la couleur
    const timestamp = document.createElement('span');
    timestamp.textContent = ` (${getTimestamp()})`; // Ajout de l'heure
    timestamp.style.fontSize = '0.8em';
    timestamp.style.color = '#888';
    timestamp.style.marginLeft = '10px';

    newMessage.textContent = `${data.user}: ${data.content}`;
    newMessage.appendChild(timestamp);

    if (isSelf) {
        newMessage.classList.add('self');
    }
    messagesContainer.appendChild(newMessage);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Notifications visuelles et sonores
    if (!isSelf) {
        if (document.hidden) {
            document.title = 'Nouveau message !';
        }
        const audio = new Audio('/notification.mp3');
        audio.play();
    }
}

// Envoyer un message
sendButton.addEventListener('click', () => {
    const content = messageInput.value.trim();
    if (content !== '') {
        const data = { user, color: userColor, content };
        addMessage(data, true); // Ajouter le message avec les détails localement
        socket.emit('chat message', data); // Envoyer au serveur
        messageInput.value = '';
    }
});

// Réception des anciens messages
socket.on('previous messages', (messages) => {
    messages.forEach(msg => addMessage(msg));
});

// Réception des nouveaux messages depuis le serveur
socket.on('chat message', (data) => {
    addMessage(data);
});

// Réinitialiser le titre quand l'utilisateur revient
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        document.title = 'Chat App';
    }
});
