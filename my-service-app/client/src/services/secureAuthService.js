/**
 * Secure Authentication Service with HttpOnly Cookies
 * This service handles authentication using secure HttpOnly cookies for refresh tokens
 * and short-lived access tokens stored in memory
 */

class SecureAuthService {
  constructor() {
    this.accessToken = null;
    this.tokenRefreshTimer = null;
    this.API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
    
    // Initialize from memory (not localStorage for security)
    this.initializeFromMemory();
  }

  /**
   * Initialize authentication state from memory only
   * No localStorage usage for security
   */
  initializeFromMemory() {
    // Check if we have an access token in memory
    this.accessToken = sessionStorage.getItem('accessToken'); // Use sessionStorage for temporary storage
    if (this.accessToken) {
      this.startTokenRefreshTimer();
    }
  }

  /**
   * Register a new user
   */
  async register(userData) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for HttpOnly cookies
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Store access token in memory only
      this.setAccessToken(data.token);
      
      return {
        success: true,
        user: data.user,
        message: data.message
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Login user
   */
  async login(email, password) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for HttpOnly cookies
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store access token in memory only
      this.setAccessToken(data.token);
      
      return {
        success: true,
        user: data.user,
        message: data.message
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      // Call server logout to revoke refresh token
      await fetch(`${this.API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      // Clear local state
      this.clearAuthState();
      
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if server call fails
      this.clearAuthState();
      return { success: true, message: 'Logged out locally' };
    }
  }

  /**
   * Refresh access token using HttpOnly refresh token cookie
   */
  async refreshAccessToken() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for HttpOnly cookies
        // No body needed - refresh token comes from cookie
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Token refresh failed');
      }

      // Update access token
      this.setAccessToken(data.token);
      
      return { success: true, token: data.token };
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear auth state on refresh failure
      this.clearAuthState();
      return { success: false, message: error.message };
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser() {
    try {
      const response = await this.authenticatedFetch(`${this.API_BASE_URL}/auth/me`);
      
      if (!response.ok) {
        throw new Error('Failed to get user profile');
      }

      const data = await response.json();
      return { success: true, user: data.data };
    } catch (error) {
      console.error('Get current user error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Update user details
   */
  async updateDetails(userData) {
    try {
      const response = await this.authenticatedFetch(`${this.API_BASE_URL}/auth/updatedetails`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      return { success: true, user: data.data };
    } catch (error) {
      console.error('Update details error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Revoke all user tokens
   */
  async revokeAllTokens(userId = null) {
    try {
      const url = userId 
        ? `${this.API_BASE_URL}/auth/revoke-tokens/${userId}`
        : `${this.API_BASE_URL}/auth/revoke-tokens`;

      const response = await this.authenticatedFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to revoke tokens');
      }

      // Clear local state if revoking own tokens
      if (!userId) {
        this.clearAuthState();
      }

      return { success: true, message: data.message };
    } catch (error) {
      console.error('Revoke tokens error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get active sessions
   */
  async getActiveSessions(userId = null) {
    try {
      const url = userId 
        ? `${this.API_BASE_URL}/auth/active-sessions/${userId}`
        : `${this.API_BASE_URL}/auth/active-sessions`;

      const response = await this.authenticatedFetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to get active sessions');
      }

      const data = await response.json();
      return { success: true, sessions: data.data, count: data.count };
    } catch (error) {
      console.error('Get active sessions error:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Make authenticated API call with automatic token refresh
   */
  async authenticatedFetch(url, options = {}) {
    // Ensure we have a valid access token
    if (!this.accessToken || this.isTokenExpired(this.accessToken)) {
      const refreshResult = await this.refreshAccessToken();
      if (!refreshResult.success) {
        throw new Error('Authentication failed');
      }
    }

    // Make the authenticated request
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.accessToken}`,
      },
      credentials: 'include',
    });

    // Handle 401 Unauthorized - try token refresh once
    if (response.status === 401) {
      const refreshResult = await this.refreshAccessToken();
      if (refreshResult.success) {
        // Retry the request with new token
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${this.accessToken}`,
          },
          credentials: 'include',
        });
      }
    }

    return response;
  }

  /**
   * Set access token and start refresh timer
   */
  setAccessToken(token) {
    this.accessToken = token;
    sessionStorage.setItem('accessToken', token); // Temporary storage
    this.startTokenRefreshTimer();
  }

  /**
   * Clear authentication state
   */
  clearAuthState() {
    this.accessToken = null;
    sessionStorage.removeItem('accessToken');
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
  }

  /**
   * Start automatic token refresh timer
   */
  startTokenRefreshTimer() {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }

    // Refresh token 5 minutes before it expires (15 min token - 5 min = 10 min)
    this.tokenRefreshTimer = setTimeout(async () => {
      const result = await this.refreshAccessToken();
      if (!result.success) {
        console.error('Automatic token refresh failed');
        this.clearAuthState();
        // Redirect to login or emit auth state change event
        window.dispatchEvent(new CustomEvent('auth-expired'));
      }
    }, 10 * 60 * 1000); // 10 minutes
  }

  /**
   * Check if JWT token is expired
   */
  isTokenExpired(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch (error) {
      return true; // Assume expired if can't parse
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.accessToken && !this.isTokenExpired(this.accessToken);
  }

  /**
   * Get access token (for use in other services)
   */
  getAccessToken() {
    return this.accessToken;
  }

  /**
   * Cleanup method to be called when component unmounts
   */
  cleanup() {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
  }
}

// Create singleton instance
const secureAuthService = new SecureAuthService();

// Export as default
export default secureAuthService;

// Also export class for testing or multiple instances
export { SecureAuthService };
