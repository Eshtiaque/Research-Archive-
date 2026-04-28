import React from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, { 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  MarkerType,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  FaArrowLeft, FaServer, FaBrain, 
  FaDatabase, FaLock, FaGlobe, FaCodeBranch, FaLayerGroup 
} from 'react-icons/fa';

const CustomNode = ({ data }) => {
  return (
    <div className="relative group px-6 py-5 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.05)] border border-white/20 backdrop-blur-md bg-white/95 w-[240px] transition-transform duration-300 hover:scale-105"
         style={{ borderLeft: `5px solid ${data.color}` }}>
      
      <div className="absolute top-4 right-4 flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: data.color }}></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: data.color }}></span>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-2xl mb-1">{data.icon}</span>
        <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">{data.title}</span>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{data.subtitle}</span>
      </div>

      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 !bg-slate-800 border-2 border-white" />
      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 !bg-slate-800 border-2 border-white" />
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

const initialNodes = [
  { id: 'frontend', type: 'custom', position: { x: 300, y: 50 }, data: { icon: '💻', title: 'Client Interface', subtitle: 'React.js UI', color: '#0f172a' } },
  { id: 'auth', type: 'custom', position: { x: 50, y: 220 }, data: { icon: '🔒', title: 'Authentication', subtitle: 'Clerk Secure Auth', color: '#9333ea' } },
  { id: 'backend', type: 'custom', position: { x: 300, y: 280 }, data: { icon: '⚙️', title: 'API Gateway', subtitle: 'Node.js Engine', color: '#2563eb' } },
  { id: 'openalex', type: 'custom', position: { x: 550, y: 220 }, data: { icon: '📚', title: 'Literature Index', subtitle: 'OpenAlex API', color: '#059669' } },
  { id: 'ai', type: 'custom', position: { x: 550, y: 450 }, data: { icon: '🧠', title: 'Neural Pipeline', subtitle: 'LangChain & Groq', color: '#4f46e5' } },
  { id: 'db', type: 'custom', position: { x: 50, y: 450 }, data: { icon: '🗄️', title: 'Workspace DB', subtitle: 'MongoDB Storage', color: '#f59e0b' } },
];

const initialEdges = [
  { id: 'e1', source: 'frontend', target: 'auth', type: 'smoothstep', animated: true, label: 'Verify', style: { stroke: '#9333ea', strokeWidth: 2 } },
  { id: 'e2', source: 'frontend', target: 'backend', type: 'smoothstep', animated: true, label: 'REST Payload', style: { stroke: '#2563eb', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#2563eb' } },
  { id: 'e3', source: 'backend', target: 'db', type: 'smoothstep', animated: true, label: 'Save Data', style: { stroke: '#f59e0b', strokeWidth: 2 } },
  { id: 'e4', source: 'backend', target: 'openalex', type: 'smoothstep', animated: true, label: 'Fetch Papers', style: { stroke: '#059669', strokeWidth: 2 } },
  { id: 'e5', source: 'backend', target: 'ai', type: 'smoothstep', animated: true, label: 'Process Abstract', style: { stroke: '#4f46e5', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4f46e5' } },
  { id: 'e6', source: 'openalex', target: 'ai', type: 'step', animated: true, label: 'Feed Data', style: { stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '5,5' } },
];

const Architecture = () => {
  const navigate = useNavigate();
  // eslint-disable-next-line no-unused-vars
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  // eslint-disable-next-line no-unused-vars
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="h-[calc(100vh-76px)] w-full bg-slate-50 flex flex-col font-sans overflow-hidden">
      
      {/* ── HEADER ── */}
      <header className="h-[80px] shrink-0 bg-white border-b border-slate-200 px-6 lg:px-10 flex items-center justify-between z-50">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-black bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-black rounded-full transition-all shadow-sm cursor-pointer"
          >
            <FaArrowLeft size={14} />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-serif font-normal text-black leading-tight">
              System Architecture Matrix
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
              <FaCodeBranch /> Real-time Data Topology
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
           <FaGlobe size={14} className="animate-spin-slow" />
           <span className="text-[10px] font-bold uppercase tracking-widest">Pipeline Active</span>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 min-h-0 flex w-full overflow-hidden">
        
        {/* LEFT PANEL: Infrastructure Stack */}
        <aside className="w-[450px] lg:w-[600px] shrink-0 bg-white border-r border-slate-200 flex flex-col z-10 overflow-hidden shadow-[10px_0_30px_rgba(0,0,0,0.03)]">
          
          <div className="h-[70px] px-6 lg:px-8 border-b border-slate-100 bg-slate-50 flex items-center shrink-0">
            <h2 className="text-xs font-bold text-black uppercase tracking-[0.2em] flex items-center gap-3">
              <FaLayerGroup size={16} className="text-slate-400" /> Infrastructure Stack
            </h2>
          </div>

          <div className="flex-1 min-h-0 p-6 lg:p-8 grid grid-cols-2 gap-4 lg:gap-5 content-start overflow-hidden">
            
            {/* AI Engine */}
            <div className="group border border-slate-200 p-4 lg:p-5 rounded-xl bg-white flex flex-col relative overflow-hidden hover:border-indigo-400 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-3 border-b border-slate-100 pb-3 relative z-10 shrink-0">
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <FaBrain className="text-sm" />
                </div>
                <h3 className="text-xs lg:text-sm font-bold text-slate-900 uppercase tracking-widest">Neural Engine</h3>
              </div>
              <ul className="space-y-1.5 text-[11px] lg:text-xs text-slate-600 font-medium tracking-wide">
                <li className="truncate">• LangChain Pipeline</li>
                <li className="truncate">• Groq API Integration</li>
                <li className="truncate">• Llama-3.1-8b Inference</li>
                <li className="truncate">• JSON Parsing</li>
              </ul>
            </div>

            {/* Backend */}
            <div className="group border border-slate-200 p-4 lg:p-5 rounded-xl bg-white flex flex-col relative overflow-hidden hover:border-blue-400 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-3 border-b border-slate-100 pb-3 relative z-10 shrink-0">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FaServer className="text-sm" />
                </div>
                <h3 className="text-xs lg:text-sm font-bold text-slate-900 uppercase tracking-widest">Backend APIs</h3>
              </div>
              <ul className="space-y-1.5 text-[11px] lg:text-xs text-slate-600 font-medium tracking-wide">
                <li className="truncate">• Node.js Runtime</li>
                <li className="truncate">• Express.js Framework</li>
                <li className="truncate">• Axios Requests</li>
                <li className="truncate">• RESTful Architecture</li>
              </ul>
            </div>

            {/* APIs & Data */}
            <div className="group border border-slate-200 p-4 lg:p-5 rounded-xl bg-white flex flex-col relative overflow-hidden hover:border-emerald-400 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-3 border-b border-slate-100 pb-3 relative z-10 shrink-0">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <FaDatabase className="text-sm" />
                </div>
                <h3 className="text-xs lg:text-sm font-bold text-slate-900 uppercase tracking-widest">Data Services</h3>
              </div>
              <ul className="space-y-1.5 text-[11px] lg:text-xs text-slate-600 font-medium tracking-wide">
                <li className="truncate">• OpenAlex Literature</li>
                <li className="truncate">• Force-Graph Topology</li>
                <li className="truncate">• MongoDB Storage</li>
                <li className="truncate">• Advanced Regex</li>
              </ul>
            </div>

            {/* Security */}
            <div className="group border border-slate-200 p-4 lg:p-5 rounded-xl bg-white flex flex-col relative overflow-hidden hover:border-purple-400 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-3 border-b border-slate-100 pb-3 relative z-10 shrink-0">
                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <FaLock className="text-sm" />
                </div>
                <h3 className="text-xs lg:text-sm font-bold text-slate-900 uppercase tracking-widest">Security Layer</h3>
              </div>
              <ul className="space-y-1.5 text-[11px] lg:text-xs text-slate-600 font-medium tracking-wide">
                <li className="truncate">• Clerk Authentication</li>
                <li className="truncate">• Route Protection</li>
                <li className="truncate">• API Rate Limiting</li>
                <li className="truncate">• Middleware Checks</li>
              </ul>
            </div>

          </div>
        </aside>

        {/* RIGHT PANEL: Floating Canvas */}
        <section className="flex-1 min-h-0 flex items-start justify-center bg-slate-50 p-6 pt-4 lg:p-10 lg:pt-6 overflow-hidden">
          
          <div className="w-full h-[92%] max-h-full relative bg-[#f1f5f9] rounded-2xl border border-slate-200 overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.05)]">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 opacity-50 z-0 pointer-events-none"></div>
            
            <div className="absolute inset-0 z-10">
              <ReactFlow 
                nodes={nodes} 
                edges={edges} 
                onNodesChange={onNodesChange} 
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                className="h-full w-full"
              >
                <Background color="#94a3b8" gap={20} size={2} className="opacity-40" />
                <Controls className="bg-white/90 backdrop-blur-sm border border-slate-300 rounded-lg shadow-xl overflow-hidden [&>button]:border-b-slate-200 m-4" />
                <MiniMap 
                  nodeStrokeColor={(n) => {
                     if(n.id === 'ai') return '#4f46e5';
                     if(n.id === 'openalex') return '#059669';
                     return '#0f172a';
                  }} 
                  nodeColor="#ffffff"
                  maskColor="rgba(241, 245, 249, 0.8)"
                  className="border-2 border-slate-200 shadow-xl rounded-xl overflow-hidden !bg-white/70 backdrop-blur-lg mb-4 mr-4"
                />
              </ReactFlow>
            </div>
          </div>

        </section>

      </main>

      <style>{`
        .animate-spin-slow {
          animation: spin 4s linear infinite;
        }
      `}</style>

    </div>
  );
};

export default Architecture;