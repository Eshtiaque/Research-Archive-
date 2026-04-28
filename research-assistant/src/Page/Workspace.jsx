import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from "@clerk/react";
import { FaTrash, FaMagic, FaCheck, FaFileAlt, FaRobot, FaInfoCircle, FaCopy } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';

const Workspace = () => {
  const { user } = useUser();
  const [selectedPapers, setSelectedPapers] = useState([]); 
  const [isLoading, setIsLoading] = useState(true); 
  const [quota, setQuota] = useState({ used: 0, limit: 5 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [review, setReview] = useState(null);

  const handleError = (error, defaultMsg) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 403) {
        toast.error("Synthesis Quota Exceeded! Upgrade to Pro.", { icon: '🚫' });
      } else if (status === 429) {
        toast.error("AI is overloaded. Please wait a moment.", { icon: '⏳' });
      } else if (status === 500) {
        toast.error("Groq AI Server busy. Try again in 1 minute.", { icon: '🤖' });
      } else {
        toast.error(error.response.data.message || defaultMsg);
      }
    } else if (error.request) {
      toast.error("Network Error: Cannot reach server.", { icon: '🌐' });
    } else {
      toast.error(defaultMsg);
    }
  };

  useEffect(() => {
    const initWorkspace = async () => {
      if (!user?.id) return; 
      
      setIsLoading(true);
      
    
      try {
        const papersRes = await axios.get(`http://localhost:5000/api/papers/saved?clerkId=${user.id}`);
        
        if (papersRes.data.success) {
          const papersFromDB = papersRes.data.data.map(paper => ({
            id: paper.paperId,
            title: paper.title,
            year: paper.year,
            abstract: paper.abstract,
            dbId: paper._id 
          }));
          
          setSelectedPapers(papersFromDB);
        }
      } catch (error) {
        console.error("Paper Fetch Error:", error);
        toast.error("Failed to load papers.");
      }

    
      try {
        const quotaRes = await axios.get(`http://localhost:5000/api/user/quota/${user.id}`);
        if (quotaRes.data.success) {
          setQuota({ 
            used: quotaRes.data.data.reviewUsed, 
            limit: quotaRes.data.data.reviewLimit 
          });
        }
      } catch (error) {
        console.warn("Quota warning:", error.message || "Quota not found yet.");
      } 
      
      setIsLoading(false);
    };

    initWorkspace();
  }, [user?.id]);

  const removePaper = async (id) => {
    try {
      setSelectedPapers(selectedPapers.filter(paper => paper.id !== id));
      
      await axios.delete(`http://localhost:5000/api/papers/saved/${id}?clerkId=${user?.id}`);
      
      toast.success("Paper removed from Workspace.");
    } catch (error) {
      handleError(error, "Failed to remove paper.");
    }
  };

  const handleGenerateReview = async () => {
    if (selectedPapers.length === 0) return;
    
    setIsGenerating(true);
    setReview(null);
    const toastId = toast.loading('Synthesizing Literature Review...');

    try {
      const response = await axios.post('http://localhost:5000/api/synthesis/generate', {
        papers: selectedPapers,
        clerkId: user?.id 
      });

      setReview(response.data.synthesis);
      
      setQuota(prev => ({ ...prev, used: prev.used + 1 }));
      
      toast.success('Synthesis complete!', { id: toastId });
    } catch (error) {
      console.error("Synthesis Error:", error);
      handleError(error, "Failed to generate synthesis.");
      toast.dismiss(toastId);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!review) return;
    navigator.clipboard.writeText(review);
    toast.success("Synthesis copied to clipboard!", { icon: '📋' });
  };

  return (
    <div className="h-[calc(100vh-76px)] overflow-hidden bg-slate-50 text-slate-900 font-sans selection:bg-slate-200">
      <Toaster position="bottom-right" /> 
      <div className="max-w-[1600px] mx-auto w-full px-6 py-6 h-full flex flex-col">
        
        {/* --- HEADER --- */}
        <div className="mb-6 pb-4 border-b border-slate-200 flex justify-between items-end shrink-0">
          <div>
            <h1 className="font-serif text-3xl font-normal text-black tracking-tight">
              Synthesis Workspace
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
              <FaInfoCircle /> Selected papers are processed via Llama-3.1
            </p>
          </div>
          <div className="flex gap-8 items-center">
            <div className="text-right border-r border-slate-200 pr-8">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                AI Credits Left
              </div>
              <div className="text-xl font-mono font-bold text-black">
                {quota.limit - quota.used} <span className="text-slate-300 text-sm">/ {quota.limit}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Paper Pool
              </div>
              <div className="text-2xl font-bold text-black">
                {isLoading ? "..." : selectedPapers.length}
              </div>
            </div>
          </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="flex-1 flex flex-col lg:flex-row gap-8 relative items-start min-h-0">
          
          <div className="w-full lg:w-[40%] h-full flex flex-col">
            <h2 className="text-xs font-bold text-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 shrink-0">
              <FaFileAlt className="text-slate-400" /> Active Corpus
            </h2>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-white border border-slate-200 animate-pulse rounded-sm" />
                ))
              ) : selectedPapers.length === 0 ? (
                <div className="text-center p-12 border-2 border-dashed border-slate-300 bg-white">
                  <p className="text-sm font-medium text-slate-500">Workspace empty. Go to dashboard to add papers.</p>
                </div>
              ) : (
                selectedPapers.map((paper, index) => (
                  <div key={paper.id} className="bg-white border border-slate-300 p-4 shadow-sm relative group flex gap-4 hover:border-slate-400 transition-all">
                    <div className="text-slate-200 font-serif text-2xl leading-none mt-1 group-hover:text-slate-900 transition-colors">
                      {(index + 1).toString().padStart(2, '0')}
                    </div>
                    <div className="flex-1">
                      <div className="text-[9px] font-bold text-slate-400 mb-1 uppercase">Year: {paper.year || "N/A"}</div>
                      <h3 className="font-serif text-base font-medium text-black leading-tight mb-3">
                        {paper.title}
                      </h3>
                      <button 
                        onClick={() => removePaper(paper.id)}
                        className="text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-1 hover:text-red-600 transition-colors"
                      >
                        <FaTrash size={8} /> Drop from pool
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="w-full lg:w-[60%] h-full flex flex-col bg-white border border-slate-300 shadow-sm rounded-sm overflow-hidden">
            {/* --- Neural Synthesizer Header --- */}
            <div className="bg-slate-900 p-4 shrink-0 flex justify-between items-center">
              <div className="text-xs font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
                <FaRobot className="text-blue-400 animate-pulse" /> Neural Synthesizer
              </div>
              
              <div className="flex gap-3">
                {review && !isGenerating && (
                  <button 
                    onClick={copyToClipboard}
                    className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest border border-slate-700 px-3 py-2 transition-all flex items-center gap-2"
                  >
                    <FaCopy /> Copy Text
                  </button>
                )}

                <button 
                  onClick={handleGenerateReview}
                  disabled={selectedPapers.length === 0 || isGenerating || quota.used >= quota.limit}
                  className={`text-xs font-bold uppercase tracking-widest px-6 py-2.5 transition-all flex items-center gap-2
                    ${(selectedPapers.length === 0 || quota.used >= quota.limit) ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 
                      isGenerating ? 'bg-slate-700 text-white cursor-wait' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg'}
                  `}
                >
                  {isGenerating ? "Processing..." : quota.used >= quota.limit ? "Quota Exhausted" : review ? "Re-generate" : "Synthesize"}
                </button>
              </div>
            </div>

            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-white">
              {!isGenerating && !review && (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <FaMagic className="text-slate-300 text-5xl mb-4" />
                    <p className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-2">Engine Standby</p>
                    <p className="text-xs text-slate-500 max-w-xs">
                      The AI will analyze common themes, methodologies, and gaps across your selected manuscripts.
                    </p>
                  </div>
              )}

              {isGenerating && (
                <div className="h-full flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 border-2 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
                    <FaRobot className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-900 text-xl" />
                  </div>

                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-1">Mapping Semantic Landscape</p>
                    <p className="text-[10px] text-slate-500 font-mono italic">Context: {selectedPapers.length} Documents</p>
                  </div>
                </div>
              )}

              {review && !isGenerating && (
                <div className="prose prose-slate prose-sm max-w-none font-serif text-slate-800 leading-relaxed whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-4 duration-1000">
                  {review}
                </div>
              )}
            </div>
            
            {quota.used >= quota.limit && (
              <div className="bg-red-50 border-t border-red-100 p-3 text-center">
                <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">
                  Daily synthesis limit reached. Upgrade to Pro for unlimited reviews.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Workspace;