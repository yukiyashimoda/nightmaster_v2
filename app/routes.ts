import { type RouteConfig, index, route, layout } from '@react-router/dev/routes'

export default [
  // Public routes
  route('login', 'routes/login.tsx'),
  route('logout', 'routes/logout.tsx'),

  // API routes (no auth required)
  route('api/setup', 'routes/api.setup.tsx'),
  route('api/migrate', 'routes/api.migrate.tsx'),
  route('api/seed-reservations', 'routes/api.seed-reservations.tsx'),
  route('api/favorite', 'routes/api.favorite.tsx'),
  route('api/visit/:id', 'routes/api.visit.$id.tsx'),
  route('api/reservation/:id', 'routes/api.reservation.$id.tsx'),

  // Protected routes (wrapped in auth layout)
  layout('routes/_auth.tsx', [
    index('routes/home.tsx'),
    route('customers', 'routes/customers.tsx'),
    route('customers/new', 'routes/customers.new.tsx'),
    route('customers/:id', 'routes/customers.$id.tsx'),
    route('customers/:id/edit', 'routes/customers.$id.edit.tsx'),
    route('customers/:id/visits/new', 'routes/customers.$id.visits.new.tsx'),
    route('casts', 'routes/casts.tsx'),
    route('casts/:id', 'routes/casts.$id.tsx'),
    route('casts/:id/edit', 'routes/casts.$id.edit.tsx'),
    route('reservations', 'routes/reservations.tsx'),
    route('reservations/new', 'routes/reservations.new.tsx'),
    route('favorites', 'routes/favorites.tsx'),
  ]),
] satisfies RouteConfig
