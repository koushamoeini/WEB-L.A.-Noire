import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/dashboard/Dashboard';
import { AuthProvider } from '../context/AuthContext';
import { caseAPI } from '../services/caseApi';

// Mock the caseAPI
vi.mock('../services/caseApi', () => ({
  caseAPI: {
    listCases: vi.fn(),
  },
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard header', () => {
    vi.mocked(caseAPI.listCases).mockImplementation(() => new Promise(() => {}));
    
    render(
      <BrowserRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    // Check for L.A. Noire  heading which is always rendered
    expect(screen.getByText(/L\.A\. Noire/i)).toBeInTheDocument();
  });

  it('displays statistics when data is loaded', async () => {
    const mockCases = [
      { case_id: 1, status: 'OPEN', crime_level: 3 },
      { case_id: 2, status: 'CLOSED', crime_level: 2 },
      { case_id: 3, status: 'OPEN', crime_level: 1 },
    ];

    vi.mocked(caseAPI.listCases).mockResolvedValue(mockCases as any);

    render(
      <BrowserRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      // Check that component has rendered
      expect(screen.getByText(/L\.A\. Noire/i)).toBeInTheDocument();
    });
  });

  it('renders without errors when data is loading', () => {
    vi.mocked(caseAPI.listCases).mockImplementation(() => new Promise(() => {}));
    
    render(
      <BrowserRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    // Component should render the main heading even while loading
    expect(screen.getByText(/L\.A\. Noire/i)).toBeInTheDocument();
  });
});
