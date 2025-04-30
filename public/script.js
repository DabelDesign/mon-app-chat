document.getElementById("send-button").addEventListener("click", () => {
    const messageInput = document.getElementById("message-input");
    const fileInput = document.getElementById("file-input");

    const message = messageInput.value.trim();
    const file = fileInput.files[0];

    if (message || file) {
        const data = { type: "text", content: message };

        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                data.type = "file";
                data.fileContent = reader.result;
                data.fileName = file.name;
                socket.emit("message", data);
            };
            reader.readAsDataURL(file);
        } else {
            socket.emit("message", data);
        }

        messageInput.value = "";
        fileInput.value = "";
    }
});

socket.on("message", (msg) => {
    const chatBox = document.getElementById("chat-box");
    const messageElement = document.createElement("div");

    if (msg.type === "text") {
        messageElement.textContent = msg.content;
    } else if (msg.type === "file") {
        messageElement.innerHTML = `<a href="${msg.fileContent}" download="${msg.fileName}">📎 ${msg.fileName}</a>`;
    }

    chatBox.appendChild(messageElement);
});
