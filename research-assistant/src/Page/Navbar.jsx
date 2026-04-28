import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Show, UserButton, useClerk } from "@clerk/react";
import { FaBookOpen, FaSearch, FaFlask, FaDatabase, FaCog } from 'react-icons/fa'; 

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { openSignIn } = useClerk();
  const [searchQuery, setSearchQuery] = useState('');

  const isDashboard = location.pathname === '/dashboard';

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/dashboard?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="bg-white border-b border-slate-300 sticky top-0 z-50 relative">
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

      <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between gap-6 relative z-10">
        
        {/* --- Left Side: Logo --- */}
        <Link to="/" className="flex items-center gap-3 group shrink-0">
          <div className="p-1.5 bg-slate-100 border border-slate-300 group-hover:bg-slate-200 transition-colors">
            <FaBookOpen className="text-slate-700" size={16} />
          </div>
          <span className="font-serif text-xl font-bold text-black tracking-tight hidden md:block">
            Research Archive
          </span>
        </Link>

        {/* --- Middle: Global Search Bar  --- */}
        <div className="flex-1 max-w-2xl">
          {isDashboard && (
            <form onSubmit={handleSearch} className="relative w-full">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search literature, keywords, or DOI..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-300 text-sm text-black placeholder-slate-400 focus:outline-none focus:border-slate-900 transition-colors rounded-md"
              />
            </form>
          )}
        </div>

        {/* --- Right Side: Navigation & Auth --- */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          
          <Link to="/datasets" className={`flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors group ${location.pathname === '/datasets' ? 'text-black' : 'text-slate-500 hover:text-black'}`}>
            <FaDatabase className={`${location.pathname === '/datasets' ? 'text-black' : 'text-slate-400 group-hover:text-black'} transition-colors`} size={13} />
            <span className="hidden lg:block">Datasets</span>
          </Link>

          <Link to="/workspace" className={`flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors group ${location.pathname === '/workspace' ? 'text-black' : 'text-slate-500 hover:text-black'}`}>
            <FaFlask className={`${location.pathname === '/workspace' ? 'text-black' : 'text-slate-400 group-hover:text-black'} transition-colors`} size={14} />
            <span className="hidden lg:block">Workspace</span>
          </Link>

          <div className="hidden sm:block w-px h-6 bg-slate-300"></div>

          {/* Auth Section using <Show> */}
          <Show when="signed-out">
            <button 
              onClick={() => openSignIn()} 
              className="px-6 py-2.5 bg-slate-900 text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest border border-slate-900 transition-colors hover:bg-black shadow-sm cursor-pointer"
            >
              Sign In
            </button>
          </Show>

          <Show when="signed-in">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] hidden sm:block border-r border-slate-300 pr-4">
                Scholar Access
              </span>

              <Link to="/settings" className={`p-2 rounded-full transition-colors ${location.pathname === '/settings' ? 'bg-slate-100 text-black' : 'text-slate-400 hover:bg-slate-50 hover:text-black'}`} title="Account Settings">
                <FaCog size={18} />
              </Link>

              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: { width: "40px", height: "40px", border: "1px solid #cbd5e1" }
                  }
                }} 
              />
            </div>
          </Show>
        </div>
      </div>
    </header>
  );
};

export default Navbar;