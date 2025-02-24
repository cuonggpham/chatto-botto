document.addEventListener("DOMContentLoaded", () => {
    const chatArea = document.getElementById('chatArea');
    const questionInput = document.getElementById('questionInput');
    const sendButton = document.getElementById('sendButton');

    questionInput.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    });

    sendButton.addEventListener('click', sendMessage);

    async function sendMessage() {
        const question = questionInput.value.trim();
        if (!question) return;

        appendMessage("Bạn", question, "user-message");
        questionInput.value = "";

        const aiMessageElem = appendMessage("AI", '<span class="typing">...</span>', "ai-message");

        try {
            const response = await fetch('/api/v1/conversation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: question })
            });

            if (!response.ok) {
                throw new Error("Không thể kết nối với server!");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let partialData = '';
            let isFirstChunk = true;

            async function read() {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    partialData += decoder.decode(value, { stream: true });

                    const events = partialData.split("\n\n");
                    partialData = events.pop();
                    events.forEach(eventStr => {
                        if (eventStr.trim()) {
                            const dataLines = eventStr.split('\n').filter(line => line.startsWith("data:"));
                            const dataContent = dataLines.map(line => line.replace("data:", "").trim()).join("\n");

                            if (dataContent) {
                                if (isFirstChunk) {
                                    aiMessageElem.innerHTML = "";
                                    isFirstChunk = false;
                                }
                                typeEffect(aiMessageElem, parseMarkdown(dataContent));
                            }
                        }
                    });
                }
            }
            await read();
        } catch (error) {
            console.error("Lỗi:", error);
            aiMessageElem.innerHTML = `<strong>Lỗi:</strong> Không thể kết nối!`;
            aiMessageElem.classList.add("error-message");
        }
    }

    function appendMessage(sender, text, className) {
        const messageElem = document.createElement('div');
        messageElem.className = `message ${className}`;
        messageElem.innerHTML = `<strong>${sender}:</strong> <span class="message-text">${text}</span>`;
        chatArea.appendChild(messageElem);
        chatArea.scrollTop = chatArea.scrollHeight;
        return messageElem.querySelector('.message-text');
    }

    function typeEffect(element, text) {
        let i = 0;
        let finalHTML = "";

        function type() {
            if (i < text.length) {
                finalHTML += text.charAt(i);
                element.innerHTML = parseMarkdown(finalHTML);
                i++;
                setTimeout(type, 5);
                chatArea.scrollTop = chatArea.scrollHeight;
            }
        }
        type();
    }

    function parseMarkdown(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n- (.*?)/g, '<li>$1</li>')
            .replace(/\n/g, "<br>")
            .replace(/<\/li><br>/g, '</li>')
            .replace(/<li>(.*?)<\/li>/g, '<ul><li>$1</li></ul>')
            .replace(/<\/ul><ul>/g, '');
    }
});
