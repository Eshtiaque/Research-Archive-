import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useUser } from "@clerk/react";
import toast, { Toaster } from 'react-hot-toast';
import {
  FaArrowLeft, FaExternalLinkAlt, FaQuoteLeft,
  FaDatabase, FaMicrochip, FaRegBookmark, FaFlask, FaRobot, FaTimes, FaPaperPlane, FaSpinner
} from 'react-icons/fa';

const PaperDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  const realMatchScore = location.state?.matchScore || 95;

  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [deepAnalysis, setDeepAnalysis] = useState({
    contributions: [],
    limitations: [],
    futureWork: [],
    methodology: ""
  });

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello Scholar! I have indexed this manuscript. How can I assist your analysis today?' }
  ]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    const fetchPaperDetails = async () => {
      try {
        const response = await axios.get(`https://api.openalex.org/works/${id}`);
        const work = response.data;

        // 1. Abstract Reconstructor
        let fullAbstract = "No abstract provided by the publisher for this manuscript.";
        if (work.abstract_inverted_index) {
          const words = [];
          for (const [word, positions] of Object.entries(work.abstract_inverted_index)) {
            positions.forEach(pos => { words[pos] = word; });
          }
          fullAbstract = words.filter(Boolean).join(' ');
        }

        // 2. Dataset Extractor
        let extractedDataset = null;
        if (fullAbstract) {
          const regex1 = /([A-Z][a-zA-Z0-9-]*\s+){1,4}(Dataset|Corpus|Benchmark|Database)/;
          const match1 = fullAbstract.match(regex1);
          if (match1) extractedDataset = match1[0].trim();
          else {
            const popularDatasets = /(ImageNet|CIFAR-10|CIFAR-100|MNIST|COCO|Pascal VOC|KITTI|Cityscapes|Kinetics|IMDB|MIMIC-III|CelebA|ISIC|Waymo)/i;
            const match2 = fullAbstract.match(popularDatasets);
            if (match2) extractedDataset = match2[0].trim() + " Dataset";
          }
        }

        const topConcepts = Array.isArray(work.concepts) && work.concepts.length > 0
          ? work.concepts.slice(0, 5).map(c => c.display_name)
          : ["Machine Learning", "Data Science"];


        let journalName = "Unknown Source";
        const locationData = work.primary_location;
        const doiString = work.doi || "";

        if (locationData) {
          if (locationData.source && locationData.source.display_name) {
            journalName = locationData.source.display_name;
          } else if (locationData.source && locationData.source.host_organization_name) {
            journalName = locationData.source.host_organization_name;
          } else if (locationData.landing_page_url) {
            try {
              const url = new URL(locationData.landing_page_url);
              journalName = url.hostname.replace('www.', '');

              if (journalName === 'doi.org') {
                if (doiString.includes('10.1109')) journalName = 'IEEE Xplore';
                else if (doiString.includes('10.1145')) journalName = 'ACM Digital Library';
                else if (doiString.includes('10.1007')) journalName = 'Springer';
                else if (doiString.includes('10.1016')) journalName = 'ScienceDirect / Elsevier';
                else journalName = 'External Publisher';
              }
            } catch (e) {
              journalName = "External Publisher";
            }
          }
        }

        if (journalName === "Unknown Source" || journalName === "External Publisher") {
          if (doiString.includes('10.1109')) journalName = 'IEEE Xplore';
          else if (doiString.includes('10.1145')) journalName = 'ACM Digital Library';
          else if (doiString.includes('10.1007')) journalName = 'Springer';
          else if (doiString.includes('10.1016')) journalName = 'ScienceDirect / Elsevier';
        }

        setPaper({
          title: work.title || work.display_name || "Unknown Title",
          authors: work.authorships?.map(a => ({ name: a.author.display_name })) || [{ name: "Unknown Author" }],
          year: work.publication_year?.toString() || "N/A",
          abstract: fullAbstract,
          citationCount: work.cited_by_count || 0,
          journal: { name: journalName },
          url: work.doi || work.id || "#",
          dataset: extractedDataset || "No Extracted Dataset",
          hasDataset: extractedDataset !== null,
          keywords: topConcepts,
          matchScore: realMatchScore,
          topConcept: topConcepts[0]
        });

        if (fullAbstract && fullAbstract.length > 100) {
          generateDeepAnalysis(fullAbstract);
        } else {
          setIsAnalyzing(false);
        }

      } catch (error) {
        console.error("API Error:", error);
        toast.error("Failed to load manuscript details.");
        setIsAnalyzing(false);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPaperDetails();
  }, [id, realMatchScore]);

  const generateDeepAnalysis = async (abstractText) => {
    try {
      setIsAnalyzing(true);
      const aiResponse = await axios.post('https://research-archive-rosy.vercel.app/api/papers/analyze-paper', {
        abstract: abstractText
      });
      if (aiResponse.data.success) {
        setDeepAnalysis(aiResponse.data.analysis);
      }
    } catch (error) {
      console.error("AI Analysis Error:", error);
      toast.error("AI couldn't generate deep analysis. Using fallbacks.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const authorsList = paper?.authors?.map(a => a.name).join(', ') || 'Unknown Authors';

  const handleSaveToWorkspace = async () => {
    const toastId = toast.loading('Saving to Workspace...');
    try {
      const paperData = {
        id: id,
        title: paper?.title || "Unknown Title",
        authors: paper?.authors?.map(a => a.name) || ["Unknown Author"],
        year: parseInt(paper?.year) || 0,
        similarity: paper?.matchScore || 95,
        dataset: paper?.dataset !== "No Extracted Dataset" ? paper?.dataset : "Extracted by AI",
        hasDataset: paper?.hasDataset || false,
        clerkId: user?.id
      };

      const response = await axios.post('https://research-archive-rosy.vercel.app/api/papers/save', paperData);
      if (response.data.success) toast.success('Saved to Workspace successfully!', { id: toastId });
    } catch (error) {
      if (error.response && error.response.status === 400) toast.error('Already in Workspace!', { id: toastId });
      else toast.error('Failed to save paper.', { id: toastId });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMessages = [...messages, { role: 'user', text: inputValue }];
    setMessages(newMessages);
    setInputValue('');
    setMessages(prev => [...prev, { role: 'ai', text: 'Analyzing context...' }]);

    try {
      const response = await axios.post('https://research-archive-rosy.vercel.app/api/chat', {
        messages: newMessages.map(m => ({
          role: m.role === 'ai' ? 'assistant' : 'user',
          content: m.text
        })),
        paperContext: {
          title: paper?.title || "Unknown Title",
          abstract: paper?.abstract || "No abstract available."
        }
      });
      setMessages([...newMessages, { role: 'ai', text: response.data.reply }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages([...newMessages, { role: 'ai', text: '⚠️ Neural link disrupted. Please check your backend connection.' }]);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-76px)] flex flex-col items-center justify-center bg-white">
        <FaSpinner className="text-4xl text-slate-900 animate-spin mb-4" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Extracting Manuscript Details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans pb-24 selection:bg-slate-200 relative">
      <Toaster position="bottom-right" />

      <div className="max-w-[1600px] w-full mx-auto px-6 mt-10 grid grid-cols-1 xl:grid-cols-12 gap-12 xl:gap-16 items-start">

        {/* LEFT SIDE: MAIN CONTENT */}
        <div className="xl:col-span-8 space-y-12 xl:border-r border-slate-200 xl:pr-12">

          <header className="flex gap-6 items-start">
            <button
              onClick={() => navigate(-1)}
              className="shrink-0 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-black bg-slate-50 hover:bg-slate-100 rounded-full transition-colors cursor-pointer mt-2"
            >
              <FaArrowLeft />
            </button>
            <div className="flex-1">
              <h1 className="font-serif text-3xl md:text-5xl font-normal text-black leading-[1.1] mb-6 tracking-tight">
                {paper?.title}
              </h1>
              <div className="text-lg text-slate-600 font-medium tracking-wide">
                {authorsList}
              </div>
            </div>
          </header>

          <section>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <FaQuoteLeft size={10} /> Abstract
            </h2>
            <p className="text-lg text-slate-800 leading-relaxed font-serif mb-8 text-justify">
              {paper?.abstract || "No abstract provided by the publisher for this manuscript."}
            </p>
            <div className="flex flex-wrap gap-2">
              {paper?.keywords?.map((keyword, index) => (
                <span key={index} className="px-3 py-1 bg-slate-50 text-slate-600 text-xs font-medium uppercase tracking-wider rounded-sm border border-slate-100">
                  {keyword}
                </span>
              ))}
            </div>
          </section>

          {/*  AI Deep Analysis Section */}
          {isAnalyzing ? (
            <div className="py-20 flex flex-col items-center justify-center border-t border-slate-200 mt-8">
              <FaRobot className="text-4xl text-blue-500 animate-bounce mb-4" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
                Groq AI is generating Deep Analysis...
              </p>
            </div>
          ) : (
            <>
              <div className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                <section>
                  <h2 className="text-xs font-bold text-black uppercase tracking-[0.2em] border-b-2 border-black pb-3 mb-6">
                    Key Contributions
                  </h2>
                  <ul className="space-y-6">
                    {deepAnalysis?.contributions?.map((item, idx) => (
                      <li key={idx} className="flex gap-4 items-start">
                        <span className="text-slate-300 font-serif text-xl leading-none mt-0.5">{(idx + 1).toString().padStart(2, '0')}</span>
                        <span className="text-sm text-slate-700 leading-relaxed">{item}</span>
                      </li>
                    ))}
                    {deepAnalysis?.contributions?.length === 0 && <p className="text-sm text-slate-500 italic">No specific contributions extracted.</p>}
                  </ul>
                </section>

                <section className="space-y-10">
                  <div>
                    <h2 className="text-xs font-bold text-black uppercase tracking-[0.2em] border-b-2 border-black pb-3 mb-6">
                      Limitations & Scope
                    </h2>
                    <div className="space-y-4">
                      {deepAnalysis?.limitations?.map((item, idx) => (
                        <p key={idx} className="text-sm text-slate-700 leading-relaxed border-l-2 border-slate-200 pl-4">
                          {item}
                        </p>
                      ))}
                      {deepAnalysis?.limitations?.length === 0 && <p className="text-sm text-slate-500 italic">No limitations found.</p>}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xs font-bold text-black uppercase tracking-[0.2em] border-b-2 border-black pb-3 mb-6">
                      Future Research
                    </h2>
                    <div className="space-y-4">
                      {deepAnalysis?.futureWork?.map((item, idx) => (
                        <p key={idx} className="text-sm text-slate-700 leading-relaxed border-l-2 border-slate-200 pl-4 italic">
                          {item}
                        </p>
                      ))}
                      {deepAnalysis?.futureWork?.length === 0 && <p className="text-sm text-slate-500 italic">No future scope mentioned.</p>}
                    </div>
                  </div>
                </section>
              </div>

              <section className="bg-slate-50 p-8 md:p-10 rounded-md mt-12 border border-slate-200">
                <h2 className="text-xs font-bold text-black uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                  <FaFlask className="text-slate-400" size={14} /> Methodological Framework
                </h2>
                <p className="text-base text-slate-700 leading-relaxed text-justify font-serif">
                  {deepAnalysis?.methodology || "Methodology could not be extracted from the abstract."}
                </p>
              </section>
            </>
          )}

        </div>

        {/* RIGHT SIDE: SIDEBAR */}
        <aside className="xl:col-span-4 space-y-10 sticky top-24">
          <div className="flex flex-col gap-3 w-full">
            <a href={paper?.url !== "#" ? paper?.url : `https://doi.org/${paper?.url}`} target="_blank" rel="noreferrer" className="w-full bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 py-4 transition-colors rounded-sm shadow-sm">
              Access Full Manuscript <FaExternalLinkAlt size={10} />
            </a>

            <button
              onClick={handleSaveToWorkspace}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 py-4 transition-colors rounded-sm border border-slate-200"
            >
              <FaRegBookmark /> Save to Workspace
            </button>
          </div>

          <div>
            <h3 className="text-xs font-bold text-black uppercase tracking-[0.2em] border-b-2 border-black pb-3 mb-4">
              Publication Details
            </h3>
            <div className="flex flex-col">
              {[
                { label: "Journal/Source", value: paper?.journal?.name || "N/A" },
                { label: "Year", value: paper?.year || "N/A" },
                { label: "Citations", value: paper?.citationCount || "0" },
                { label: "DOI/ID", value: id, isMono: true }
              ].map((info, i) => (
                <div key={i} className="flex justify-between items-start py-3 border-b border-slate-100">
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{info.label}</span>
                  <span className={`text-sm font-bold text-black text-right max-w-[60%] ${info.isMono ? 'font-mono text-[10px] break-all' : ''}`}>
                    {info.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-black uppercase tracking-[0.2em] border-b-2 border-black pb-3 mb-4 flex items-center gap-2">
              <FaMicrochip className="text-slate-400" /> Relevance Matrix
            </h3>
            <div className="flex flex-col">
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Match Score</span>
                <span className="text-sm font-mono font-bold text-green-700 bg-green-50 px-2 py-1 rounded-sm">
                  {paper?.matchScore}%
                </span>
              </div>
              <div className="pt-4">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-3 block">AI Synthesis Report</span>
                <ul className="space-y-3 text-xs text-slate-700 leading-relaxed">
                  <li className="flex gap-3">
                    <span className="text-slate-300 font-bold text-sm leading-none">•</span>
                    <span>High topological overlap with query vector regarding <strong className="text-black">{paper?.topConcept}</strong>.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-md">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
              <FaDatabase /> Primary Dataset
            </h3>
            <div className={`text-base font-bold ${paper?.hasDataset ? 'text-blue-600' : 'text-slate-500'} mb-3`}>
              {paper?.dataset}
            </div>
            <div className="flex justify-between items-center border-t border-slate-200 pt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Status</span>
              <span className={paper?.hasDataset ? "text-green-600" : "text-slate-400"}>
                {paper?.hasDataset ? "Verified" : "Not Found"}
              </span>
            </div>
          </div>
        </aside>
      </div>

      {/* FLOATING AI CHAT ASSISTANT */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95
          ${isChatOpen ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'}
        `}
      >
        {isChatOpen ? <FaTimes /> : <FaRobot size={18} />}
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
          {isChatOpen ? 'Close Assistant' : 'AI Assistant'}
        </span>
      </button>

      {isChatOpen && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 w-[90%] max-w-lg h-[500px] bg-white border border-slate-300 shadow-2xl z-[90] flex flex-col rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-slate-900 p-4 text-white flex items-center gap-3 shrink-0">
            <FaRobot className="text-slate-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Neural Research Assistant</span>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 custom-scrollbar">
            {messages?.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm
                  ${msg.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none font-serif'}
                `}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex gap-2">
            <input
              type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)}
              placeholder="Query this manuscript..."
              className="flex-1 bg-slate-100 border-none px-4 py-3 rounded-full text-xs focus:ring-1 focus:ring-slate-900 outline-none"
            />
            <button type="submit" className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-black transition-all shadow-md">
              <FaPaperPlane size={12} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PaperDetails;