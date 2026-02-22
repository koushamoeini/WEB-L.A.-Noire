import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Cases from '../pages/cases/list/Cases';
import { AuthProvider } from '../context/AuthContext';
import { caseAPI } from '../services/caseApi';

// Mock the caseAPI
vi.mock('../services/caseApi', () => ({
  caseAPI: {
    listCases: vi.fn(),
  },
}));

describe('Cases List Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without errors when loading', () => {
    vi.mocked(caseAPI.listCases).mockImplementation(() => new Promise(() => {}));
    
    const { container } = render(
      <BrowserRouter>
        <AuthProvider>
          <Cases />
        </AuthProvider>
      </BrowserRouter>
    );

    // Component should render without errors
    expect(container).toBeInTheDocument();
  });

  it('renders cases list when data is loaded', async () => {
    const mockCases = [
      {
        case_id: 1,
        title: 'Test Case 1',
        description: 'Test description',
        status: 'OPEN',
        crime_level: 3,
        assigned_detective: { first_name: 'John', last_name: 'Doe' },
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        case_id: 2,
        title: 'Test Case 2',
        description: 'Another test',
        status: 'CLOSED',
        crime_level: 2,
        assigned_detective: { first_name: 'Jane', last_name: 'Smith' },
        created_at: '2024-01-02T00:00:00Z',
      },
    ];

    vi.mocked(caseAPI.listCases).mockResolvedValue(mockCases as any);

    render(
      <BrowserRouter>
        <AuthProvider>
          <Cases />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Case 1')).toBeInTheDocument();
      expect(screen.getByText('Test Case 2')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(caseAPI.listCases).mockRejectedValue(new Error('API Error'));

    const { container } = render(
      <BrowserRouter>
        <AuthProvider>
          <Cases />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      // Component should still render even with errors
      expect(container).toBeInTheDocument();
    });
  });
});
