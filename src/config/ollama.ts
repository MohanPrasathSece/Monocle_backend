import axios from 'axios';

const OLLAMA_BASE_URL = 'https://ba740c5bab92.ngrok-free.app';
const MODEL_NAME = 'llama3:8b'; // Using Ollama 3 8b as requested

export const model = {
    generateContent: async (prompt: string) => {
        try {
            console.log('Generating content with Ollama...');
            const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
                model: MODEL_NAME,
                prompt: prompt,
                stream: false
            });
            return {
                response: {
                    text: () => response.data.response
                }
            };
        } catch (error: any) {
            console.error("Ollama generate error:", error);
            throw new Error(`Ollama generation failed: ${error.message}`);
        }
    },

    startChat: (config: { history: any[] }) => {
        let history = config.history || [];

        // Convert initial history to our format
        const formattedHistory: { role: string; content: string }[] = history.map(h => {
            let content = '';
            if (h.parts && h.parts.length > 0) {
                content = h.parts[0].text;
            } else if (h.content) {
                content = h.content;
            }

            return {
                role: (h.role === 'model' || h.role === 'assistant') ? 'assistant' : 'user',
                content: content
            };
        });

        return {
            sendMessage: async (message: string) => {
                // Add user message to history
                formattedHistory.push({ role: 'user', content: message });

                // Construct Llama 3 Prompt from history because /api/chat is 404ing
                let fullPrompt = "<|begin_of_text|>";

                formattedHistory.forEach((msg, index) => {
                    // Try to detect if the first message is actually a system prompt disguised as a user message
                    // (ChatService sends system prompt as first user message)
                    let role = msg.role;
                    if (index === 0 && role === 'user' && msg.content.includes('You are Monocle AI')) {
                        role = 'system';
                    }

                    // Llama 3 formatting
                    fullPrompt += `<|start_header_id|>${role}<|end_header_id|>\n\n${msg.content}<|eot_id|>`;
                });

                fullPrompt += "<|start_header_id|>assistant<|end_header_id|>\n\n";

                try {
                    console.log('Sending chat prompt to Ollama /api/generate...');
                    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
                        model: MODEL_NAME,
                        prompt: fullPrompt,
                        stream: false,
                        options: {
                            stop: ["<|eot_id|>", "<|end_of_text|>"]
                        }
                    });

                    const responseText = response.data.response;

                    // Add assistant response to history
                    formattedHistory.push({ role: 'assistant', content: responseText });

                    return {
                        response: {
                            text: () => responseText
                        }
                    };
                } catch (error: any) {
                    console.error("Ollama chat error (generate fallback):", error.message);
                    throw new Error(`Ollama chat failed: ${error.message}`);
                }
            }
        };
    }
};
