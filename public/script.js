const socket = io('https://mon-app-chat-production.up.railway.app/');

let localStream;
let remoteStream;
let peerConnection;

const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

// Gestion des appels audio/vidéo
document.getElementById('startVideoCall').addEventListener('click', async () => {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    document.getElementById('localVideo').srcObject = localStream;

    socket.emit('startCall', true);
});

socket.on('startCall', async () => {
    peerConnection = new RTCPeerConnection(config);

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = (event) => {
        remoteStream = event.streams[0];
        document.getElementById('remoteVideo').srcObject = remoteStream;
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('iceCandidate', event.candidate);
        }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', offer);
});

socket.on('offer', async (offer) => {
    peerConnection = new RTCPeerConnection(config);

    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = (event) => {
        remoteStream = event.streams[0];
        document.getElementById('remoteVideo').srcObject = remoteStream;
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('iceCandidate', event.candidate);
        }
    };

    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', answer);
});

socket.on('answer', async (answer) => {
    await peerConnection.setRemoteDescription(answer);
});

socket.on('iceCandidate', async (candidate) => {
    await peerConnection.addIceCandidate(candidate);
});

// Terminer l'appel
document.getElementById('stopCall').addEventListener('click', () => {
    peerConnection.close();
    socket.emit('endCall');
    window.location.reload();
});

// Gestion des messages texte
document.getElementById('sendMessage').addEventListener('click', () => {
    const message = document.getElementById('messageInput').value;
    socket.emit('chatMessage', message);
});

socket.on('chatMessage', (message) => {
    console.log('Message reçu :', message);
});
