import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
// Dashboard
import Home from './pages/dashboard/Home';
import Dashboard from './pages/dashboard/Dashboard';
import Stats from './pages/dashboard/Stats';
import Notifications from './pages/dashboard/Notifications';
// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
// Cases
import Cases from './pages/cases/list/Cases';
import CaseDetail from './pages/cases/detail/CaseDetail';
import CreateCaseComplaint from './pages/cases/create/CreateCaseComplaint';
import CreateCaseScene from './pages/cases/create/CreateCaseScene';
// Evidence
import Evidence from './pages/evidence/list/Evidence';
import CreateEvidence from './pages/evidence/create/CreateEvidence';
import WitnessTestimonyForm from './pages/evidence/forms/WitnessTestimonyForm';
import IdentificationDocumentForm from './pages/evidence/forms/IdentificationDocumentForm';
import BiologicalEvidenceForm from './pages/evidence/forms/BiologicalEvidenceForm';
import VehicleEvidenceForm from './pages/evidence/forms/VehicleEvidenceForm';
import OtherEvidenceForm from './pages/evidence/forms/OtherEvidenceForm';
// Investigation
import InvestigationBoard from './pages/investigation/board/InvestigationBoard';
import Suspects from './pages/investigation/suspects/Suspects';
import Interrogations from './pages/investigation/interrogations/Interrogations';
import Trial from './pages/investigation/trial/Trial';
import BailPayment from './pages/investigation/payment/BailPayment';
// Ranking
import Ranking from './pages/ranking/Ranking';
// Admin
import AdminPanel from './pages/admin/AdminPanel';
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
            path="/evidence/create/id-document"
            element={
              <ProtectedRoute>
                <IdentificationDocumentForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/evidence/edit/id-document/:id"
            element={
              <ProtectedRoute>
                <IdentificationDocumentForm />
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
            path="/evidence/edit/witness/:id"
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
            path="/evidence/edit/biological/:id"
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
            path="/evidence/edit/vehicle/:id"
            element={
              <ProtectedRoute>
                <VehicleEvidenceForm />
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
            path="/evidence/edit/other/:id"
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
            path="/ranking"
            element={
              <ProtectedRoute>
                <Ranking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stats"
            element={
              <ProtectedRoute>
                <Stats />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
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
          <Route
            path="/cases/:caseId/interrogations"
            element={
              <ProtectedRoute>
                <Interrogations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cases/:id/trial/:suspectId"
            element={
              <ProtectedRoute>
                <Trial />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bail-payment/:verdictId"
            element={
              <ProtectedRoute>
                <BailPayment />
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
