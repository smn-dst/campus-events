const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'CampusEvents API',
    version: '1.0.0',
    description:
      'API REST pour la gestion d\'événements campus. Authentification JWT, CRUD événements, inscriptions, worker asynchrone.',
  },
  servers: [
    { url: 'http://api.localhost', description: 'Local (via Nginx reverse proxy)' },
  ],
  tags: [
    { name: 'Auth', description: 'Inscription, connexion et profil' },
    { name: 'Events', description: 'CRUD événements (admin) et consultation (public)' },
    { name: 'Registration', description: 'Inscription / désinscription à un événement' },
    { name: 'Health', description: 'Healthcheck' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtenu via POST /api/auth/login',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'clx1abc2300001' },
          email: { type: 'string', example: 'alice@campus.fr' },
          firstName: { type: 'string', example: 'Alice' },
          lastName: { type: 'string', example: 'Dupont' },
          role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Event: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'clx1def4500002' },
          title: { type: 'string', example: 'Hackathon IA 2026' },
          description: { type: 'string', example: '48h de code intensif sur le thème de l\'IA' },
          location: { type: 'string', example: 'Amphi A — Bâtiment Sciences' },
          tags: { type: 'array', items: { type: 'string' }, example: ['tech', 'hackathon'] },
          capacity: { type: 'integer', example: 100 },
          startAt: { type: 'string', format: 'date-time' },
          endAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          createdBy: { $ref: '#/components/schemas/User' },
          attendeesCount: { type: 'integer', example: 42 },
          availableSpots: { type: 'integer', example: 58 },
          isFull: { type: 'boolean', example: false },
        },
      },
      Registration: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          eventId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Message d\'erreur' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Healthcheck',
        responses: {
          200: {
            description: 'Service opérationnel',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Créer un compte',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName'],
                properties: {
                  email: { type: 'string', example: 'alice@campus.fr' },
                  password: { type: 'string', example: 'monMotDePasse123' },
                  firstName: { type: 'string', example: 'Alice' },
                  lastName: { type: 'string', example: 'Dupont' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Compte créé + token JWT',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
                  },
                },
              },
            },
          },
          400: { description: 'Champs manquants', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: 'Email déjà utilisé', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Se connecter',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'alice@campus.fr' },
                  password: { type: 'string', example: 'monMotDePasse123' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Connexion réussie + token JWT',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
                  },
                },
              },
            },
          },
          401: { description: 'Email ou mot de passe incorrect', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Profil de l\'utilisateur connecté',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Infos du user',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
          },
          401: { description: 'Non authentifié', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/events': {
      get: {
        tags: ['Events'],
        summary: 'Liste des événements (avec filtres)',
        parameters: [
          { name: 'tags', in: 'query', description: 'Filtrer par tags (séparés par des virgules)', schema: { type: 'string' }, example: 'sport,tech' },
          { name: 'location', in: 'query', description: 'Filtrer par lieu (recherche partielle)', schema: { type: 'string' } },
          { name: 'startDate', in: 'query', description: 'Date de début minimum (ISO 8601)', schema: { type: 'string', format: 'date-time' } },
          { name: 'endDate', in: 'query', description: 'Date de début maximum (ISO 8601)', schema: { type: 'string', format: 'date-time' } },
          { name: 'search', in: 'query', description: 'Recherche textuelle (titre ou description)', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Liste des événements',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Event' } },
              },
            },
          },
        },
      },
      post: {
        tags: ['Events'],
        summary: 'Créer un événement (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'location', 'capacity', 'startAt'],
                properties: {
                  title: { type: 'string', example: 'Hackathon IA 2026' },
                  description: { type: 'string', example: '48h de code sur le thème de l\'IA' },
                  location: { type: 'string', example: 'Amphi A — Bâtiment Sciences' },
                  tags: { type: 'array', items: { type: 'string' }, example: ['tech', 'hackathon'] },
                  capacity: { type: 'integer', example: 100 },
                  startAt: { type: 'string', format: 'date-time', example: '2026-03-15T09:00:00Z' },
                  endAt: { type: 'string', format: 'date-time', example: '2026-03-17T18:00:00Z' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Événement créé', content: { 'application/json': { schema: { $ref: '#/components/schemas/Event' } } } },
          400: { description: 'Données invalides', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Non authentifié', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Non admin', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/events/{id}': {
      get: {
        tags: ['Events'],
        summary: 'Détail d\'un événement',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Détail de l\'événement', content: { 'application/json': { schema: { $ref: '#/components/schemas/Event' } } } },
          404: { description: 'Événement non trouvé', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      put: {
        tags: ['Events'],
        summary: 'Modifier un événement (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  location: { type: 'string' },
                  tags: { type: 'array', items: { type: 'string' } },
                  capacity: { type: 'integer' },
                  startAt: { type: 'string', format: 'date-time' },
                  endAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Événement modifié', content: { 'application/json': { schema: { $ref: '#/components/schemas/Event' } } } },
          400: { description: 'Données invalides', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Non authentifié', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Non admin', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Événement non trouvé', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Events'],
        summary: 'Supprimer un événement (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Événement supprimé', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
          401: { description: 'Non authentifié', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: 'Non admin', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Événement non trouvé', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/events/{id}/register': {
      post: {
        tags: ['Registration'],
        summary: 'S\'inscrire à un événement',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          201: {
            description: 'Inscription réussie',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Successfully registered to event' },
                    registration: { $ref: '#/components/schemas/Registration' },
                  },
                },
              },
            },
          },
          400: { description: 'Événement plein, déjà inscrit, ou événement passé', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Non authentifié', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Événement non trouvé', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Registration'],
        summary: 'Se désinscrire d\'un événement',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Désinscription réussie', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
          401: { description: 'Non authentifié', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Événement ou inscription non trouvé', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/events/{id}/attendees': {
      get: {
        tags: ['Registration'],
        summary: 'Liste des inscrits à un événement',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Liste des participants',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    eventId: { type: 'string' },
                    count: { type: 'integer', example: 42 },
                    capacity: { type: 'integer', example: 100 },
                    attendees: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          registrationId: { type: 'string' },
                          registeredAt: { type: 'string', format: 'date-time' },
                          user: { $ref: '#/components/schemas/User' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Non authentifié', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Événement non trouvé', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    '/api/events/my/registrations': {
      get: {
        tags: ['Registration'],
        summary: 'Mes inscriptions',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Liste des événements auxquels le user est inscrit',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      registrationId: { type: 'string' },
                      registeredAt: { type: 'string', format: 'date-time' },
                      event: { $ref: '#/components/schemas/Event' },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Non authentifié', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
  },
};

export default swaggerSpec;
