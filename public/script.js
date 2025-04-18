const socket = io({ transports: ['websocket'] });
let mediaRecorder;
let localStream;
let recordedAudioBlob = null;

// Sélection des éléments du DOM
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-btn');
const hangupAudioButton = document.getElementById('hangup-audio-btn');
const hangupVideoButton = document.getElementById('hangup-btn');

// Envoi des messages textuels
sendButton.addEventListener('click', () => {
    const content = messageInput.value.trim();
    if (content) {
        const data = { user: "Anonyme", color: "black", content };
        socket.emit('chat message', data);
        messageInput.value = ''; // Réinitialisation du champ
    }
});

// Réception des messages textuels
socket.on('chat message', (data) => {
    const newMessage = document.createElement('li');
    newMessage.textContent = `${data.user}: ${data.content}`;
    document.getElementById('messages').appendChild(newMessage);
});

// Enregistrement des messages vocaux
document.getElementById('record-btn').addEventListener('click', async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (event) => {
        recordedAudioBlob = event.data;
        alert('Audio enregistré. Prêt à être envoyé.');
    };
    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), 5000);
});

// Envoi des messages vocaux
document.getElementById('send-audio-btn').addEventListener('click', () => {
    if (recordedAudioBlob) {
        socket.emit('voice message', recordedAudioBlob);
        alert('Message vocal envoyé !');
        recordedAudioBlob = null;
    } else {
        alert('Veuillez d\'abord enregistrer un message vocal.');
    }
});

// Réception des messages vocaux
socket.on('voice message', (audioBlob) => {
    const audio = new Audio(URL.createObjectURL(audioBlob));
    audio.controls = true;
    document.getElementById('messages').appendChild(audio);
});

// Appels audio
document.getElementById('call-btn').addEventListener('click', async () => {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    alert('Appel audio commencé.');
    socket.emit('call initiated', 'audio');

    // Afficher le bouton raccrocher audio
    hangupAudioButton.classList.remove('hidden');
});

// Raccrocher l'appel audio
hangupAudioButton.addEventListener('click', () => {
    if (localStream) {
        localStream.getTracks().forEach(track => {
            if (track.kind === 'audio') track.stop();
        });
        alert('Appel audio terminé.');
    }

    // Cacher le bouton raccrocher audio
    hangupAudioButton.classList.add('hidden');
});

// Appels vidéo
document.getElementById('video-call-btn').addEventListener('click', async () => {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const video = document.createElement('video');
    video.srcObject = localStream;
    video.play();
    document.body.appendChild(video);
    alert('Appel vidéo commencé.');
    socket.emit('call initiated', 'video');

    // Afficher le bouton raccrocher vidéo
    hangupVideoButton.classList.remove('hidden');
});

// Raccrocher l'appel vidéo
hangupVideoButton.addEventListener('click', () => {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        alert('Appel vidéo terminé.');
    }

    // Cacher le bouton raccrocher vidéo
    hangupVideoButton.classList.add('hidden');
});
