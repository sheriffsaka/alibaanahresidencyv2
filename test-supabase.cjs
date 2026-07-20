const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lzibaammjwrmjqkqwdml.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWJhYW1tandybWpxa3F3ZG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MDc3NjAsImV4cCI6MjA4NTk4Mzc2MH0.r9rtTQeGmJH5qZlq8DtAf0zhgnNwPelTnXMMtqY1hyI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'bookings' });
  if (error) {
    // If RPC doesn't exist, we can try running a generic query or fetching metadata
    console.log('RPC failed, trying raw query via select on a non-existent column to see the error, or query database...');
    // We can also try a SELECT with an empty filter to get the table columns
    const { data: bookingsData, error: selectError } = await supabase.from('bookings').select();
    if (selectError) {
      console.error('Select error:', selectError);
    } else {
      console.log('Bookings columns from empty select:', bookingsData);
    }
  } else {
    console.log('Table columns:', data);
  }
}

test();
