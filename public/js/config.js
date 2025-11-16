// Configuration file for environment variables
// In production, these should be set via environment variables or secure configuration
window.GAME_CONFIG = {
    // Supabase configuration - these should be loaded from environment variables
    SUPABASE_URL: 'https://dxxfrnjslutosymapfqq.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4eGZybmpzbHV0b3N5bWFwZnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMzYwMjIsImV4cCI6MjA3ODgxMjAyMn0.Qk7NIq-vHaXAufu47Ker1NZ_DkOCHxqMPWnpWhj7kAY',
    
    // Game configuration
    GAME_TIMER: 180,
    LMS_TIMER: 210,
    WORLD_WIDTH: 2000,
    WORLD_HEIGHT: 1500
};

// Set global variables for backward compatibility
window.SUPABASE_URL = window.GAME_CONFIG.SUPABASE_URL;
window.SUPABASE_ANON_KEY = window.GAME_CONFIG.SUPABASE_ANON_KEY;