import { model } from './config/ollama';

async function testOllama() {
    console.log("Starting Ollama Integration Test 2...");
    try {
        const result = await model.generateContent("Test");
        console.log("Response:", result.response.text());
        console.log("GENERATE TEST PASSED");
    } catch (error: any) {
        console.error("GENERATE TEST FAILED:", error.message);
    }
}

testOllama();
