import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';

// Complete the auth session
WebBrowser.maybeCompleteAuthSession();

const WORKOS_CLIENT_ID = process.env.EXPO_PUBLIC_WORKOS_CLIENT_ID || '';
const WORKOS_REDIRECT_URI = process.env.EXPO_PUBLIC_WORKOS_REDIRECT_URI || 'w-ai-mobile://auth/callback';
const WORKOS_DOMAIN = process.env.EXPO_PUBLIC_WORKOS_DOMAIN || '';

interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

const TOKEN_STORAGE_KEY = 'workos_access_token';
const REFRESH_TOKEN_STORAGE_KEY = 'workos_refresh_token';
const EXPIRES_AT_KEY = 'workos_expires_at';

export class WorkOSAuth {
  private static instance: WorkOSAuth;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: number = 0;

  private constructor() {}

  static getInstance(): WorkOSAuth {
    if (!WorkOSAuth.instance) {
      WorkOSAuth.instance = new WorkOSAuth();
    }
    return WorkOSAuth.instance;
  }

  /**
   * Initialize auth by loading stored tokens
   */
  async initialize(): Promise<void> {
    try {
      const accessToken = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_STORAGE_KEY);
      const expiresAtStr = await SecureStore.getItemAsync(EXPIRES_AT_KEY);

      if (accessToken) {
        this.accessToken = accessToken;
      }
      if (refreshToken) {
        this.refreshToken = refreshToken;
      }
      if (expiresAtStr) {
        this.expiresAt = parseInt(expiresAtStr, 10);
      }
    } catch (error) {
      console.error('Failed to load stored tokens:', error);
    }
  }

  /**
   * Get the current access token, refreshing if needed
   */
  async getAccessToken(): Promise<string | null> {
    // Check if token is expired or will expire soon (within 5 minutes)
    if (this.accessToken && this.expiresAt > Date.now() + 5 * 60 * 1000) {
      return this.accessToken;
    }

    // Try to refresh if we have a refresh token
    if (this.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        return this.accessToken;
      }
    }

    return this.accessToken;
  }

  /**
   * Start the OAuth login flow
   */
  async login(): Promise<AuthTokens | null> {
    try {
      // Build WorkOS authorization URL
      const authUrl = `https://api.workos.com/sso/authorize?` +
        `client_id=${encodeURIComponent(WORKOS_CLIENT_ID)}&` +
        `redirect_uri=${encodeURIComponent(WORKOS_REDIRECT_URI)}&` +
        `response_type=code&` +
        `provider=workos`;

      const result = await AuthSession.startAsync({
        authUrl,
        returnUrl: WORKOS_REDIRECT_URI,
      });

      if (result.type === 'success' && result.params?.code) {
        const tokens = await this.exchangeCodeForToken(result.params.code);
        if (tokens) {
          await this.storeTokens(tokens);
          return tokens;
        }
      }

      return null;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }

  /**
   * Exchange authorization code for access token
   */
  private async exchangeCodeForToken(code: string): Promise<AuthTokens | null> {
    try {
      const response = await fetch('https://api.workos.com/sso/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: WORKOS_CLIENT_ID,
          client_secret: process.env.EXPO_PUBLIC_WORKOS_CLIENT_SECRET || '',
          grant_type: 'authorization_code',
          code,
          redirect_uri: WORKOS_REDIRECT_URI,
        }).toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Token exchange error:', error);
        return null;
      }

      const data = await response.json();
      const expiresAt = Date.now() + (data.expires_in * 1000);

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
      };
    } catch (error) {
      console.error('Token exchange error:', error);
      return null;
    }
  }

  /**
   * Refresh the access token using refresh token
   */
  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await fetch('https://api.workos.com/sso/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: WORKOS_CLIENT_ID,
          client_secret: process.env.EXPO_PUBLIC_WORKOS_CLIENT_SECRET || '',
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
        }).toString(),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      const expiresAt = Date.now() + (data.expires_in * 1000);

      const tokens: AuthTokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || this.refreshToken,
        expiresAt,
      };

      await this.storeTokens(tokens);
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  /**
   * Store tokens securely
   */
  private async storeTokens(tokens: AuthTokens): Promise<void> {
    try {
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken;
      this.expiresAt = tokens.expiresAt;

      await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, tokens.accessToken);
      if (tokens.refreshToken) {
        await SecureStore.setItemAsync(REFRESH_TOKEN_STORAGE_KEY, tokens.refreshToken);
      }
      await SecureStore.setItemAsync(EXPIRES_AT_KEY, tokens.expiresAt.toString());
    } catch (error) {
      console.error('Failed to store tokens:', error);
    }
  }

  /**
   * Logout and clear stored tokens
   */
  async logout(): Promise<void> {
    try {
      this.accessToken = null;
      this.refreshToken = null;
      this.expiresAt = 0;

      await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_STORAGE_KEY);
      await SecureStore.deleteItemAsync(EXPIRES_AT_KEY);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }
}
