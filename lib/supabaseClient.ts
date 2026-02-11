
import { createClient } from '@supabase/supabase-js';

// ======================================================================================
//  IMPORTANT CONFIGURATION
// ======================================================================================
// This application runs in an environment where client-side environment variables
// are not available through a standard build process (like Vite or Create React App).
// Therefore, the Supabase credentials must be provided directly here.
//
// The `SUPABASE_URL` has been deduced from your project's dashboard URL.
// PLEASE REPLACE 'YOUR_SUPABASE_ANON_KEY_HERE' with your actual public anonymous key.
// You can find this key in your Supabase project dashboard under Project Settings > API.
// ======================================================================================

const supabaseUrl = 'https://lzibaammjwrmjqkqwdml.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWJhYW1tandybWpxa3F3ZG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MDc3NjAsImV4cCI6MjA4NTk4Mzc2MH0.r9rtTQeGmJH5qZlq8DtAf0zhgnNwPelTnXMMtqY1hyI';

if (supabaseAnonKey.startsWith('YOUR_')) {
    // This provides a clear, actionable error message if the anon key hasn't been replaced.
    // It prevents the app from crashing with a generic authentication error from Supabase.
    const errorMessage = `
        <div style="padding: 2rem; font-family: 'Poppins', sans-serif; text-align: center;">
            <h1 style="color: #dc2626; font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">Configuration Required</h1>
            <div style="background-color: #fef2f2; border: 1px solid #fca5a5; padding: 1.5rem; border-radius: 0.5rem; color: #7f1d1d; font-family: monospace; text-align: left; line-height: 1.6;">
                <p>Please open the file: <strong style="color: #b91c1c;">lib/supabaseClient.ts</strong></p>
                <p>Replace the placeholder <strong style="color: #b91c1c;">'YOUR_SUPABASE_ANON_KEY_HERE'</strong> with your actual public anonymous key from your Supabase project.</p>
                <p style="margin-top: 1rem; font-size: 0.8rem;">You can find it under: Project Settings > API > Project API keys > anon (public).</p>
            </div>
        </div>
    `;
    // We render this error to the screen to make it highly visible.
    const root = document.getElementById('root');
    if (root) {
        root.innerHTML = errorMessage;
    }
    // We still throw an error to halt execution.
    throw new Error("Supabase anonymous key is not configured in lib/supabaseClient.ts.");
}

// Fix: Removed <Database> generic type as it is not exported from types.ts
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
