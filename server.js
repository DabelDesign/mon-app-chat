require('dotenv').config();
const express = require('express');
const http = require('http');
const compression = require('compression');
const helmet = require('helmet');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    transports: ['websocket'],
    pingInterval: 25000,
    pingTimeout: 5000,
});

// Middleware
app.use(compression());
app.use(helmet());
app.use(express.static('public', {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) res.setHeader('Content-Type', 'text/css; charset=utf-8');
        if (path.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        if (path.endsWith('.html')) res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
}));

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chatDB', {
    
}).then(() => console.log('Connecté à MongoDB'))
  .catch(err => console.error('Erreur MongoDB :', err));
// Modèle de données
const messageSchema = new mongoose.Schema({
    user: { type: String, required: true, maxlength: 50 },
    color: { type: String, required: true },
    content: { type: String, required: true, maxlength: 500 },
    timestamp: { type: Date, default: Date.now },
});
const Message = mongoose.model('Message', messageSchema);

// Socket.io
io.on('connection', async (socket) => {
    console.log('Utilisateur connecté');
    try {
        const messages = await Message.find().limit(50).sort({ timestamp: -1 });
        socket.emit('previous messages', messages.reverse());
    } catch (err) {
        console.error('Erreur lors de la récupération des messages :', err);
    }

    socket.on('chat message', async (data) => {
        try {
            const newMessage = new Message(data);
            await newMessage.save();
            io.emit('chat message', data);
        } catch (err) {
            console.error('Erreur lors de l\'enregistrement du message :', err);
        }
    });

    socket.on('disconnect', () => console.log('Utilisateur déconnecté'));
});

// Lancement du serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serveur en écoute sur http://localhost:${PORT}`));
