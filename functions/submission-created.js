// Usamos 'require' para asegurar la compatibilidad con Netlify
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

exports.handler = async (event) => {
  console.log('Función submission-created activada.');

  try {
    const { payload } = JSON.parse(event.body);
    const email = payload.data.email;
    console.log(`Email recibido del formulario: ${email}`);

    // Validar que las variables de entorno están presentes
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    const n8nWebhookUrl = process.env.N8N_CAPTURE_WEBHOOK_URL;

    if (!supabaseUrl || !supabaseKey || !n8nWebhookUrl) {
      throw new Error("Faltan variables de entorno críticas (Supabase o n8n).");
    }
    console.log('Variables de entorno cargadas correctamente.');

    // Inicializar Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Cliente de Supabase inicializado.');

    // GUARDAR EN SUPABASE
    console.log("Intentando insertar en Supabase...");
    const { data, error } = await supabase
      .from('leads') // Asegúrate que tu tabla se llama 'leads'
      .insert([{ email: email }]);

    if (error) {
      console.error('Error de Supabase:', error.message);
      throw new Error(`Error de Supabase: ${error.message}`);
    }
    console.log('Email insertado en Supabase con éxito.', data);

    // ENVIAR WEBHOOK A N8N
    console.log('Enviando webhook a n8n...');
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email }),
    });

    if (!n8nResponse.ok) {
        const errorText = await n8nResponse.text();
        console.error('Error del webhook de n8n:', n8nResponse.status, errorText);
        throw new Error(`El webhook de n8n falló: ${n8nResponse.statusText}`);
    }
    console.log('Webhook enviado a n8n con éxito.');

    // Si todo fue exitoso
    return {
      statusCode: 200,
      body: JSON.stringify({ message: '¡Formulario procesado con éxito!' }),
    };

  } catch (error) {
    console.error('Error general en la función:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: `Error: ${error.message}` }),
    };
  }
};
