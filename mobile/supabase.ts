import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xzdsbsjtqfhcbaujcjjl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6ZHNic2p0cWZoY2JhdWpjampsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNzM1MDQsImV4cCI6MjA4NzY0OTUwNH0.BNlTmSV8BmT9DRQUrb9n3DRr-grkLzxkoaY5fgP5ZgA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);