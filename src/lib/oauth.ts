import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

// Necessary for WebBrowser to handle redirects correctly in some environments
WebBrowser.maybeCompleteAuthSession();

export const performGoogleLogin = async () => {
    try {
        // Construct the redirect URL (dockify://auth/callback)
        const redirectTo = makeRedirectUri({
            scheme: 'dockify',
            path: 'auth/callback',
        });

        console.log('Google OAuth Redirect URL:', redirectTo);

        // Initiate OAuth flow with Supabase
        // We set skipBrowserRedirect to true because we want to control the browser opening via Expo WebBrowser
        // to insure the AuthSession works smoothly in Expo Go and Custom Dev Clients.
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo,
                skipBrowserRedirect: true,
                queryParams: {
                    prompt: 'select_account',
                },
            },
        });

        if (error) throw error;
        if (!data?.url) throw new Error('No auth URL returned from Supabase');

        // Open the browser with the authentication URL
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

        // Check if the user successfully authenticated and was redirected back
        if (result.type === 'success') {
            const { url } = result;

            // Supabase returns the session tokens in the URL fragment (hash) or query params depending on config.
            // Typically: dockify://auth/callback#access_token=...&refresh_token=...&provider_token=...

            // Helper to extract params from URL (handles both hash and query)
            const params = extractParamsFromUrl(url);

            if (params.access_token && params.refresh_token) {
                // Exchange tokens for a Supabase session
                const { data: { session }, error: sessionError } = await supabase.auth.setSession({
                    access_token: params.access_token,
                    refresh_token: params.refresh_token,
                });

                if (sessionError) throw sessionError;
                return session;
            } else {
                // If tokens are missing, maybe something went wrong or configured differently
                console.warn('Missing tokens in callback URL:', url);
                return null;
            }
        } else {
            // User cancelled or dismissed the browser
            return null;
        }

    } catch (error) {
        console.error('Google Login Error:', error);
        throw error;
    }
};

/**
 * Helper to parse URL parameters (both query and hash)
 */
const extractParamsFromUrl = (url: string): Record<string, string> => {
    const params: Record<string, string> = {};

    // Check for hash parameters first (Supabase default for implicit flow)
    let paramsString = '';
    const hashIndex = url.indexOf('#');

    if (hashIndex !== -1) {
        paramsString = url.substring(hashIndex + 1);
    } else {
        // Fallback to query parameters
        const queryIndex = url.indexOf('?');
        if (queryIndex !== -1) {
            paramsString = url.substring(queryIndex + 1);
        }
    }

    if (paramsString) {
        paramsString.split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            if (key && value) {
                params[key] = decodeURIComponent(value);
            }
        });
    }

    return params;
};
