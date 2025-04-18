const socket = io({
    transports: ['websocket'],
});

// Demande de pseudonyme et de couleur
const user = prompt("Entrez votre pseudonyme (max. 50 caractères) :")?.substring(0, 50) || "Anonyme";
const userColor = prompt("Choisissez une couleur CSS valide (par exemple, 'red', 'blue', '#123456') :") || "black";

const sendButton = document.getElementById('send-btn');
const messageInput = document.getElementById('message-input');
const messagesContainer = document.getElementById('messages');

// Fonction pour obtenir l'heure actuelle
function getTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// Fonction pour ajouter un message
function addMessage(data, isSelf = false) {
    const newMessage = document.createElement('li');
    newMessage.style.color = data.color;
    newMessage.textContent = `${data.user}: ${data.content}`;
    const timestamp = document.createElement('span');
    timestamp.textContent = ` (${getTimestamp()})`;
    timestamp.style.fontSize = '0.8em';
    timestamp.style.color = '#888';
    newMessage.appendChild(timestamp);

    if (isSelf) newMessage.classList.add('self');
    messagesContainer.appendChild(newMessage);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Notifications
    if (!isSelf && document.hidden) {
        document.title = 'Nouveau message !';
        const audio = new Audio('/notification.mp3');
        audio.play();
    }
}

// Envoyer un message
sendButton.addEventListener('click', () => {
    const content = messageInput.value.trim();
    if (content && content.length <= 500) {
        const data = { user, color: userColor, content };
        addMessage(data, true);
        socket.emit('chat message', data);
        messageInput.value = '';
    }
});

// Écoute des événements Socket.io
socket.on('previous messages', (messages) => messages.forEach(msg => addMessage(msg)));
socket.on('chat message', (data) => addMessage(data));

// Réinitialisation du titre
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) document.title = 'Chat App';
});
