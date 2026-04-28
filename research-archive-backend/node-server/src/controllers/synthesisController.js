const { ChatGroq } = require("@langchain/groq");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const Quota = require("../models/Quota");

const PLAN_LIMITS = {
  'Basic Scholar': { search: 20, review: 5 },
  'Pro Researcher': { search: 500, review: 50 },
  'Institutional': { search: 10000, review: 1000 }
};

const generateSynthesis = async (req, res) => {
    try {
        const { papers, clerkId } = req.body;

        if (!papers || papers.length === 0) {
            return res.status(400).json({ success: false, error: "No papers provided for synthesis." });
        }

        if (clerkId) {
            const userQuota = await Quota.findOne({ clerkUserId: clerkId });
            
            const userPlan = userQuota?.plan || 'Basic Scholar';
            const currentReviewLimit = PLAN_LIMITS[userPlan].review;

            if (userQuota && userQuota.reviewUsed >= currentReviewLimit) {
                return res.status(403).json({ 
                    success: false, 
                    error: `Synthesis limit reached for your ${userPlan} plan! Please upgrade.` 
                });
            }
        }
        // ==========================================================

        const combinedText = papers.map((p, index) => 
            `Paper ${index + 1}: Title: ${p.title}\nAbstract: ${p.abstract || 'N/A'}`
        ).join("\n\n");

        // ৪. LangChain Chunking
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 2000,
            chunkOverlap: 200,
        });

        const docs = await splitter.createDocuments([combinedText]);
        const chunkedContext = docs.map(doc => doc.pageContent).join("\n\n---NEXT CHUNK---\n\n");

        const model = new ChatGroq({
            apiKey: process.env.GROQ_API_KEY,
            model: "llama-3.1-8b-instant",
            temperature: 0.3, 
        });

        const prompt = `You are a strict, highly skilled AI Research Synthesizer. Read the following chunked abstracts from ${papers.length} different research papers:\n\n${chunkedContext}\n\nTask: Write a professional, cohesive literature review synthesizing their core methodologies, common findings, and future scopes. Do not use generic phrases. Format the output with bold headings and paragraphs.`;

        const response = await model.invoke(prompt);

        if (clerkId) {
            await Quota.findOneAndUpdate(
                { clerkUserId: clerkId },
                { $inc: { reviewUsed: 1 } },
                { upsert: true }
            );
        }

        res.status(200).json({ success: true, synthesis: response.content });

    } catch (error) {
        console.error("Synthesis Error:", error);
        res.status(500).json({ success: false, error: "Failed to generate synthesis via LangChain" });
    }
};

module.exports = { generateSynthesis };