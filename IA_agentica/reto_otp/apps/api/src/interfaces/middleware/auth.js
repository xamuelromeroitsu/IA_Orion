import { demoUser } from '../../infrastructure/container.js';

const validRoles = ['cargador', 'revisor', 'aprobador', 'auditor'];
const roleAliases = { revisor: 'revisor', tecnico: 'revisor', financiero: 'revisor', evaluador: 'revisor' };

export function attachUser(request, _response, next) {
  const headerRole = String(request.header('x-demo-role') ?? '').toLowerCase();
  const role = roleAliases[headerRole] ?? (validRoles.includes(headerRole) ? headerRole : demoUser.role);
  request.user = { ...demoUser, role };
  next();
}

export function requireRole(...roles) {
  return (request, response, next) => {
    if (!request.user || !roles.includes(request.user.role)) {
      return response.status(403).json({ error: { code: 'forbidden', message: 'Rol no autorizado para esta acción' } });
    }
    return next();
  };
}
