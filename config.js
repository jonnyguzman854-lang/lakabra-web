// Configuración pública de Supabase. La clave publicable puede usarse en el navegador.
window.LAKABRA_SUPABASE_URL = 'https://bagbgkadjqrmlkucmgue.supabase.co';
window.LAKABRA_SUPABASE_KEY = 'sb_publishable_msUh4SIrJiLK8p6o26X9mg_6Q6MVc-N';

if (!window.supabase) {
  console.error('No se cargó la librería de Supabase.');
} else {
  window.lakabraDb = window.supabase.createClient(
    window.LAKABRA_SUPABASE_URL,
    window.LAKABRA_SUPABASE_KEY
  );
}
