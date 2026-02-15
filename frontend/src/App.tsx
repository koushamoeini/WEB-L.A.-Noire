import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';
import CreateCaseComplaint from './pages/CreateCaseComplaint';
import CreateCaseScene from './pages/CreateCaseScene';
import Evidence from './pages/Evidence';
import CreateEvidence from './pages/CreateEvidence';
import WitnessTestimonyForm from './pages/WitnessTestimonyForm';
import BiologicalEvidenceForm from './pages/BiologicalEvidenceForm';
import VehicleEvidenceForm from './pages/VehicleEvidenceForm';
import IdentificationDocumentForm from './pages/IdentificationDocumentForm';
import OtherEvidenceForm from './pages/OtherEvidenceForm';
import InvestigationBoard from './pages/InvestigationBoard';
import Suspects from './pages/Suspects';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cases"
            element={
              <ProtectedRoute>
                <Cases />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cases/:id"
            element={
              <ProtectedRoute>
                <CaseDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cases/create-complaint"
            element={
              <ProtectedRoute>
                <CreateCaseComplaint />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cases/create-scene"
            element={
              <ProtectedRoute>
                <CreateCaseScene />
              </ProtectedRoute>
            }
          />
          <Route
            path="/evidence"
            element={
              <ProtectedRoute>
                <Evidence />
              </ProtectedRoute>
            }
          />
          <Route
            path="/evidence/create"
            element={
              <ProtectedRoute>
                <CreateEvidence />
              </ProtectedRoute>
            }
          />
          <Route
            path="/evidence/create/witness"
            element={
              <ProtectedRoute>
                <WitnessTestimonyForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/evidence/create/biological"
            element={
              <ProtectedRoute>
                <BiologicalEvidenceForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/evidence/create/vehicle"
            element={
              <ProtectedRoute>
                <VehicleEvidenceForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/evidence/create/id-document"
            element={
              <ProtectedRoute>
                <IdentificationDocumentForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/evidence/create/other"
            element={
              <ProtectedRoute>
                <OtherEvidenceForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/investigation"
            element={
              <ProtectedRoute>
                <InvestigationBoard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/suspects"
            element={
              <ProtectedRoute>
                <Suspects />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
