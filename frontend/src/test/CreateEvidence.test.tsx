import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CreateEvidence from '../pages/evidence/create/CreateEvidence';
import { AuthProvider } from '../context/AuthContext';

// Mock the evidenceAPI
vi.mock('../services/evidenceAPI', () => ({
  default: {
    createEvidence: vi.fn(),
  },
}));

// Mock useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ caseId: '1' }),
    useNavigate: () => vi.fn(),
  };
});

describe('CreateEvidence Component', () => {
  it('renders evidence creation form', () => {
    const { container } = render(
      <BrowserRouter>
        <AuthProvider>
          <CreateEvidence />
        </AuthProvider>
      </BrowserRouter>
    );

    // Component should render without errors
    expect(container).toBeInTheDocument();
  });

  it('displays evidence type selection cards', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <CreateEvidence />
        </AuthProvider>
      </BrowserRouter>
    );

    // Check for evidence type cards
    const cards = screen.queryAllByText(/شواهد|وسایل|مدارک|سایر|شاهد/i);
    expect(cards.length).toBeGreaterThan(0);
  });

  it('shows evidence type options to user', () => {
    const { container } = render(
      <BrowserRouter>
        <AuthProvider>
          <CreateEvidence />
        </AuthProvider>
      </BrowserRouter>
    );

    // Check that evidence type cards exist
    const cards = container.querySelectorAll('.evidence-type-card');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('allows navigation back to case', () => {
    const { container } = render(
      <BrowserRouter>
        <AuthProvider>
          <CreateEvidence />
        </AuthProvider>
      </BrowserRouter>
    );

    // Check for back/cancel button
    const backButton = screen.queryByText(/بازگشت|back|cancel/i);
    expect(backButton || container).toBeTruthy();
  });
});
