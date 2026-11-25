import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import { HomePage } from '../pages/public/HomePage';
import { PricingPage } from '../pages/public/PricingPage';
import { resetSandboxForTests } from '../services/platformStore';

describe('Phase 1 Public UI Pages', () => {
  beforeEach(() => {
    resetSandboxForTests();
  });

  it('renders search-first All-India HomePage with modules and approved listings', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Everything Connected\. Opportunities Everywhere\./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Search India/i })).toBeInTheDocument();
    expect(await screen.findByText(/Senior Full-Stack Engineer/i)).toBeInTheDocument();
  });

  it('renders configurable subscription tiers on PricingPage', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <PricingPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('₹199')).toBeInTheDocument();
    expect(screen.getByText('₹499')).toBeInTheDocument();
    expect(screen.getByText('₹1,999')).toBeInTheDocument();
  });
});
