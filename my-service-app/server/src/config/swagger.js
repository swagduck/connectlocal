const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Service App API',
      version: '1.0.0',
      description: 'API documentation for Service App - A comprehensive service marketplace platform',
      contact: {
        name: 'API Support',
        email: 'support@serviceapp.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://your-production-domain.com' 
          : `http://localhost:${process.env.PORT || 5000}`,
        description: process.env.NODE_ENV === 'production' 
          ? 'Production server' 
          : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            _id: {
              type: 'string',
              description: 'User ID'
            },
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 50,
              description: 'User full name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            password: {
              type: 'string',
              minLength: 8,
              description: 'User password (min 8 characters, must contain uppercase, lowercase, and numbers)'
            },
            phone: {
              type: 'string',
              pattern: '^(0|\\+84)[3-9][0-9]{8}$',
              description: 'Vietnamese phone number'
            },
            role: {
              type: 'string',
              enum: ['user', 'provider', 'admin'],
              default: 'user',
              description: 'User role'
            },
            avatar: {
              type: 'string',
              format: 'uri',
              description: 'Avatar image URL'
            },
            walletBalance: {
              type: 'number',
              default: 0,
              description: 'Wallet balance'
            },
            banned: {
              type: 'boolean',
              default: false,
              description: 'Whether user is banned'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update date'
            }
          }
        },
        Service: {
          type: 'object',
          required: ['title', 'description', 'category', 'price'],
          properties: {
            _id: {
              type: 'string',
              description: 'Service ID'
            },
            title: {
              type: 'string',
              minLength: 3,
              maxLength: 100,
              description: 'Service title'
            },
            description: {
              type: 'string',
              minLength: 10,
              maxLength: 2000,
              description: 'Service description'
            },
            category: {
              type: 'string',
              enum: ['technology', 'design', 'writing', 'marketing', 'business', 'other'],
              description: 'Service category'
            },
            price: {
              type: 'number',
              minimum: 0,
              description: 'Service price'
            },
            provider: {
              type: 'string',
              description: 'Provider user ID'
            },
            images: {
              type: 'array',
              items: {
                type: 'string',
                format: 'uri'
              },
              description: 'Service images'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Service tags'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'pending'],
              default: 'active',
              description: 'Service status'
            },
            rating: {
              type: 'number',
              minimum: 0,
              maximum: 5,
              default: 0,
              description: 'Average rating'
            },
            reviewCount: {
              type: 'number',
              minimum: 0,
              default: 0,
              description: 'Number of reviews'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Service creation date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update date'
            }
          }
        },
        Booking: {
          type: 'object',
          required: ['service', 'user', 'scheduledDate'],
          properties: {
            _id: {
              type: 'string',
              description: 'Booking ID'
            },
            service: {
              type: 'string',
              description: 'Service ID'
            },
            user: {
              type: 'string',
              description: 'User ID'
            },
            provider: {
              type: 'string',
              description: 'Provider user ID'
            },
            scheduledDate: {
              type: 'string',
              format: 'date-time',
              description: 'Scheduled date for the service'
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'completed', 'cancelled'],
              default: 'pending',
              description: 'Booking status'
            },
            totalPrice: {
              type: 'number',
              minimum: 0,
              description: 'Total price'
            },
            notes: {
              type: 'string',
              maxLength: 500,
              description: 'Additional notes'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Booking creation date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update date'
            }
          }
        },
        Review: {
          type: 'object',
          required: ['service', 'user', 'rating'],
          properties: {
            _id: {
              type: 'string',
              description: 'Review ID'
            },
            service: {
              type: 'string',
              description: 'Service ID'
            },
            user: {
              type: 'string',
              description: 'User ID'
            },
            rating: {
              type: 'number',
              minimum: 1,
              maximum: 5,
              description: 'Rating (1-5 stars)'
            },
            comment: {
              type: 'string',
              maxLength: 1000,
              description: 'Review comment'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Review creation date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update date'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Request success status'
            },
            token: {
              type: 'string',
              description: 'JWT access token'
            },
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token'
            },
            _id: {
              type: 'string',
              description: 'User ID'
            },
            name: {
              type: 'string',
              description: 'User name'
            },
            email: {
              type: 'string',
              description: 'User email'
            },
            role: {
              type: 'string',
              description: 'User role'
            },
            avatar: {
              type: 'string',
              description: 'User avatar URL'
            },
            walletBalance: {
              type: 'number',
              description: 'Wallet balance'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
              description: 'Request success status'
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of validation errors'
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
              description: 'Request success status'
            },
            message: {
              type: 'string',
              description: 'Success message'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.js', // Path to the API docs
    './src/controllers/*.js' // Path to controller docs
  ],
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi
};
