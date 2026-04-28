import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheck, FaArrowRight, FaLock, FaSpinner } from 'react-icons/fa';
import { useUser } from '@clerk/react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const Pricing = () => {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('Basic Scholar');
  const [fetchingPlan, setFetchingPlan] = useState(true);

  useEffect(() => {
    const fetchUserPlan = async () => {
      if (isLoaded && user) {
        try {
          const response = await axios.post('http://localhost:5000/api/user/sync', {
            clerkId: user.id,
            name: user.fullName || "User",
            email: user.primaryEmailAddress?.emailAddress
          });
          if (response.data.success) {
            setCurrentPlan(response.data.data.plan);
          }
        } catch (error) {
          console.error("Failed to fetch plan:", error);
        } finally {
          setFetchingPlan(false);
        }
      } else if (isLoaded && !user) {
        setFetchingPlan(false);
      }
    };
    fetchUserPlan();
  }, [isLoaded, user]);

  const handleUpgrade = async (planName, price) => {
    if (!user) {
      toast.error("Please log in to upgrade your plan.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Connecting to secure payment gateway...");

    try {
      const response = await axios.post('http://localhost:5000/api/payment/create-checkout-session', {
        clerkId: user.id,
        planName: planName,
        price: price
      });

      if (response.data.success && response.data.url) {
        toast.success("Redirecting to Stripe...", { id: toastId });
        window.location.href = response.data.url; 
      }
    } catch (error) {
      console.error("Payment Error:", error);
      toast.error("Failed to start payment process. Please try again.", { id: toastId });
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 mt-10 bg-slate-50 font-sans flex flex-col justify-center px-6 selection:bg-slate-200 pb-24">
      <Toaster position="bottom-right" />
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Access Tiers</h2>
        <h1 className="font-serif text-4xl md:text-5xl font-normal text-black mb-6">
          Select Your Research Plan
        </h1>
        <p className="text-slate-600 font-medium">
          Choose the appropriate access tier for your literature review needs. Paid subscriptions are processed securely via Stripe.
        </p>
      </div>

      {/* Pricing Grid */}
      <div className="max-w-[1200px] w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* --- 1. FREE PLAN --- */}
        <div className="bg-white border border-slate-300 p-8 flex flex-col relative opacity-90 hover:opacity-100 transition-opacity">
          <div className="absolute top-0 right-0 bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-widest px-3 py-1 m-4">
            Current Default
          </div>
          <h3 className="text-xl font-bold text-black uppercase tracking-wider mb-2">Basic Scholar</h3>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl font-serif text-black">$0</span>
            <span className="text-slate-500 text-sm font-medium">/ forever</span>
          </div>
          <p className="text-sm text-slate-600 mb-8 font-medium">
            Essential tools for students and independent researchers to begin literature analysis.
          </p>
          
          <ul className="space-y-4 mb-10 flex-1">
            <li className="flex items-start gap-3 text-sm text-slate-700 font-medium"><FaCheck className="text-slate-400 mt-1 shrink-0" /> Up to 20 AI searches per month</li>
            <li className="flex items-start gap-3 text-sm text-slate-700 font-medium"><FaCheck className="text-slate-400 mt-1 shrink-0" /> 5 Synthesized Reviews per month</li>
            <li className="flex items-start gap-3 text-sm text-slate-700 font-medium"><FaCheck className="text-slate-400 mt-1 shrink-0" /> Basic Metadata Extraction</li>
          </ul>

          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full py-4 bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 border border-slate-300"
          >
            Enter Workspace <FaArrowRight size={10} />
          </button>
        </div>

        {/* --- 2. MONTHLY PLAN (Active - Stripe Connected) --- */}
        <div className="bg-white border-2 border-slate-900 p-8 flex flex-col relative shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] transition-transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 m-4">
            Recommended
          </div>
          <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wider mb-2">Pro Researcher</h3>
          
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl font-serif text-slate-400 line-through decoration-slate-300">$15</span>
            <span className="text-4xl font-serif text-black">$12</span>
            <span className="text-slate-500 text-sm font-medium">/ month</span>
          </div>
          
          <p className="text-sm text-slate-600 mb-8 font-medium">
            Advanced capabilities including topological graphs and deep AI synthesis.
          </p>
          
          <ul className="space-y-4 mb-10 flex-1">
            <li className="flex items-start gap-3 text-sm text-slate-800 font-medium"><FaCheck className="text-blue-600 mt-1 shrink-0" /> 500 AI searches per month</li>
            <li className="flex items-start gap-3 text-sm text-slate-800 font-medium"><FaCheck className="text-blue-600 mt-1 shrink-0" /> 50 Synthesized Reviews</li>
            <li className="flex items-start gap-3 text-sm text-slate-800 font-medium"><FaCheck className="text-blue-600 mt-1 shrink-0" /> Export to BibTeX & PDF</li>
          </ul>

          {currentPlan === 'Pro Researcher' ? (
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full py-4 bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 border border-green-600"
            >
              <FaCheck size={12} /> Active Plan - Go to Workspace
            </button>
          ) : (
            <button 
              onClick={() => handleUpgrade('Pro Researcher', 12)}
              disabled={loading || fetchingPlan}
              className="w-full py-4 bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 border border-slate-900 disabled:opacity-70 disabled:cursor-wait"
            >
              {loading || fetchingPlan ? (
                <><FaSpinner className="animate-spin" /> Processing...</>
              ) : (
                <>Upgrade to Pro <FaArrowRight size={10} /></>
              )}
            </button>
          )}
        </div>

        {/* --- 3. ANNUAL PLAN (Still Coming Soon) --- */}
        <div className="bg-white border border-slate-300 p-8 flex flex-col relative opacity-70">
          <div className="absolute top-0 right-0 bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 m-4 flex items-center gap-1.5">
            <FaLock size={8} /> Coming Soon
          </div>
          <h3 className="text-xl font-bold text-slate-800 uppercase tracking-wider mb-2">Institutional</h3>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl font-serif text-black">$120</span>
            <span className="text-slate-500 text-sm font-medium">/ year</span>
          </div>
          <p className="text-sm text-slate-600 mb-8 font-medium">
            Full API access and collaborative features for university labs and teams.
          </p>
          
          <ul className="space-y-4 mb-10 flex-1 opacity-70">
            <li className="flex items-start gap-3 text-sm text-slate-600 font-medium"><FaCheck className="text-slate-400 mt-1 shrink-0" /> Unlimited AI searches</li>
            <li className="flex items-start gap-3 text-sm text-slate-600 font-medium"><FaCheck className="text-slate-400 mt-1 shrink-0" /> Dedicated API Access</li>
            <li className="flex items-start gap-3 text-sm text-slate-600 font-medium"><FaCheck className="text-slate-400 mt-1 shrink-0" /> Shared Lab Workspaces</li>
          </ul>

          <button disabled className="w-full py-4 bg-slate-100 text-slate-400 text-xs font-bold uppercase tracking-widest border border-slate-200 cursor-not-allowed">
            In Development
          </button>
        </div>

      </div>
    </div>
  );
};

export default Pricing;