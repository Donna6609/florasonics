import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import * as base44SDK from '@/api/base44Client';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

// Mock base44 SDK
jest.mock('@/api/base44Client');

// Mock axios client factory
jest.mock('@base44/sdk/dist/utils/axios-client');

// Mock app params
jest.mock('@/lib/app-params', () => ({
  appParams: {
    appId: 'test-app-id',
    token: 'test-token'
  }
}));

/**
 * Test Component that uses AuthContext
 */
function TestComponent() {
  const { user, isAuthenticated, isLoadingAuth, authError } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{isLoadingAuth ? 'loading' : 'done'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'true' : 'false'}</div>
      <div data-testid="error">{authError?.message || 'none'}</div>
      <div data-testid="user">{user?.email || 'no-user'}</div>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window.Android to simulate non-WebView environment
    delete window.Android;
  });

  describe('AuthProvider Initialization', () => {
    it('should initialize with loading state', async () => {
      const mockClient = {
        get: jest.fn().mockResolvedValue({ id: 'app-1', public_settings: {} })
      };
      createAxiosClient.mockReturnValue(mockClient);
      base44SDK.base44.auth.me = jest.fn().mockResolvedValue({
        email: 'user@example.com',
        full_name: 'Test User'
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Should show loading initially
      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    });

    it('should complete auth check without errors', async () => {
      const mockClient = {
        get: jest.fn().mockResolvedValue({ id: 'app-1', public_settings: {} })
      };
      createAxiosClient.mockReturnValue(mockClient);
      base44SDK.base44.auth.me = jest.fn().mockResolvedValue({
        email: 'user@example.com',
        full_name: 'Test User'
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('done');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('error')).toHaveTextContent('none');
    });

    it('should handle missing token gracefully', async () => {
      // Override app params to have no token
      jest.doMock('@/lib/app-params', () => ({
        appParams: {
          appId: 'test-app-id',
          token: null
        }
      }));

      const mockClient = {
        get: jest.fn().mockResolvedValue({ id: 'app-1', public_settings: {} })
      };
      createAxiosClient.mockReturnValue(mockClient);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('done');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    });
  });

  describe('Error Handling', () => {
    it('should handle user_not_registered error', async () => {
      const mockClient = {
        get: jest.fn().mockRejectedValue({
          status: 403,
          data: {
            extra_data: {
              reason: 'user_not_registered'
            }
          }
        })
      };
      createAxiosClient.mockReturnValue(mockClient);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('done');
      });

      expect(screen.getByTestId('error')).toHaveTextContent('User not registered');
    });

    it('should handle auth_required error', async () => {
      const mockClient = {
        get: jest.fn().mockResolvedValue({ id: 'app-1', public_settings: {} })
      };
      createAxiosClient.mockReturnValue(mockClient);
      base44SDK.base44.auth.me = jest.fn().mockRejectedValue({
        status: 401,
        message: 'Unauthorized'
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('done');
      });

      expect(screen.getByTestId('error')).toHaveTextContent('Authentication required');
    });

    it('should handle rate limit gracefully (429)', async () => {
      const mockClient = {
        get: jest.fn().mockRejectedValue({
          status: 429,
          message: 'Rate limited'
        })
      };
      createAxiosClient.mockReturnValue(mockClient);
      base44SDK.base44.auth.me = jest.fn().mockResolvedValue({
        email: 'user@example.com',
        full_name: 'Test User'
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Should not block app on rate limit
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('done');
      });
    });

    it('should handle unknown errors gracefully', async () => {
      const mockClient = {
        get: jest.fn().mockRejectedValue(new Error('Network error'))
      };
      createAxiosClient.mockReturnValue(mockClient);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('done');
      });

      // App should still be functional
      expect(screen.getByTestId('authenticated')).toBeInTheDocument();
    });
  });

  describe('useAuth Hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress error logging for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('should provide all context values', async () => {
      const mockClient = {
        get: jest.fn().mockResolvedValue({ id: 'app-1', public_settings: {} })
      };
      createAxiosClient.mockReturnValue(mockClient);
      base44SDK.base44.auth.me = jest.fn().mockResolvedValue({
        email: 'test@example.com',
        full_name: 'Test User',
        role: 'user'
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });
    });
  });

  describe('Non-WebView Environment Compatibility', () => {
    it('should work correctly when window.Android is undefined', async () => {
      // Ensure Android interface is not available
      expect(window.Android).toBeUndefined();

      const mockClient = {
        get: jest.fn().mockResolvedValue({ id: 'app-1', public_settings: {} })
      };
      createAxiosClient.mockReturnValue(mockClient);
      base44SDK.base44.auth.me = jest.fn().mockResolvedValue({
        email: 'user@example.com'
      });

      const { container } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });

      // Should render without errors
      expect(container).toBeInTheDocument();
    });

    it('should work when window.Android exists', async () => {
      // Simulate WebView environment
      window.Android = {
        getDeviceInfo: jest.fn(() => '{"model": "Pixel 5"}'),
        vibrate: jest.fn(),
        showToast: jest.fn()
      };

      const mockClient = {
        get: jest.fn().mockResolvedValue({ id: 'app-1', public_settings: {} })
      };
      createAxiosClient.mockReturnValue(mockClient);
      base44SDK.base44.auth.me = jest.fn().mockResolvedValue({
        email: 'user@example.com'
      });

      const { container } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });

      // Should still work with Android interface present
      expect(container).toBeInTheDocument();
    });

    it('should not break if base44.auth methods fail in non-WebView', async () => {
      delete window.Android;

      const mockClient = {
        get: jest.fn().mockRejectedValue({
          status: 400,
          message: 'Bad request'
        })
      };
      createAxiosClient.mockReturnValue(mockClient);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Should eventually complete loading without crashing
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('done');
      });
    });
  });

  describe('Logout Functionality', () => {
    it('should call base44.auth.logout on logout', async () => {
      const mockClient = {
        get: jest.fn().mockResolvedValue({ id: 'app-1', public_settings: {} })
      };
      createAxiosClient.mockReturnValue(mockClient);
      base44SDK.base44.auth.me = jest.fn().mockResolvedValue({
        email: 'user@example.com'
      });
      base44SDK.base44.auth.logout = jest.fn();

      function LogoutTest() {
        const { logout } = useAuth();
        return (
          <button onClick={() => logout()}>
            Logout
          </button>
        );
      }

      render(
        <AuthProvider>
          <LogoutTest />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Logout')).toBeInTheDocument();
      });

      const button = screen.getByText('Logout');
      button.click();

      expect(base44SDK.base44.auth.logout).toHaveBeenCalled();
    });
  });

  describe('Platform-Specific Guards', () => {
    it('should use window.location.href safely', async () => {
      const mockClient = {
        get: jest.fn().mockResolvedValue({ id: 'app-1', public_settings: {} })
      };
      createAxiosClient.mockReturnValue(mockClient);
      base44SDK.base44.auth.me = jest.fn().mockResolvedValue({
        email: 'user@example.com'
      });
      base44SDK.base44.auth.logout = jest.fn();

      function LogoutTest() {
        const { logout } = useAuth();
        return (
          <button onClick={() => logout(true)}>
            Logout with Redirect
          </button>
        );
      }

      render(
        <AuthProvider>
          <LogoutTest />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Logout with Redirect')).toBeInTheDocument();
      });

      const button = screen.getByText('Logout with Redirect');
      button.click();

      // Should pass window.location.href to logout
      expect(base44SDK.base44.auth.logout).toHaveBeenCalledWith(window.location.href);
    });

    it('should handle navigateToLogin without breaking in non-WebView', async () => {
      const mockClient = {
        get: jest.fn().mockResolvedValue({ id: 'app-1', public_settings: {} })
      };
      createAxiosClient.mockReturnValue(mockClient);
      base44SDK.base44.auth.redirectToLogin = jest.fn();

      function LoginTest() {
        const { navigateToLogin } = useAuth();
        return (
          <button onClick={navigateToLogin}>
            Go to Login
          </button>
        );
      }

      render(
        <AuthProvider>
          <LoginTest />
        </AuthProvider>
      );

      const button = await screen.findByText('Go to Login');
      button.click();

      // Should call redirectToLogin with current URL
      expect(base44SDK.base44.auth.redirectToLogin).toHaveBeenCalledWith(window.location.href);
    });
  });
});