const socket = io();

const sendButton = document.getElementById('send-btn');
const messageInput = document.getElementById('message-input');
const messagesContainer = document.getElementById('messages');

// Envoie un message au serveur
sendButton.addEventListener('click', () => {
    const message = messageInput.value;
    if (message.trim() !== '') {
        socket.emit('chat message', message);
        messageInput.value = '';
    }
});

// Affiche les messages reçus
socket.on('chat message', (msg) => {
    const newMessage = document.createElement('li');
    newMessage.textContent = msg;
    messagesContainer.appendChild(newMessage);
});
