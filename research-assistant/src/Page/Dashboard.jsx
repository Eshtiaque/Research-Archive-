import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ForceGraph2D from 'react-force-graph-2d';
import { useUser } from "@clerk/react";
import {
  FaSpinner, FaFilter, FaSortAmountDown,
  FaExternalLinkAlt, FaRobot, FaProjectDiagram,
  FaUserEdit, FaDatabase, FaMicrochip, FaBookmark
} from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';

const SkeletonRow = () => (
  <tr className="border-b border-slate-200 animate-pulse bg-white">
    <td className="p-5 w-[5%]"><div className="h-5 w-5 bg-slate-200 rounded-sm mx-auto"></div></td>
    <td className="p-5 w-[35%]"><div className="h-5 bg-slate-200 rounded-sm w-3/4 mb-3"></div><div className="h-3 bg-slate-200 rounded-sm w-1/2"></div></td>
    <td className="p-5 w-[10%]"><div className="h-4 bg-slate-200 rounded-sm w-12 mx-auto"></div></td>
    <td className="p-5 w-[15%]"><div className="h-6 bg-slate-200 rounded-sm w-12 mx-auto"></div></td>
    <td className="p-5 w-[25%]"><div className="h-4 bg-slate-200 rounded-sm w-24"></div></td>
    <td className="p-5 w-[10%]"><div className="h-8 bg-slate-200 rounded-sm w-8 mx-auto"></div></td>
  </tr>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [loading, setLoading] = useState(!!query);
  const [results, setResults] = useState([]);

  // Filter & Sort States
  const [filterYear, setFilterYear] = useState('All');
  const [filterDomain, setFilterDomain] = useState('All');
  const [filterDataset, setFilterDataset] = useState('All');
  const [sortBy, setSortBy] = useState('Match');

  const hasSearched = !!query;

  const paymentStatus = searchParams.get('payment');
  const planName = searchParams.get('plan');

  useEffect(() => {
    const confirmPayment = async () => {
      if (paymentStatus === 'success' && planName && user?.id) {
        const toastId = toast.loading("Confirming your Pro upgrade...");

        try {
          const response = await axios.post('https://research-archive-rosy.vercel.app/api/payment/update-subscription', {
            clerkId: user.id,
            planName: planName
          });

          if (response.data.success) {
            toast.success("Welcome to Pro Researcher! Limits updated.", { id: toastId });

            navigate('/dashboard', { replace: true });

            setTimeout(() => {
              window.location.reload();
            }, 1500);
          }
        } catch (error) {
          console.error("Upgrade Error:", error);
          toast.error("Error confirming upgrade.", { id: toastId });
        }
      } else if (paymentStatus === 'cancelled') {
        toast.error("Payment was cancelled.");
        navigate('/pricing', { replace: true });
      }
    };

    if (isLoaded && user) {
      confirmPayment();
    }
  }, [paymentStatus, planName, user, isLoaded, navigate]);

  // --- Mini Graph Refs & States ---
  const fgRef = useRef();
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    if (hasSearched && !loading) {
      const timeout = setTimeout(updateDimensions, 50);
      window.addEventListener('resize', updateDimensions);
      return () => {
        clearTimeout(timeout);
        window.removeEventListener('resize', updateDimensions);
      };
    }
  }, [hasSearched, loading]);

  console.log("🔥 Dashboard component is rendering! URL:", window.location.pathname);
  useEffect(() => {
    console.log("🛠️ useEffect triggered. isLoaded:", isLoaded, "User ID:", user?.id);

    const syncUser = async () => {
      if (!isLoaded) {
        console.log("⏳ Clerk is still loading...");
        return;
      }

      if (!user?.id) {
        console.log("👤 No user found yet.");
        return;
      }

      try {
        console.log("📡 Sending API Request to Backend...");

        const syncData = {
          clerkId: user.id,
          name: user.fullName || "User",
          email: user.primaryEmailAddress?.emailAddress
        };

        const response = await axios.post('https://research-archive-rosy.vercel.app/api/user/sync', syncData);

        console.log("✅ Server Response:", response.data);

        if (response.data.success) {
          console.log("🏆 Sync Success in Database!");
        }
      } catch (error) {
        console.error("❌ API Call Failed:", error.message);
      }
    };

    syncUser();
  }, [isLoaded, user]);

  useEffect(() => {
    if (!query || !user?.id) return;

    const timer = setTimeout(() => {
      const fetchPapers = async () => {
        setLoading(true);
        try {
          const response = await axios.get(`https://research-archive-rosy.vercel.app/api/papers/search?q=${query}&limit=30&clerkId=${user.id}`);

          const apiData = response.data.data.map((paper) => {
            let rawScore = paper.relevance_score || 0.95;
            let calculatedScore = Math.min(Math.round((rawScore / 10) * 100) + 75, 99);

            return {
              id: paper.id,
              title: paper.title,
              authors: Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors,
              year: parseInt(paper.publishedYear) || 0,
              similarity: calculatedScore,
              dataset: paper.dataset,
              hasDataset: paper.hasDataset
            };
          });

          setResults(apiData);
        } catch (error) {
          console.error("Error fetching papers:", error);

          if (error.response && error.response.status === 403) {
            toast.error("Quota Exceeded! Please upgrade to Pro for more searches.", {
              icon: '⚠️',
              style: {
                borderRadius: '4px',
                background: '#0f172a',
                color: '#fff',
              },
            });
          } else {
            toast.error("Failed to fetch search results.");
          }

          setResults([]);
        } finally {
          setLoading(false);
        }
      };

      fetchPapers();
    }, 1000);

    return () => clearTimeout(timer);
  }, [query, user?.id]);

  const handleSaveToWorkspace = async (paper) => {
    if (!user?.id) {
      toast.error("User ID missing. Please log in again.");
      return;
    }

    const toastId = toast.loading('Saving to Workspace...');

    try {
      const paperData = {
        ...paper,
        clerkId: user.id
      };

      const response = await axios.post('https://research-archive-rosy.vercel.app/api/papers/save', paperData);

      if (response.data.success) {
        toast.success('Saved to Workspace successfully!', { id: toastId });
      }
    } catch (error) {
      console.error("Save Error:", error.response?.data);
      if (error.response && error.response.status === 400) {
        toast.error('This paper is already in your Workspace!', { id: toastId });
      } else {
        toast.error('Failed to save paper.', { id: toastId });
      }
    }
  };

  const filteredResults = results.filter(paper => {
    const datasetMatch = filterDataset === 'All' || (filterDataset === 'Has Dataset' ? paper.hasDataset : !paper.hasDataset);
    const yearMatch = filterYear === 'All' || (filterYear === '2022' ? paper.year <= 2022 : paper.year.toString() === filterYear);
    return datasetMatch && yearMatch;
  }).sort((a, b) => {
    if (sortBy === 'Year') {
      return b.year - a.year;
    }
    return b.similarity - a.similarity;
  });

  const miniGraphData = useMemo(() => {
    const nodes = [];
    const links = [];
    const datasetMap = new Map();

    const qNode = query || 'Query';
    nodes.push({ id: 'query-hub', name: qNode, val: 12, color: '#000000' });

    filteredResults.forEach(paper => {
      nodes.push({ id: paper.id, name: paper.title, val: 4, color: '#64748b' });

      if (paper.hasDataset && paper.dataset) {
        const dsId = `ds-${paper.dataset}`;
        if (!datasetMap.has(dsId)) {
          datasetMap.set(dsId, paper.dataset);
          nodes.push({ id: dsId, name: paper.dataset, val: 8, color: '#2563eb' });
          links.push({ source: 'query-hub', target: dsId });
        }
        links.push({ source: dsId, target: paper.id });
      } else {
        links.push({ source: 'query-hub', target: paper.id });
      }
    });

    return { nodes, links };
  }, [filteredResults, query]);

  const drawMiniNode = useCallback((node, ctx, globalScale) => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
    ctx.fillStyle = node.color;
    ctx.fill();
    ctx.lineWidth = 1.5 / globalScale;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  }, []);

  return (
    <div className="h-[calc(100vh-76px)] overflow-hidden bg-slate-50 text-slate-900 font-sans selection:bg-slate-200">
      <Toaster position="bottom-right" reverseOrder={false} />
      <div className="max-w-[1600px] mx-auto w-full px-6 py-6 h-full flex flex-col">

        {/* --- 1. FILTERS SECTION --- */}
        <div className="mb-6 pb-4 border-slate-200 flex flex-wrap items-center gap-4 shrink-0">
          <div className="flex items-center gap-2 text-xs text-black font-bold uppercase tracking-widest mr-2">
            <FaFilter className="text-slate-400" /> Parameters:
          </div>

          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="bg-white border border-slate-300 text-slate-700 text-xs font-medium px-4 py-2 focus:outline-none focus:border-black rounded-sm cursor-pointer shadow-sm">
            <option value="All">Year: All Time</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>

          <select value={filterDomain} onChange={(e) => setFilterDomain(e.target.value)} className="bg-white border border-slate-300 text-slate-700 text-xs font-medium px-4 py-2 focus:outline-none focus:border-black rounded-sm cursor-pointer shadow-sm">
            <option value="All">Domain: All</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Energy">Energy Storage</option>
          </select>

          <select value={filterDataset} onChange={(e) => setFilterDataset(e.target.value)} className="bg-white border border-slate-300 text-slate-700 text-xs font-medium px-4 py-2 focus:outline-none focus:border-black rounded-sm cursor-pointer shadow-sm">
            <option value="All">Dataset: Any</option>
            <option value="Has Dataset">Has Dataset</option>
            <option value="No Dataset">No Dataset</option>
          </select>

          <div className="flex-1"></div>

          <button
            onClick={() => setSortBy(prev => prev === 'Match' ? 'Year' : 'Match')}
            className="flex items-center gap-2 text-xs bg-slate-900 hover:bg-black text-white font-bold uppercase tracking-widest px-5 py-2.5 rounded-sm transition-colors shadow-sm"
          >
            <FaSortAmountDown /> Sort by {sortBy}
          </button>
        </div>

        {/* --- 2. MAIN CONTENT --- */}
        <div className="flex-1 flex flex-col lg:flex-row gap-8 relative items-start min-h-0">

          {/* --- LEFT: Paper List --- */}
          <div className="w-full lg:w-[60%] h-full flex flex-col border border-slate-300 bg-white shadow-sm overflow-hidden rounded-sm">
            {!hasSearched && !loading ? (
              <div className="flex-1 text-center p-20 flex flex-col justify-center bg-slate-50">
                <FaRobot className="mx-auto text-4xl mb-4 text-slate-300" />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Awaiting Query Execution</p>
                <p className="text-xs text-slate-400 mt-2">Use the search bar in the navigation menu to populate the archive index.</p>
              </div>
            ) : (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="overflow-hidden bg-slate-100 border-b-2 border-slate-900 shrink-0">
                  <table className="w-full text-left table-fixed">
                    <thead>
                      <tr>
                        <th className="p-4 text-center w-[5%]"></th>
                        <th className="p-4 text-xs font-bold text-black uppercase tracking-widest border-l border-slate-300 w-[35%]">Manuscript Details</th>
                        <th className="p-4 text-center text-xs font-bold text-black uppercase tracking-widest border-l border-slate-300 w-[10%]">Year</th>
                        <th className="p-4 text-center text-xs font-bold text-black uppercase tracking-widest border-l border-slate-300 w-[15%]">Match</th>
                        <th className="p-4 text-xs font-bold text-black uppercase tracking-widest border-l border-slate-300 w-[25%]">Dataset</th>
                        <th className="p-4 text-center text-xs font-bold text-black uppercase tracking-widest border-l border-slate-300 w-[10%]">View</th>
                      </tr>
                    </thead>
                  </table>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left table-fixed">
                    <tbody>
                      {loading ? [1, 2, 3, 4, 5, 6, 7].map(i => <SkeletonRow key={i} />) :
                        filteredResults.map(paper => (
                          <tr key={paper.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors group">

                            <td className="p-5 text-center w-[5%]">
                              <button
                                onClick={() => handleSaveToWorkspace(paper)}
                                className="text-slate-300 hover:text-blue-600 transition-colors"
                                title="Save to Workspace"
                              >
                                <FaBookmark size={16} />
                              </button>
                            </td>

                            <td className="p-5 w-[35%]">
                              <div className="font-serif text-[1.05rem] font-medium text-slate-900 mb-2 line-clamp-2">
                                {paper.title}
                              </div>
                              <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 uppercase tracking-wide">
                                <FaUserEdit className="text-slate-400" /> {paper.authors}
                              </div>
                            </td>

                            <td className="p-5 text-center w-[10%]">
                              <span className="text-sm font-semibold text-slate-600">{paper.year}</span>
                            </td>

                            <td className="p-5 text-center w-[15%]">
                              <span className="font-mono text-sm font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-sm">{paper.similarity}%</span>
                            </td>

                            <td className="p-5 w-[25%]">
                              <div className="flex items-center gap-2 text-xs font-medium">
                                {paper.hasDataset ? (
                                  <>
                                    <FaDatabase className="text-slate-400 shrink-0" />
                                    <span className="text-slate-700 truncate">{paper.dataset}</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-slate-400 italic">None Extracted</span>
                                  </>
                                )}
                              </div>
                            </td>

                            <td className="p-5 text-center w-[10%]">
                              <button
                                onClick={() => navigate(`/paper/${paper.id}`, { state: { matchScore: paper.similarity } })}
                                className="w-8 h-8 mx-auto flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-900 transition-colors group/btn"
                                title="Open Details"
                              >
                                <FaExternalLinkAlt className="text-slate-500 group-hover/btn:text-white transition-colors" size={12} />
                              </button>
                            </td>
                          </tr>
                        ))
                      }
                      {!loading && filteredResults.length === 0 && (
                        <tr>
                          <td colSpan="6" className="text-center p-16 text-slate-500 text-sm font-medium">
                            No manuscripts match the selected filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Topological Network (Mini Interactive View)  */}
          <div className="hidden lg:flex lg:w-[40%] h-full bg-white border border-slate-300 flex-col relative overflow-hidden rounded-sm shadow-sm">
            <div className="bg-slate-50 border-b-2 border-slate-900 p-4 shrink-0 flex justify-between items-center z-20">
              <h3 className="text-xs font-bold text-black uppercase tracking-[0.2em] flex items-center gap-2">
                <FaProjectDiagram className="text-slate-500" /> Live Mini Topology
              </h3>
              <button
                onClick={() => navigate('/network')}
                className="flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-black uppercase tracking-widest transition-colors"
                title="Expand to Full Screen"
              >
                Expand Saved Map <FaExternalLinkAlt size={10} />
              </button>
            </div>

            <div className="flex-1 relative bg-white overflow-hidden group" ref={containerRef}>
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

              {hasSearched && !loading ? (
                <>
                  <div className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing">
                    {dimensions.width > 0 && (
                      <ForceGraph2D
                        ref={fgRef}
                        width={dimensions.width}
                        height={dimensions.height}
                        graphData={miniGraphData}
                        backgroundColor="rgba(0,0,0,0)"
                        nodeCanvasObject={drawMiniNode}
                        linkColor={() => '#cbd5e1'}
                        linkWidth={1}
                        linkDirectionalParticles={2}
                        linkDirectionalParticleWidth={1.5}
                        linkDirectionalParticleSpeed={0.005}
                        linkDirectionalParticleColor={() => '#94a3b8'}
                        showNavInfo={false}
                        enableZoomInteraction={false}
                        enablePanInteraction={true}
                        enableNodeDrag={false}
                        d3AlphaDecay={0.02}
                        d3VelocityDecay={0.3}
                        cooldownTicks={100}
                        onEngineStop={() => {
                          if (fgRef.current) {
                            fgRef.current.zoomToFit(200, 20);
                          }
                        }}
                      />
                    )}
                  </div>

                  <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-white via-white/80 to-transparent z-20 flex justify-between items-end pointer-events-none">
                    <div>
                      <div className="text-[10px] font-bold text-black uppercase tracking-widest mb-1 flex items-center gap-1.5 pointer-events-auto">
                        <FaMicrochip className="text-blue-600" /> Active Search Matrix
                      </div>
                      <p className="text-[9px] text-slate-500 font-medium pointer-events-auto">Showing live topology of current results.</p>
                    </div>
                    <button
                      onClick={() => navigate('/network')}
                      className="bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest px-4 py-2 hover:bg-black transition-colors shadow-md pointer-events-auto"
                    >
                      Open Full Saved Map
                    </button>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center">
                  {loading ? (
                    <>
                      <div className="w-16 h-16 border-2 border-slate-900 bg-slate-50 flex items-center justify-center mb-4 relative">
                        <div className="absolute w-full h-full border border-slate-300 animate-ping opacity-20"></div>
                        <FaSpinner className="text-black text-2xl animate-spin" />
                      </div>
                      <p className="text-xs font-bold text-black uppercase tracking-widest mb-1">Compiling Nodes...</p>
                      <p className="text-[10px] text-slate-500">Fetching live API data.</p>
                    </>
                  ) : (
                    <>
                      <FaProjectDiagram className="text-slate-200 text-5xl mb-4" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Network Visualization Offline</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;