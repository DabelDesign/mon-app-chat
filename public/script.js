const socket = io("https://mon-app-chat-production.up.railway.app/");

document.addEventListener("DOMContentLoaded", () => {
    const usernameInput = document.getElementById("username-input");
    const setUsernameBtn = document.getElementById("set-username");
    const userList = document.getElementById("user-list");
    const remoteVideo = document.getElementById("remote-video");
    const localVideo = document.getElementById("local-video");
    const endCallBtn = document.getElementById("end-call");
    const recordButton = document.getElementById("record-button");
    const sendButton = document.getElementById("send-button");
    const messageInput = document.getElementById("message-input");
    const chatBox = document.getElementById("chat-box");

    if (!usernameInput || !setUsernameBtn || !userList || !remoteVideo || !localVideo || !endCallBtn || !recordButton || !sendButton || !messageInput || !chatBox) {
        console.error("❌ Certains éléments ne sont pas chargés !");
        return;
    }

    const peer = new Peer();

    setUsernameBtn.addEventListener("click", () => {
        const username = usernameInput.value.trim();
        if (username) {
            socket.emit("set-username", username);
        }
    });

    socket.on("user-list", (users) => {
        userList.innerHTML = "";
        Object.values(users).forEach((username) => {
            const option = document.createElement("option");
            option.value = username;
            option.textContent = username;
            userList.appendChild(option);
        });
    });

    sendButton.addEventListener("click", () => {
        const recipient = userList.value;
        const message = messageInput.value.trim();
        
        if (message && recipient) {
            socket.emit("private-message", { to: recipient, message });
            messageInput.value = "";
        }
    });

    socket.on("private-message", ({ from, message }) => {
        const messageElement = document.createElement("div");
        messageElement.textContent = `De ${from}: ${message}`;
        messageElement.classList.add("message");

        chatBox.appendChild(messageElement);
    });
});
