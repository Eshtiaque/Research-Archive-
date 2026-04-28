const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const generateChatResponse = async (req, res) => {
    try {
        const { messages, paperContext } = req.body;

        const systemMessage = {
            role: "system",
            content: `You are an expert AI Research Assistant. You are helping a user analyze a research paper titled "${paperContext.title}". Here is the abstract: "${paperContext.abstract}". Answer the user's questions based on this context. Be concise, highly technical, and professional. If you don't know the answer from the context, logically infer based on standard research principles, but keep it brief.`
        };

        const apiMessages = [systemMessage, ...messages];

        const chatCompletion = await groq.chat.completions.create({
            messages: apiMessages,
            model: "llama-3.1-8b-instant", 
            temperature: 0.5,
            max_tokens: 1024,
        });

        const reply = chatCompletion.choices[0]?.message?.content || "Sorry, no response generated.";
        res.status(200).json({ success: true, reply });

    } catch (error) {
        console.error("Groq API Error:", error);
        res.status(500).json({ success: false, error: 'Failed to communicate with AI model' });
    }
};

module.exports = { generateChatResponse };