(function() {
  'use strict';

  class OAuthClient {
    constructor() {
      this.popupWindow = null;
      this.checkInterval = null;
      this.callbacks = {
        success: [],
        error: [],
        start: [],
        complete: []
      };
      
      this.init();
    }

    init() {
      // Listen for messages from OAuth popup
      window.addEventListener('message', (event) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'oauth-success') {
          this.handleSuccess(event.data.data);
        } else if (event.data.type === 'oauth-error') {
          this.handleError(event.data.error);
        }
      });

      // Handle page unload to clean up popup
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
    }

    // Register event callbacks
    on(event, callback) {
      if (this.callbacks[event]) {
        this.callbacks[event].push(callback);
      }
    }

    // Remove event callbacks
    off(event, callback) {
      if (this.callbacks[event]) {
        const index = this.callbacks[event].indexOf(callback);
        if (index > -1) {
          this.callbacks[event].splice(index, 1);
        }
      }
    }

    // Trigger event callbacks
    trigger(event, data = null) {
      if (this.callbacks[event]) {
        this.callbacks[event].forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error('OAuth callback error:', error);
          }
        });
      }
    }

    // Start OAuth authentication
    async authenticate(provider, options = {}) {
      try {
        this.trigger('start', { provider });

        // Get provider configuration
        const providersResponse = await fetch('/api/plugin-routes/oauth/providers');
        const providersResult = await providersResponse.json();

        if (!providersResult.success) {
          throw new Error('Failed to get OAuth providers');
        }

        const providerConfig = providersResult.data.find(p => p.id === provider);
        if (!providerConfig) {
          throw new Error(`OAuth provider ${provider} not available`);
        }

        // Open OAuth popup
        this.openPopup(providerConfig.authUrl, options);

      } catch (error) {
        this.handleError(error.message);
      }
    }

    openPopup(authUrl, options = {}) {
      const {
        width = 500,
        height = 600,
        centerScreen = true
      } = options;

      let left = 0;
      let top = 0;

      if (centerScreen) {
        left = window.screen.width / 2 - width / 2;
        top = window.screen.height / 2 - height / 2;
      }

      const features = [
        `width=${width}`,
        `height=${height}`,
        `left=${left}`,
        `top=${top}`,
        'scrollbars=yes',
        'resizable=yes',
        'status=yes',
        'location=yes',
        'toolbar=no',
        'menubar=no'
      ].join(',');

      this.popupWindow = window.open(authUrl, 'oauth-popup', features);

      if (!this.popupWindow || this.popupWindow.closed || typeof this.popupWindow.closed === 'undefined') {
        this.handleError('Popup blocked. Please allow popups for this site.');
        return;
      }

      // Monitor popup window
      this.checkInterval = setInterval(() => {
        if (this.popupWindow && this.popupWindow.closed) {
          this.cleanup();
          this.trigger('complete');
        }
      }, 1000);

      // Focus popup
      if (this.popupWindow.focus) {
        this.popupWindow.focus();
      }
    }

    handleSuccess(data) {
      this.cleanup();
      this.trigger('success', data);
      this.trigger('complete');

      // Store session data if needed
      if (data.accessToken) {
        this.storeSession(data);
      }
    }

    handleError(error) {
      this.cleanup();
      this.trigger('error', error);
      this.trigger('complete');
    }

    cleanup() {
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }

      if (this.popupWindow && !this.popupWindow.closed) {
        this.popupWindow.close();
      }
      this.popupWindow = null;
    }

    storeSession(sessionData) {
      // Store session information (if needed)
      // Note: The main session is handled via HTTP-only cookies
      if (sessionData.user) {
        // Store user info in session storage for client-side access
        try {
          sessionStorage.setItem('oauth_user', JSON.stringify(sessionData.user));
        } catch (error) {
          console.warn('Failed to store user session data:', error);
        }
      }
    }

    // Check if user is authenticated via OAuth
    isAuthenticated() {
      try {
        const userData = sessionStorage.getItem('oauth_user');
        return !!userData;
      } catch (error) {
        return false;
      }
    }

    // Get current user data
    getCurrentUser() {
      try {
        const userData = sessionStorage.getItem('oauth_user');
        return userData ? JSON.parse(userData) : null;
      } catch (error) {
        return null;
      }
    }

    // Logout (clear session)
    logout() {
      try {
        sessionStorage.removeItem('oauth_user');
      } catch (error) {
        console.warn('Failed to clear session data:', error);
      }
    }
  }

  // Initialize OAuth client
  const oauthClient = new OAuthClient();

  // Expose to global scope
  window.OAuthClient = oauthClient;

  // Auto-initialize OAuth buttons
  document.addEventListener('DOMContentLoaded', function() {
    initializeOAuthButtons();
  });

  function initializeOAuthButtons() {
    const oauthButtons = document.querySelectorAll('[data-oauth-provider]');
    
    oauthButtons.forEach(button => {
      const provider = button.dataset.oauthProvider;
      
      button.addEventListener('click', async function(e) {
        e.preventDefault();
        
        // Add loading state
        button.disabled = true;
        const originalText = button.textContent;
        button.textContent = 'Connecting...';
        
        try {
          await oauthClient.authenticate(provider);
        } catch (error) {
          console.error('OAuth authentication failed:', error);
        } finally {
          // Remove loading state
          button.disabled = false;
          button.textContent = originalText;
        }
      });
    });
  }

  // Utility functions for manual integration
  window.oauthUtils = {
    // Authenticate with specific provider
    authenticate: (provider, options) => oauthClient.authenticate(provider, options),
    
    // Check authentication status
    isAuthenticated: () => oauthClient.isAuthenticated(),
    
    // Get current user
    getCurrentUser: () => oauthClient.getCurrentUser(),
    
    // Register event listeners
    on: (event, callback) => oauthClient.on(event, callback),
    
    // Remove event listeners
    off: (event, callback) => oauthClient.off(event, callback),
    
    // Logout
    logout: () => oauthClient.logout()
  };

})();