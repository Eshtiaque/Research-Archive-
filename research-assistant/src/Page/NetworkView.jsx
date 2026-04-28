import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';
import axios from 'axios';
import { useUser } from "@clerk/react";
import { FaArrowLeft, FaDatabase, FaFileAlt, FaProjectDiagram } from 'react-icons/fa';

const NetworkGraph = () => {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();

  const fgRef = useRef();
  const containerRef = useRef(null);

  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [stats, setStats] = useState({ total: 0, datasets: 0 });
  const [rawPapers, setRawPapers] = useState([]);
  const [uniqueDatasets, setUniqueDatasets] = useState([]);

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

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchGraphContent = async () => {
      try {
        const response = await axios.get(`https://research-archive-rosy.vercel.app/api/papers/saved?clerkId=${user.id}`);

        if (response.data.success) {
          const papers = response.data.data;
          setRawPapers(papers);

          const nodes = [];
          const links = [];
          const datasetMap = new Map();

          papers.forEach((paper) => {
            const actualPaperId = paper.paperId || paper.id || paper._id;

            nodes.push({
              id: actualPaperId,
              name: paper.title,
              authors: paper.authors,
              year: paper.year,
              hasDataset: paper.hasDataset,
              datasetName: paper.dataset || "Extracted Dataset",
              val: 6,
              color: '#64748b',
              type: 'paper'
            });

            if (paper.hasDataset) {
              const dsName = paper.dataset || "Extracted Dataset";
              const dsId = `dataset-${dsName.toLowerCase().replace(/\s+/g, '-')}`;

              if (!datasetMap.has(dsId)) {
                datasetMap.set(dsId, dsName);
                nodes.push({
                  id: dsId,
                  name: dsName,
                  val: 14,
                  color: '#2563eb',
                  type: 'dataset'
                });
              }

              links.push({ source: dsId, target: actualPaperId });
            }
          });

          const dSets = Array.from(datasetMap).map(([id, name]) => ({ id, name }));
          setUniqueDatasets(dSets);

          setGraphData({ nodes, links });
          setStats({
            total: papers.length,
            datasets: dSets.length,
          });
        }
      } catch (error) {
        console.error('Graph fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGraphContent();
  }, [isLoaded, user?.id]);

  const handleNodeClick = useCallback(
    (node) => {
      if (!fgRef.current) return;

      fgRef.current.centerAt(node.x, node.y, 800);
      fgRef.current.zoom(4, 800);

      setSelectedNode(node.type === 'paper' ? node : null);
    },
    [fgRef]
  );

  const focusOnNode = (nodeId) => {
    const targetNode = graphData.nodes.find(n => n.id === nodeId);
    if (targetNode) {
      handleNodeClick(targetNode);
    }
  };

  const drawNode = (node, ctx, globalScale) => {
    const isSelected = selectedNode && selectedNode.id === node.id;
    const isDataset = node.type === 'dataset';

    ctx.beginPath();
    ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
    ctx.fillStyle = node.color;
    ctx.fill();

    ctx.lineWidth = isSelected ? 4 / globalScale : 2 / globalScale;
    ctx.strokeStyle = isSelected ? '#0f172a' : '#ffffff';
    ctx.stroke();


    const showText = isDataset ? globalScale > 0.8 : globalScale > 1.5;

    if (showText) {
      const label = node.name;
      const fontSize = isDataset ? 14 / globalScale : 10 / globalScale;

      ctx.font = `${isDataset ? 'bold' : '600'} ${fontSize}px Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = isDataset ? '#1e3a8a' : '#475569';

      const displayText = label.length > 25 ? label.substring(0, 25) + '...' : label;

      ctx.fillText(displayText, node.x, node.y + node.val + (3 / globalScale));
    }
  };

  return (
    <div className="flex h-[calc(100vh-76px)] w-full overflow-hidden bg-white text-slate-900 font-sans selection:bg-slate-200">

      {/* ── LEFT SIDEBAR ── */}
      <aside className="relative z-20 flex w-[480px] flex-shrink-0 flex-col border-r border-slate-200 bg-white shadow-xl">
        <div className="flex flex-col gap-6 p-8 pb-8 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-12 h-12 flex items-center justify-center text-slate-500 hover:text-black bg-white border border-slate-200 hover:border-black rounded-full transition-colors cursor-pointer shadow-sm"
            >
              <FaArrowLeft size={16} />
            </button>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-1">
                <FaProjectDiagram /> Topology Matrix
              </div>
              <h1 className="font-serif text-3xl font-normal text-black leading-tight">
                Network Index
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="bg-white border border-slate-200 p-5 rounded-sm shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manuscripts</p>
              <p className="mt-2 text-3xl font-serif text-black">{stats.total}</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 p-5 rounded-sm shadow-sm">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Active Datasets</p>
              <p className="mt-2 text-3xl font-serif text-slate-700">{stats.datasets}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar flex flex-col gap-10">
          {uniqueDatasets.length > 0 && (
            <div>
              <p className="text-sm font-bold text-black uppercase tracking-[0.2em] border-b-2 border-black pb-3 mb-5 flex items-center gap-2">
                <FaDatabase className="text-slate-400" /> Core Datasets
              </p>
              <div className="grid grid-cols-2 gap-3">
                {uniqueDatasets.map((ds) => (
                  <button
                    key={ds.id}
                    onClick={() => focusOnNode(ds.id)}
                    className="text-left bg-white border border-slate-200 p-4 hover:border-blue-500 hover:shadow-md transition-all rounded-sm flex flex-col justify-center"
                  >
                    <span className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug">
                      {ds.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-bold text-black uppercase tracking-[0.2em] border-b-2 border-black pb-3 mb-5 flex items-center gap-2">
              <FaFileAlt className="text-slate-400" /> All Manuscripts
            </p>
            <div className="grid grid-cols-2 gap-3">
              {rawPapers.map((paper) => {
                const actualId = paper.paperId || paper.id || paper._id;
                return (
                  <button
                    key={`p-${actualId}`}
                    onClick={() => focusOnNode(actualId)}
                    className="text-left text-sm font-medium text-slate-600 hover:text-black bg-slate-50 hover:bg-white border border-transparent hover:border-slate-300 p-3 rounded-sm transition-all line-clamp-3 leading-relaxed"
                    title={paper.title}
                  >
                    {paper.title}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </aside>

      {/* ── MIDDLE: 2D CANVAS AREA ── */}
      <main ref={containerRef} className="relative flex-1 overflow-hidden bg-white">
        <div className="absolute inset-0 z-0 opacity-[0.05]"
          style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
        </div>

        {loading ? (
          <div className="flex h-full w-full flex-col items-center justify-center z-10 relative">
            <div className="w-20 h-20 border-2 border-slate-900 bg-slate-50 flex items-center justify-center mb-6 relative">
              <div className="absolute w-full h-full border border-slate-300 animate-ping opacity-20"></div>
              <div className="w-6 h-6 bg-black animate-spin"></div>
            </div>
            <p className="text-sm font-bold text-black uppercase tracking-widest mb-1">Mapping Topologies...</p>
          </div>
        ) : (
          <div className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing">
            {dimensions.width > 0 && (
              <ForceGraph2D
                ref={fgRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={graphData}
                backgroundColor="rgba(0,0,0,0)"
                nodeCanvasObject={drawNode}
                nodePointerAreaPaint={(node, color, ctx) => {
                  ctx.fillStyle = color;
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
                  ctx.fill();
                }}
                linkColor={() => '#cbd5e1'}
                linkWidth={1.5}
                linkDirectionalParticles={3}
                linkDirectionalParticleWidth={2}
                linkDirectionalParticleSpeed={0.004}
                linkDirectionalParticleColor={() => '#94a3b8'}
                onNodeClick={handleNodeClick}
                d3AlphaDecay={0.05}
                d3VelocityDecay={0.3}
                cooldownTicks={150}
                onEngineStop={() => {
                  if (fgRef.current) fgRef.current.zoomToFit(400, 50);
                }}
              />
            )}
          </div>
        )}

        {/* Hints */}
        <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm border border-slate-200 px-6 py-3 rounded-sm shadow-sm flex items-center gap-4 text-xs font-bold text-slate-600 uppercase tracking-widest pointer-events-none z-20">
          <span>Drag Canvas: Pan</span>
          <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
          <span>Scroll: Zoom</span>
        </div>
      </main>

      {/* ── RIGHT SIDEBAR ── */}
      <aside className="relative z-20 flex w-[350px] flex-shrink-0 flex-col border-l border-slate-200 bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.03)]">
        <div className="p-8 pb-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <FaFileAlt className="text-slate-400" size={18} />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Inspector</span>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {selectedNode && selectedNode.type === 'paper' ? (
            <div className="animate-in fade-in slide-in-from-right-4">
              <h3 className="font-serif text-2xl font-normal text-black mb-4 leading-snug">
                {selectedNode.name}
              </h3>

              <p className="text-sm text-slate-600 mb-8 font-medium leading-relaxed border-l-2 border-slate-200 pl-4">
                {selectedNode.authors}
              </p>

              {selectedNode.hasDataset && (
                <div className="mb-8 flex items-center gap-2 text-xs font-bold text-slate-700 bg-blue-50 border border-blue-100 px-3 py-2 rounded-sm w-fit uppercase tracking-wider">
                  <FaDatabase /> {selectedNode.datasetName || "Verified Dataset"}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate(`/paper/${selectedNode.id}`)}
                  className="w-full bg-slate-900 text-white text-xs font-bold uppercase tracking-widest py-4 hover:bg-black transition-colors rounded-sm shadow-sm"
                >
                  Full Analysis
                </button>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-widest py-4 transition-colors rounded-sm border border-slate-200"
                >
                  Deselect Node
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <FaProjectDiagram className="text-5xl text-slate-300 mb-4" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">No Selection</p>
              <p className="text-xs text-slate-500 font-medium px-4">Click on a manuscript node to view metadata</p>
            </div>
          )}
        </div>
      </aside>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default NetworkGraph;