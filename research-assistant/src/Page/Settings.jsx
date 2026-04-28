import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useClerk } from "@clerk/react";
import axios from 'axios';
import {
  FaUser, FaCrown, FaKey, FaChartLine, FaShieldAlt,
  FaArrowRight, FaExclamationCircle, FaCheckCircle, FaSignOutAlt
} from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';

const Settings = () => {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [activeTab, setActiveTab] = useState('usage');

  const [usageStats, setUsageStats] = useState({
    searchLimit: 20,
    searchUsed: 0,
    reviewLimit: 5,
    reviewUsed: 0,
    plan: 'Loading...'
  });

  useEffect(() => {
    if (user?.id) {
      const fetchUserQuota = async () => {
        try {
          const response = await axios.get(`https://research-archive-rosy.vercel.app/api/user/quota/${user.id}`);
          if (response.data.success) {
            const data = response.data.data;
            setUsageStats({
              searchLimit: data.searchLimit,
              searchUsed: data.searchUsed,
              reviewLimit: data.reviewLimit,
              reviewUsed: data.reviewUsed,
              plan: data.plan || 'Basic Scholar'
            });
          }
        } catch (error) {
          console.error("Failed to fetch real quota:", error);
          toast.error("Could not sync usage data.");
        }
      };
      fetchUserQuota();
    }
  }, [user?.id]);

  const searchPercentage = (usageStats.searchUsed / usageStats.searchLimit) * 100;
  const reviewPercentage = (usageStats.reviewUsed / usageStats.reviewLimit) * 100;

  if (!isLoaded) {
    return (
      <div className="h-[calc(100vh-76px)] flex justify-center items-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-76px)] bg-slate-50 text-slate-900 font-sans pb-24 relative">
      <Toaster position="bottom-right" />

      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

      <div className="max-w-[1200px] mx-auto px-6 pt-12 relative z-10">

        {/* --- HEADER --- */}
        <div className="mb-12">
          <h1 className="font-serif text-4xl font-normal text-black mb-2">Account Settings</h1>
          <p className="text-slate-500 font-medium">Manage your research profile, subscription, and system usage.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* --- LEFT: SIDEBAR NAVIGATION --- */}
          <aside className="lg:col-span-3 space-y-2">
            {[
              { id: 'profile', label: 'Research Profile', icon: <FaUser /> },
              { id: 'usage', label: 'System Usage', icon: <FaChartLine /> },
              { id: 'billing', label: 'Subscription', icon: <FaCrown /> },
              { id: 'api', label: 'Developer API', icon: <FaKey /> },
              { id: 'security', label: 'Security', icon: <FaShieldAlt /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all rounded-sm
                  ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200'}
                `}
              >
                {tab.icon} {tab.label}
              </button>
            ))}

            <div className="pt-4 mt-4 border-t border-slate-200">
              <button
                onClick={() => signOut(() => navigate('/'))}
                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all rounded-sm text-red-600 hover:bg-red-50"
              >
                <FaSignOutAlt /> Sign Out
              </button>
            </div>
          </aside>

          {/* --- RIGHT: CONTENT PANEL --- */}
          <div className="lg:col-span-9 bg-white border border-slate-300 p-8 md:p-10 shadow-sm min-h-[500px]">

            {/* 1. Profile Tab */}
            {activeTab === 'profile' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-lg font-serif border-b border-slate-200 pb-4 mb-8">Personal Information</h2>
                <div className="flex flex-col md:flex-row gap-8 items-center mb-10 bg-slate-50 p-6 border border-slate-200">
                  <img src={user?.imageUrl} alt="Profile" className="w-24 h-24 rounded-full border-2 border-white shadow-md" />
                  <div>
                    <h3 className="text-xl font-bold text-black">{user?.fullName || "Scholar Name"}</h3>
                    <p className="text-sm text-slate-500 mb-2">{user?.primaryEmailAddress?.emailAddress}</p>
                    <span className="text-[10px] bg-slate-900 text-white px-2 py-1 uppercase tracking-widest font-bold rounded-sm">
                      {usageStats.plan}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                    <div className="p-3 bg-slate-50 border border-slate-200 text-sm font-medium rounded-sm">{user?.fullName}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                    <div className="p-3 bg-slate-50 border border-slate-200 text-sm font-medium rounded-sm">{user?.primaryEmailAddress?.emailAddress}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Usage Tab (Updated) */}
            {activeTab === 'usage' && (
              <div className="animate-in fade-in duration-300 space-y-10">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-8">
                  <h2 className="text-lg font-serif">Compute & Quota Usage</h2>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 uppercase tracking-widest rounded-sm">
                    {usageStats.plan} Plan
                  </span>
                </div>

                {/* Search Limit */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-700">AI Literature Searches</div>
                    <div className="text-sm font-mono font-bold text-slate-900">
                      {usageStats.searchUsed} <span className="text-slate-400">/ {usageStats.searchLimit}</span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full transition-all duration-1000 ${searchPercentage >= 100 ? 'bg-red-500' : 'bg-slate-900'}`}
                      style={{ width: `${Math.min(searchPercentage, 100)}%` }}
                    ></div>
                  </div>
                  {searchPercentage >= 100 ? (
                    <p className="text-[10px] text-red-600 font-bold tracking-wide uppercase">Quota exhausted. Upgrade for more capacity.</p>
                  ) : (
                    <p className="text-[10px] text-slate-400 font-medium tracking-wide italic text-right">Usage tracks your real-time API calls</p>
                  )}
                </div>

                {/* Synthesis Limit */}
                <div className="space-y-4 pt-4">
                  <div className="flex justify-between items-end">
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-700">Literature Syntheses</div>
                    <div className="text-sm font-mono font-bold text-slate-900">
                      {usageStats.reviewUsed} <span className="text-slate-400">/ {usageStats.reviewLimit}</span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full transition-all duration-1000 ${reviewPercentage >= 100 ? 'bg-red-500' : 'bg-blue-600'}`}
                      style={{ width: `${Math.min(reviewPercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Upgrade Promo (Show only if Basic) */}
                {usageStats.plan === 'Basic Scholar' && (
                  <div className="mt-8 bg-slate-50 border border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between gap-4 rounded-sm">
                    <div>
                      <h4 className="font-serif text-lg text-black mb-1">Scale your research?</h4>
                      <p className="text-xs text-slate-500 font-medium">Pro plans offer up to 500 searches and deep graph analysis.</p>
                    </div>
                    <button onClick={() => navigate('/pricing')} className="px-6 py-3 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors whitespace-nowrap rounded-sm">
                      View Pricing
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. Subscription Tab (Updated) */}
            {activeTab === 'billing' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-lg font-serif border-b border-slate-200 pb-4 mb-8">Current Subscription</h2>
                <div className="border-2 border-slate-900 p-8 flex flex-col md:flex-row justify-between items-center bg-slate-50 mb-8 rounded-sm shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] gap-6">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Tier</div>
                    <div className="text-3xl font-serif text-black">{usageStats.plan}</div>
                    <p className="text-xs text-slate-500 mt-2 font-medium">Managed via research credits system.</p>
                  </div>
                  {usageStats.plan === 'Basic Scholar' && (
                    <button onClick={() => navigate('/pricing')} className="px-6 py-3 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors rounded-sm">
                      Upgrade Tier
                    </button>
                  )}
                </div>
                <div className="bg-blue-50 border border-blue-100 p-4 flex gap-3 items-start rounded-sm">
                  <FaExclamationCircle className="text-blue-500 mt-0.5" />
                  <p className="text-xs text-blue-700 leading-relaxed font-medium">
                    Plan upgrades are processed via the Pricing terminal. Your limits will update instantly upon successful enrollment in a new tier.
                  </p>
                </div>
              </div>
            )}

            {/* 4. API Tab */}
            {activeTab === 'api' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-lg font-serif border-b border-slate-200 pb-4 mb-8">Developer API Access</h2>
                <div className="p-12 text-center border-2 border-dashed border-slate-200 bg-slate-50 rounded-sm">
                  <FaKey className="mx-auto text-slate-300 text-4xl mb-4" />
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-2">API Keys Restricted</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed mb-6">
                    API access is restricted to Institutional tiers only. Build powerful research applications with our endpoint.
                  </p>
                  <button onClick={() => navigate('/pricing')} className="text-[10px] font-bold text-black border-b-2 border-black pb-1 hover:text-slate-600 transition-colors uppercase tracking-widest">
                    Explore Developer Plans <FaArrowRight className="inline ml-1" />
                  </button>
                </div>
              </div>
            )}

            {/* 5. Security Tab */}
            {activeTab === 'security' && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-lg font-serif border-b border-slate-200 pb-4 mb-8">Account Security</h2>
                <p className="text-sm text-slate-500 mb-6">Your authentication and data security are managed by Clerk and MongoDB encryption.</p>
                <button className="px-6 py-3 bg-white border border-slate-300 text-slate-700 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors rounded-sm">
                  Manage Auth Credentials
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;