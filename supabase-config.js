// Beauville SEZ — Shared Supabase connection
// This file holds the connection details used by every page that needs
// to talk to the database (login, registration, reading rewards, etc).
// The publishable key below is safe to expose publicly — it only works
// because Row Level Security (RLS) policies control what it can access.

const SUPABASE_URL = "https://takdjmyvtbyivzsptsrm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_IvQztZC5uljxEMDcjtopng_cwDXSTdE";

// Initialize the Supabase client (requires the Supabase JS library to be
// loaded on the page first, via the CDN script tag).
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
