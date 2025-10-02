// Import the Supabase client library
import { createClient } from '@supabase/supabase-js';

// The handler function for the Netlify Function
exports.handler = async function(event, context) {
  // We only want to handle POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Parse the incoming request body to get the email
    const { email } = JSON.parse(event.body);

    if (!email) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Email es requerido.' }) };
    }

    // Get Supabase credentials from Netlify environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    // Create a new Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert the new email into the 'subscribers' table
    // Make sure you have a table named 'subscribers' with a column named 'email' in Supabase.
    const { data, error } = await supabase
      .from('subscribers')
      .insert([{ email: email }]);

    // If there was an error during insertion
    if (error) {
      console.error('Supabase error:', error);
      // Handle potential duplicate emails gracefully
      if (error.code === '23505') { // 23505 is the code for unique constraint violation
         return { statusCode: 409, body: JSON.stringify({ message: 'Este email ya está registrado.' }) };
      }
      return { statusCode: 500, body: JSON.stringify({ message: 'Error al guardar en la base de datos.' }) };
    }

    // If everything went well, return a success response
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Suscripción exitosa!' }),
    };

  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Hubo un problema con la solicitud.' }),
    };
  }
};

