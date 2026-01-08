import { model } from './config/ollama';

async function testOllamaChat() {
    console.log("Starting Ollama CHAT Integration Test...");

    const systemPrompt = "You are a helpful assistant.";
    const history = [
        {
            role: 'user',
            parts: [{ text: systemPrompt }]
        },
        {
            role: 'model',
            parts: [{ text: 'Understood.' }]
        }
    ];

    try {
        console.log("Initializing Chat...");
        const chat = model.startChat({
            history: history
        });

        console.log("Sending Message 'hello'...");
        const result = await chat.sendMessage("hello");
        const responseText = result.response.text();

        console.log("--------------------------------");
        console.log("Ollama Chat Response:");
        console.log(responseText);
        console.log("--------------------------------");
        console.log("Test PASSED");
    } catch (error: any) {
        console.error("Test FAILED");
        console.error(error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        }
    }
}

testOllamaChat();
