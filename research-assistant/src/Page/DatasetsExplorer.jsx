import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '@clerk/react'; 
import { 
  FaArrowLeft, FaDatabase, FaSearch, FaLink, FaLayerGroup, FaFileAlt, FaSpinner, FaExternalLinkAlt, FaProjectDiagram 
} from 'react-icons/fa';

const DatasetsExplorer = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDataset, setSelectedDataset] = useState(null);

  useEffect(() => {
    const fetchDatasets = async () => {
      if (!user?.id) return;
      try {
        const response = await axios.get(`http://localhost:5000/api/papers/saved?clerkId=${user.id}`);
        if (response.data.success) {
          const savedPapers = response.data.data;
          const papersWithDatasets = savedPapers.filter(paper => paper.hasDataset);

          const groupedData = papersWithDatasets.reduce((acc, paper) => {
            const dsName = paper.dataset;
            if (!acc[dsName]) {
              acc[dsName] = {
                id: dsName,
                name: dsName,
                description: `Dataset referenced across multiple saved manuscripts in your workspace.`,
                category: "Research Data",
                papers: [] 
              };
            }
            acc[dsName].papers.push({
              id: paper.paperId,
              title: paper.title,
              year: paper.year || "N/A"
            });
            return acc;
          }, {});

          setDatasets(Object.values(groupedData));
        }
      } catch (error) {
        console.error("Failed to fetch datasets:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDatasets();
  }, [user?.id]);

  const filteredDatasets = datasets.filter(ds => 
    ds.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    ds.papers.some(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-[calc(100vh-76px)] overflow-hidden bg-slate-50 text-slate-900 font-sans flex flex-col">
      
      {/* ========================================== */}
      {/* --- HEADER --- */}
      {/* ========================================== */}
      <div className="bg-white border-b border-slate-300 shrink-0">
        <div className="w-full px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="w-full md:w-1/3 text-center md:text-left flex flex-col items-start">
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center gap-2 text-slate-400 hover:text-black text-md font-bold uppercase tracking-widest mb-2 transition-colors"
            >
              <FaArrowLeft className='text-sm font-serif' /> Back
            </button>
            <h1 className="font-serif text-4xl font-normal text-black tracking-tight">
              Asset Repository
            </h1>
          </div>

          <div className="w-full md:w-1/3 flex justify-center">
            <div className="w-full max-w-md relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search datasets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-black outline-none shadow-sm text-sm transition-all rounded-sm"
              />
            </div>
          </div>

          <div className="w-full md:w-1/3 hidden md:flex justify-end items-center">
             <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Found</p>
                <p className="font-mono font-bold text-lg text-black">{filteredDatasets.length}</p>
             </div>
          </div>

        </div>
      </div>

     
      <div className="flex-1 flex min-h-0">
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="max-w-[1200px] mx-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <FaSpinner className="text-3xl text-slate-900 animate-spin mb-4" />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Scanning Workspace...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
                  {filteredDatasets.map((ds) => (
                    <div 
                      key={ds.id} 
                      className={`bg-white border p-6 transition-all group flex flex-col cursor-pointer ${
                        selectedDataset?.name === ds.name ? 'border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] -translate-y-1' : 'border-slate-200 hover:border-slate-400'
                      }`}
                      onClick={() => setSelectedDataset(ds)} 
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-slate-50 text-slate-900 rounded-sm">
                          <FaDatabase size={16} />
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest border border-slate-200 px-2 py-0.5">
                          {ds.category}
                        </span>
                      </div>

                      <h3 className="font-serif text-lg font-bold text-black mb-2 group-hover:text-blue-600 transition-colors">
                        {ds.name}
                      </h3>
                      
                      <p className="text-xs text-slate-500 leading-relaxed mb-6 flex-1">
                        {ds.description}
                      </p>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-400">
                          <FaFileAlt size={10} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            {ds.papers.length} Papers
                          </span>
                        </div>
                        
                        <button 
                          className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all px-3 py-1.5 ${
                            selectedDataset?.name === ds.name ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                          }`}
                        >
                          Connections <FaLink />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredDatasets.length === 0 && (
                  <div className="text-center py-20">
                    <FaLayerGroup className="mx-auto text-slate-200 text-5xl mb-4" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No matching datasets</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="w-[350px] lg:w-[400px] shrink-0 bg-white border-l border-slate-200 flex flex-col shadow-[-4px_0_15px_-10px_rgba(0,0,0,0.05)] z-10">
          
          {!selectedDataset ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
              <FaProjectDiagram className="text-5xl text-slate-200 mb-6" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Awaiting Selection</p>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-[200px]">
                Click on any dataset card from the left grid to view all associated manuscripts and connections here.
              </p>
            </div>
          ) : (
           
            <>
              <div className="bg-slate-900 p-6 shrink-0 shadow-md z-10">
                <div className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <FaDatabase /> Mapped Connections
                </div>
                <h2 className="font-serif text-lg font-medium text-white line-clamp-2 leading-snug">
                  {selectedDataset.name}
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-50 space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">
                  Found {selectedDataset.papers.length} Linked Manuscripts:
                </p>

                {selectedDataset.papers.map((paper, idx) => (
                  <div key={paper.id} className="bg-white border border-slate-200 p-4 shadow-sm hover:border-blue-400 transition-colors group relative">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Paper #{idx + 1} • {paper.year}
                    </div>
                    <h3 className="font-serif text-sm font-medium text-slate-900 mb-3 leading-snug pr-4">
                      {paper.title}
                    </h3>
                    <button 
                      onClick={() => navigate(`/paper/${paper.id}`)}
                      className="text-[9px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 hover:text-blue-800 transition-colors"
                    >
                      View Source Details <FaExternalLinkAlt size={10} />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="p-4 border-t border-slate-200 bg-white shrink-0">
                 <p className="text-[10px] text-slate-500 text-center font-medium">
                   Access detailed AI analysis via manuscript profiles.
                 </p>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};

export default DatasetsExplorer;