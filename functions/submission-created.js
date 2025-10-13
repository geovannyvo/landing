// Importar las herramientas necesarias. Tendrás que instalarlas.
// En tu terminal, corre: npm install @supabase/supabase-js node-fetch
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Esta es la función que Netlify ejecutará automáticamente con cada envío de formulario.
export const handler = async (event) => {
  // 1. Extraemos el email del formulario que Netlify nos entrega.
  const { payload } = JSON.parse(event.body);
  const email = payload.data.email;

  // 2. Obtenemos las URLs y claves de las variables de entorno de Netlify.
  // ¡Esto es mucho más seguro que ponerlas en el HTML!
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Importante: Usa la clave "service_role"
  const n8nWebhookUrl = process.env.N8N_CAPTURE_WEBHOOK_URL; // La URL de tu webhook de captura

  // 3. Inicializamos el cliente de Supabase
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 4. GUARDAR EN SUPABASE: Intentamos insertar el nuevo email en tu tabla 'leads'.
    // Asegúrate de que tu tabla se llame 'leads' y tenga una columna 'email'.
    const { data, error } = await supabase
      .from('leads')
      .insert([{ email: email }]);

    if (error) {
      // Si Supabase da un error, lo registramos y detenemos el proceso.
      throw new Error(`Error de Supabase: ${error.message}`);
    }

    // 5. ENVIAR WEBHOOK A N8N: Si todo fue bien con Supabase, enviamos los datos a n8n.
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email }),
    });

    if (!n8nResponse.ok) {
      // Si n8n falla, también lo registramos.
      throw new Error(`El webhook de n8n falló: ${n8nResponse.statusText}`);
    }

    // 6. Si ambos pasos fueron exitosos, devolvemos una respuesta positiva.
    // El usuario mientras tanto ya está siendo redirigido a gracias.html.
    return {
      statusCode: 200,
      body: JSON.stringify({ message: '¡Formulario procesado con éxito!' }),
    };

  } catch (error) {
    console.error(error);
    // Si algo falla, Netlify lo sabrá.
    return {
      statusCode: 500,
      body: JSON.stringify({ message: `Error: ${error.message}` }),
    };
  }
};
