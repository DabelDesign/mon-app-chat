require("dotenv").config();
const mongoose = require("mongoose");

// 🔹 Vérification que MONGODB_URI est bien défini
if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI n'est pas défini dans .env !");
    process.exit(1);
}

// 🔹 Connexion à MongoDB avec gestion avancée des erreurs
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ Connexion réussie à MongoDB"))
.catch(err => {
    console.error("❌ Erreur de connexion :", err);
    process.exit(1); // Arrête l'exécution si la connexion échoue
});

// 🔹 Gestion des événements MongoDB
mongoose.connection.on("error", (err) => {
    console.error("❌ Erreur MongoDB détectée :", err);
});

mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ Déconnexion de MongoDB détectée !");
});

mongoose.connection.on("connected", () => {
    console.log("🔄 Reconnexion à MongoDB réussie !");
});
