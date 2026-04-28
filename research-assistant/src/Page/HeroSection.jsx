import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaDatabase, FaMicrochip } from 'react-icons/fa';

const HeroSection = () => {
  return (
    <div className="w-full min-h-[calc(100vh-76px)] flex flex-col items-center justify-center px-6 relative bg-slate-50 font-sans overflow-hidden">
      
      {/* Institutional Grid Pattern Background */}
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

      <div className="z-10 text-center max-w-4xl w-full flex flex-col items-center animate-fade-in-up">
        
        {/* Top Academic Label */}
        <div className="mb-8 inline-flex items-center gap-3 px-4 py-2 border border-slate-300 bg-white text-xs font-bold text-black uppercase tracking-[0.2em] shadow-sm">
          <FaMicrochip className="text-slate-500" size={14} /> 
          <span>AI-Powered Research Intelligence</span>
        </div>
        
        {/* Serif Headline */}
        <h1 className="text-5xl md:text-7xl font-serif font-normal text-black mb-8 leading-tight tracking-tight">
          Accelerate Your <br /> Literature Review
        </h1>
        
        {/* Subheadline */}
        <p className="text-slate-600 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
          Discover relevant academic papers, analyze cosine similarity, and extract complex datasets dynamically. Built for the modern researcher.
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
          <Link 
            to="/pricing" 
            className="group px-8 py-4 w-full sm:w-auto bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-3 border border-slate-900"
          >
            Launch Dashboard 
            <FaArrowRight className="group-hover:translate-x-1 transition-transform" size={10} />
          </Link>
          
          <Link
           to="/architecture"
           className="group px-8 py-4 w-full sm:w-auto bg-white hover:bg-slate-100 text-black border border-slate-300 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-3">
            <FaDatabase className="text-slate-400 group-hover:text-black transition-colors" size={12} /> 
            View Architecture
          </Link>
        </div>

        {/* Bottom Institutional Trust Marks */}
        <div className="mt-16 pt-8 border-t border-slate-300 w-full max-w-2xl flex flex-wrap justify-center gap-4 sm:gap-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <span>Vector Embeddings</span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span>Semantic Search</span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span>Entity Extraction</span>
        </div>

      </div>
    </div>
  );
};

export default HeroSection;