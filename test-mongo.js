require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ Connexion réussie à MongoDB"))
.catch(err => console.error("❌ Erreur de connexion :", err));
