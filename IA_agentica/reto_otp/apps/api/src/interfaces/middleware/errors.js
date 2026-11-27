export function notFound(request, response) {
  response.status(404).json({ error: { code: 'not_found', message: `Ruta no encontrada: ${request.path}` } });
}

export function errorHandler(error, _request, response, _next) {
  const status = error.status ?? (error.code === 'LIMIT_FILE_SIZE' ? 413 : 400);
  const code = error.code ?? 'bad_request';
  response.status(status).json({
    error: {
      code: typeof code === 'string' ? code : 'bad_request',
      message: error.message ?? 'Error inesperado'
    }
  });
}

export function asyncRoute(handler) {
  return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next);
}
