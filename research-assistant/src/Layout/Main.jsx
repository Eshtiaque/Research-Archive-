import { Outlet } from "react-router-dom";
import Navbar from "../Page/Navbar";
import { Toaster } from "react-hot-toast";

const Main = () => {
  return (
    <div className="min-h-screen text-white selection:bg-purple-500/30 relative">
      
      <Toaster position="bottom-right" />
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Outlet /> 
      </main>

    </div>
  );
};

export default Main;