import axios from 'axios';

const BASE_URL = 'https://69b706a12aa9.ngrok-free.app';

async function checkEndpoints() {
    console.log("Checking /api/tags...");
    try {
        await axios.get(`${BASE_URL}/api/tags`);
        console.log("/api/tags: OK");
    } catch (e: any) {
        console.log(`/api/tags: ${e.message} ${e.response?.status}`);
    }

    console.log("Checking /api/generate...");
    try {
        await axios.post(`${BASE_URL}/api/generate`, {
            model: "llama3:8b",
            prompt: "hi",
            stream: false
        });
        console.log("/api/generate: OK");
    } catch (e: any) {
        console.log(`/api/generate: ${e.message} ${e.response?.status}`);
    }

    console.log("Checking /api/chat...");
    try {
        await axios.post(`${BASE_URL}/api/chat`, {
            model: "llama3:8b",
            messages: [{ role: "user", content: "hi" }],
            stream: false
        });
        console.log("/api/chat: OK");
    } catch (e: any) {
        console.log(`/api/chat: ${e.message} ${e.response?.status}`);
        if (e.response && e.response.status === 404) {
            console.log("CONFIRMED: /api/chat is 404 Not Found");
        }
    }
}

checkEndpoints();
