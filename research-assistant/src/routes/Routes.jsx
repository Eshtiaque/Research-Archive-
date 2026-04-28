import { createBrowserRouter, Navigate } from 'react-router-dom'
import Main from '../Layout/Main'
import Home from '../Page/Home'
import Dashboard from '../Page/Dashboard'
import PaperDetails from '../Page/PaperDetails'
import Pricing from '../Page/Pricing'
import Workspace from '../Page/Workspace'
import DatasetsExplorer from '../Page/DatasetsExplorer'
import Settings from '../Page/Settings'
import NetworkView from '../Page/NetworkView'
import ProtectedRoute from './ProtectedRoute'
import Architecture from '../Page/Architecture'



export const router = createBrowserRouter([
  {
    path: '/',
    element: <Main />,
    children: [
      
      { path: '/', element: <Home /> }, 
      { path: '/pricing', element: <Pricing /> },

      { path: '/dashboard', element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
      { path: '/paper/:id', element: <ProtectedRoute><PaperDetails /></ProtectedRoute> }, 
      { path: "/workspace", element: <ProtectedRoute><Workspace /></ProtectedRoute> },
      { path: "/datasets", element: <ProtectedRoute><DatasetsExplorer /></ProtectedRoute> },
      { path: "/settings", element: <ProtectedRoute><Settings /></ProtectedRoute> },
      { path: "/network", element: <ProtectedRoute><NetworkView /></ProtectedRoute> },
      {path: "/architecture", element: <Architecture />}, 
    ]
  },
])