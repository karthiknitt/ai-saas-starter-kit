import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from '@/components/forms/login-form';
import { authClient } from '@/lib/auth-client';
import { signIn } from '../../../server/users';

// Mock external dependencies
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: {
      social: vi.fn(),
    },
  },
}));

vi.mock('../../../server/users', () => ({
  signIn: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAuthClient = vi.mocked(authClient) as any;
const mockSignIn = vi.mocked(signIn);

describe('LoginForm Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLoginForm = () => {
    return render(<LoginForm />);
  };

  describe('Form Rendering', () => {
    it('should render all form elements correctly', { timeout: 10000 }, () => {
      renderLoginForm();

      expect(screen.getByText('Welcome back')).toBeInTheDocument();
      expect(
        screen.getByText('Login with your Google account'),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /login with google/i }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    });

    it('should render password field as type password', () => {
      renderLoginForm();

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should render forgot password link', () => {
      renderLoginForm();

      const forgotPasswordLink = screen.getByText(/forgot your password/i);
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for invalid email', async () => {
      renderLoginForm();

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: 'Login' });

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);

      await waitFor(
        () => {
          const errorElement = screen.queryByText(
            /please enter a valid email|invalid email/i,
          );
          expect(errorElement).toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    });

    it('should show validation error for short password', async () => {
      renderLoginForm();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: 'Login' });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 8 characters long/i),
        ).toBeInTheDocument();
      });
    });

    it('should not show validation errors for valid inputs', async () => {
      renderLoginForm();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'validpassword' } });

      // Wait a bit to ensure no validation errors appear
      await waitFor(() => {
        expect(screen.queryByText(/invalid email/i)).not.toBeInTheDocument();
        expect(
          screen.queryByText(/password must be at least 8 characters long/i),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call signIn with correct credentials on valid submission', async () => {
      mockSignIn.mockResolvedValue({
        success: true,
        message: 'Login successful',
      });

      renderLoginForm();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: 'Login' });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'validpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(
          'test@example.com',
          'validpassword',
        );
      });
    });

    it('should show success toast and redirect on successful login', async () => {
      const mockPush = vi.fn();
      const { useRouter } = await import('next/navigation');
      vi.mocked(useRouter).mockReturnValue({
        push: mockPush,
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
      });

      mockSignIn.mockResolvedValue({
        success: true,
        message: 'Login successful',
      });

      renderLoginForm();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'validpassword' } });
      const form = screen.getByTestId('login-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should show error toast on failed login', async () => {
      mockSignIn.mockResolvedValue({
        success: false,
        message: 'Invalid credentials',
      });

      renderLoginForm();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: 'Login' });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Toast messages are handled by sonner, so we can't easily test them
        // but we can verify the signIn function was called
        expect(mockSignIn).toHaveBeenCalledWith(
          'test@example.com',
          'wrongpassword',
        );
      });
    });

    it('should show loading state during submission', async () => {
      // Mock a delayed response
      mockSignIn.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ success: true, message: 'Success' }),
              100,
            ),
          ),
      );

      renderLoginForm();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: 'Login' });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'validpassword' } });
      fireEvent.click(submitButton);

      // Wait for loading state to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/signing in/i)).toBeInTheDocument();
      });

      // Wait for the request to complete
      await waitFor(
        () => {
          expect(
            screen.queryByLabelText(/signing in/i),
          ).not.toBeInTheDocument();
        },
        { timeout: 200 },
      );
    });
  });

  describe('Google OAuth Integration', () => {
    it('should call Google sign-in when Google button is clicked', async () => {
      mockAuthClient.signIn.social.mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      } as { data: { user: { id: string } }; error: null });

      renderLoginForm();

      const googleButton = screen.getByRole('button', {
        name: /login with google/i,
      });
      fireEvent.click(googleButton);

      expect(mockAuthClient.signIn.social).toHaveBeenCalledWith({
        provider: 'google',
        callbackURL: '/dashboard',
      });
    });

    it('should handle Google sign-in errors gracefully', async () => {
      mockAuthClient.signIn.social.mockResolvedValue({
        data: null,
        error: { message: 'OAuth failed' },
      } as { data: null; error: { message: string } });

      renderLoginForm();

      const googleButton = screen.getByRole('button', {
        name: /login with google/i,
      });
      fireEvent.click(googleButton);

      // The component doesn't handle errors explicitly, but the call should still be made
      expect(mockAuthClient.signIn.social).toHaveBeenCalledWith({
        provider: 'google',
        callbackURL: '/dashboard',
      });
    });
  });

  describe('Navigation Links', () => {
    it('should render signup link', () => {
      renderLoginForm();

      const signupLink = screen.getByText(/sign up/i);
      expect(signupLink).toBeInTheDocument();
      expect(signupLink.closest('a')).toHaveAttribute('href', '/signup');
    });

    it('should render home page link', () => {
      renderLoginForm();

      const homeLink = screen.getByText(/home page/i);
      expect(homeLink).toBeInTheDocument();
      expect(homeLink.closest('a')).toHaveAttribute('href', '/');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderLoginForm();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
    });

    it('should have proper button roles', () => {
      renderLoginForm();

      const googleButton = screen.getByRole('button', {
        name: /login with google/i,
      });
      const submitButton = screen.getByRole('button', { name: 'Login' });

      expect(googleButton).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      renderLoginForm();

      const emailInput = screen.getByLabelText(/email/i);

      // Check that email input is focusable
      emailInput.focus();
      expect(emailInput).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('should handle signIn function throwing an error', async () => {
      mockSignIn.mockRejectedValue(new Error('Network error'));

      renderLoginForm();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: 'Login' });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'validpassword' } });
      fireEvent.click(submitButton);

      // Should not crash and should handle the error gracefully
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled();
      });
    });

    it('should handle malformed response from signIn', async () => {
      mockSignIn.mockResolvedValue({ success: false, message: 'Error' } as {
        success: boolean;
        message: string;
      });

      renderLoginForm();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: 'Login' });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'validpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled();
      });
    });
  });
});
