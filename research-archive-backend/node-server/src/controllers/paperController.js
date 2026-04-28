const axios = require('axios');
const SavedPaper = require('../models/SavedPaper');
const Quota = require('../models/Quota');
const Groq = require('groq-sdk'); 

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const PLAN_LIMITS = {
  'Basic Scholar': { search: 20, review: 5 },
  'Pro Researcher': { search: 500, review: 50 },
  'Institutional': { search: 10000, review: 1000 }
};

const searchPapers = async (req, res) => {
  const query = req.query.q;
  const limit = req.query.limit || 30;
  const clerkId = req.query.clerkId;

  if (!query) {
    return res.status(400).json({ success: false, error: "Search query is required" });
  }

  try {
    if (clerkId) {
      let userQuota = await Quota.findOne({ clerkUserId: clerkId });
      const userPlan = userQuota?.plan || 'Basic Scholar';
      const allowedLimit = PLAN_LIMITS[userPlan].search;

      if (userQuota && userQuota.searchUsed >= allowedLimit) {
        return res.status(403).json({ success: false, message: `Quota Exceeded for ${userPlan} plan!` });
      }
    }

    console.log(`🚀 Searching OpenAlex for: ${query}`);

    const response = await axios.get('https://api.openalex.org/works', {
      params: { search: query, 'per-page': limit }
    });

    const reconstructAbstract = (invertedIndex) => {
      if (!invertedIndex) return "Abstract not available for this paper.";
      const words = [];
      for (const [word, positions] of Object.entries(invertedIndex)) {
        positions.forEach(pos => { words[pos] = word; });
      }
      return words.filter(Boolean).join(' '); 
    };

    const extractDatasetRegex = (abstractText) => {
      if (!abstractText || abstractText === "Abstract not available...") return null;
      const regex1 = /([A-Z0-9][a-zA-Z0-9-]*\s+){1,4}(dataset|corpus|benchmark|database)/i;
      const match1 = abstractText.match(regex1);
      if (match1) return match1[0].trim();
      return null;
    };

    let papers = response.data.results.map(work => {
      const fullAbstract = reconstructAbstract(work.abstract_inverted_index);
      return {
        id: work.id ? work.id.replace('https://openalex.org/', '') : Math.random().toString(36).substr(2, 9),
        title: work.title || work.display_name || "Unknown Title",
        authors: work.authorships && work.authorships.length > 0 
                 ? work.authorships.map(a => a.author.display_name) : ["Unknown Author"],
        abstract: fullAbstract,
        publishedYear: work.publication_year ? work.publication_year.toString() : "N/A",
        sourceUrl: work.doi || work.id || "#",
        dataset: extractDatasetRegex(fullAbstract), 
        hasDataset: false
      };
    });

    try {
      console.log("🤖 Sending abstracts to Groq AI for deep dataset extraction...");
      
      const inputForAI = papers.map((p, index) => ({
        index: index,
        abstract: p.abstract.substring(0, 800) 
      }));

      const prompt = `You are an expert data extractor. Read the following JSON array of scientific abstracts. 
      Identify the exact dataset, corpus, or benchmark used in each abstract.
      Respond ONLY with a valid JSON array of objects. 
      Format: [{"index": 0, "dataset": "CIFAR-10 Dataset"}, {"index": 1, "dataset": null}].
      Input: ${JSON.stringify(inputForAI)}`;

      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.1-8b-instant", 
        temperature: 0.1, 
      });

      let aiText = chatCompletion.choices[0].message.content;
      const jsonMatch = aiText.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        const aiResults = JSON.parse(jsonMatch[0]);
        
        papers.forEach((paper, i) => {
          const found = aiResults.find(r => r.index === i);
          if (found && found.dataset && found.dataset !== "null") {
            paper.dataset = found.dataset;
            paper.hasDataset = true;
          } else {
            paper.hasDataset = paper.dataset !== null; 
          }
        });
        console.log("✅ Groq Deep Extraction Complete!");
      }
    } catch (aiError) {
      console.error("⚠️ Groq AI Extraction skipped/failed (Using Regex instead):", aiError.message);
      papers.forEach(p => p.hasDataset = p.dataset !== null);
    }

    if (clerkId) {
      await Quota.findOneAndUpdate(
        { clerkUserId: clerkId },
        { $inc: { searchUsed: 1 } },
        { upsert: true, returnDocument: 'after' }
      );
    }

    res.status(200).json({ success: true, data: papers });

  } catch (error) {
    console.error("❌ API Search Error:", error.message);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};


const savePaper = async (req, res) => {
  try {
    const paperData = req.body;
    const clerkId = req.body.clerkId; 

    if (!clerkId) {
      return res.status(400).json({ success: false, message: "Unauthorized: User ID missing" });
    }

    const existingPaper = await SavedPaper.findOne({ paperId: paperData.id, clerkId: clerkId });
    if (existingPaper) {
      return res.status(400).json({ success: false, message: 'Already exists in your Workspace!' });
    }

    const newPaper = new SavedPaper({
      paperId: paperData.id,
      title: paperData.title,
      authors: paperData.authors,
      year: paperData.year,
      similarity: paperData.similarity,
      dataset: paperData.dataset,
      hasDataset: paperData.hasDataset,
      clerkId: clerkId 
    });

    await newPaper.save();
    res.status(201).json({ success: true, message: 'Saved to Workspace successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};


const getSavedPapers = async (req, res) => {
  try {
    const { clerkId } = req.query; 

    if (!clerkId) {
      return res.status(400).json({ success: false, message: "User ID is required!" });
    }

    const papers = await SavedPaper.find({ clerkId: clerkId }).sort({ savedAt: -1 });
    res.status(200).json({ success: true, data: papers });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch saved papers' });
  }
};


const deleteSavedPaper = async (req, res) => {
  try {
    const { id } = req.params;
    const { clerkId } = req.query; 

    if (!clerkId) {
      return res.status(400).json({ success: false, message: "User ID is required to delete!" });
    }

    await SavedPaper.findOneAndDelete({ paperId: id, clerkId: clerkId });
    res.status(200).json({ success: true, message: 'Paper deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete paper' });
  }
};

const analyzePaper = async (req, res) => {
  const { abstract } = req.body;
  if (!abstract || abstract.length < 50) {
    return res.status(400).json({ success: false, message: "Abstract is too short or missing." });
  }

  try {
    const prompt = `You are an expert AI research assistant. Read the following academic abstract and extract the deep analysis.
    Return ONLY a valid JSON object with EXACTLY this structure, nothing else:
    {
      "contributions": ["Key contribution 1", "Key contribution 2", "Key contribution 3"],
      "limitations": ["Possible limitation 1", "Possible limitation 2"],
      "futureWork": ["Future research direction 1", "Future research direction 2"],
      "methodology": "A short 2-3 sentence paragraph explaining the methodological framework used."
    }
    
    Abstract: "${abstract}"`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.2, 
    });

    let aiText = chatCompletion.choices[0].message.content;
    const jsonMatch = aiText.match(/\{[\s\S]*\}/); 
    
    if (jsonMatch) {
      const analysisData = JSON.parse(jsonMatch[0]);
      return res.status(200).json({ success: true, analysis: analysisData });
    } else {
      throw new Error("Failed to parse JSON from AI");
    }
  } catch (error) {
    console.error("AI Analysis Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate AI analysis." });
  }
};

module.exports = { searchPapers, savePaper, getSavedPapers, deleteSavedPaper , analyzePaper };

