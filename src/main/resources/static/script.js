document.getElementById('sendButton').addEventListener('click', async function() {
    // Xóa nội dung chat cũ
    const chatArea = document.getElementById('chatArea');
    chatArea.innerHTML = '';

    // Lấy câu hỏi từ ô nhập
    const question = document.getElementById('questionInput').value;

    // Gửi request POST đến API
    const response = await fetch('/api/v1/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: question })
    });

    // Kiểm tra phản hồi từ server
    if (!response.ok) {
        console.error('Network response was not ok');
        return;
    }

    // Xử lý phản hồi streaming
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let partialData = '';

    function read() {
        reader.read().then(({ done, value }) => {
            if (done) {
                console.log("Stream complete");
                return;
            }
            // Giải mã dữ liệu nhận được
            partialData += decoder.decode(value, { stream: true });

            // Tách các sự kiện SSE theo dấu xuống dòng "\n\n"
            const events = partialData.split("\n\n");
            partialData = events.pop(); // Lưu phần dữ liệu chưa hoàn chỉnh

            events.forEach(eventStr => {
                if (eventStr.trim()) {
                    // Lấy nội dung từ dòng bắt đầu với "data:"
                    const dataLine = eventStr.split('\n').find(line => line.startsWith("data:"));
                    if (dataLine) {
                        const data = dataLine.replace("data:", "").trim();

                        // Thêm token vào khu vực chat
                        const messageElem = document.createElement('p');
                        messageElem.className = 'message';
                        messageElem.textContent = data;
                        chatArea.appendChild(messageElem);

                        // Cuộn xuống cuối
                        chatArea.scrollTop = chatArea.scrollHeight;
                    }
                }
            });

            // Tiếp tục đọc stream
            read();
        }).catch(error => {
            console.error("Error reading stream:", error);
        });
    }
    read();
});
