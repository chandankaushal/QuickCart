# QuickCart

A robust RESTful API for managing an e-commerce cart system with user authentication, store management, product inventory, and order processing.

## 🚀 Features

- **User Management**: Registration, login, and authentication with JWT
- **Store Management**: Multi-store support with location-based services
- **Product Catalog**: Product availability checking and inventory management
- **Order Processing**: Pickup order creation and management
- **Service Options**: Configurable service options with hold mechanisms
- **Monitoring**: Health check and monitoring endpoints
- **Logging**: Comprehensive logging with Pino and Datadog integration
- **Error Handling**: Centralized error handling with custom error types
- **Input Validation**: Request validation using Joi schemas
- **Security**: Password hashing with bcrypt, JWT authentication

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🛠️ Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/quickcart.git
cd QuickCart
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env` file in the root directory:

```env
PORT=2000
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=quickcart
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1h
ENVIRONMENT=dev
SERVICE_NAME=quickcart
```

4. Set up the database:

```bash
# Create database
createdb quickcart

# Run schema setup
psql -d quickcart -f DB_SCHEMA/usersTable.js
```

5. Start the server:

```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

## 📁 Project Structure

```
QuickCart/
├── controllers/         # Request handlers
│   ├── userController.js
│   ├── storeController.js
│   ├── productController.js
│   ├── orderController.js
│   ├── serviceOptionsController.js
│   └── monitoringController.js
├── models/             # Database models
│   ├── userModel.js
│   ├── storeModel.js
│   ├── productModel.js
│   ├── orderModel.js
│   ├── serviceOptionModel.js
│   ├── serviceOptionsHoldModel.js
│   └── joiSchema.js    # Validation schemas
├── service/            # Business logic layer
│   ├── userService.js
│   ├── storeService.js
│   ├── productService.js
│   ├── orderService.js
│   ├── serviceOptionsService.js
│   └── serviceOptionHoldService.js
├── routes/             # API routes
│   ├── userRoutes.js
│   ├── storeRoutes.js
│   ├── productRoutes.js
│   ├── orderRoutes.js
│   ├── serviceOptionsRoutes.js
│   └── monitoringRoutes.js
├── middleware/         # Custom middleware
│   ├── auth.js        # JWT authentication
│   ├── validate.js    # Request validation
│   ├── error.js       # Error handling
│   └── pinoLogger.js  # Request logging
├── utils/              # Utility functions
│   ├── hash.js        # Password hashing
│   ├── auth.js        # JWT token generation
│   ├── validEmail.js  # Email validation
│   ├── apiResponse.js # Standardized responses
│   ├── logger.js      # Pino logger configuration
│   ├── wrapAsync.js   # Async error wrapper
│   └── ExpressError.js # Custom error class
├── logs/               # Application logs
├── tests/              # Test files
├── DB_SCHEMA/          # Database schemas
├── db.js               # Database connection
├── index.js            # Application entry point
└── package.json        # Dependencies and scripts
```

## 🔌 API Endpoints

### User Management

```
POST   /users/register      - Register a new user
POST   /users/login         - User login
GET    /users/show          - Get user by email (authenticated)
PUT    /users/update        - Update user (authenticated)
DELETE /users/delete        - Delete user (authenticated)
```

### Store Management

```
POST   /stores/get_stores   - Get available stores (authenticated)
```

### Products

```
POST   /products/checkAvailability  - Check product availability
```

### Orders

```
POST   /orders/pickup/create_order  - Create pickup order (authenticated)
```

### Service Options

```
GET    /service_options/get         - Get service options (authenticated)
POST   /service_options/hold        - Hold service option (authenticated)
POST   /service_options/release     - Release held option (authenticated)
```

### Monitoring

```
GET    /monitoring/health           - Health check endpoint
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 📝 Request Examples

### Register User

```bash
curl -X POST http://localhost:2000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'
```

### Login

```bash
curl -X POST http://localhost:2000/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'
```

### Create Order (Authenticated)

```bash
curl -X POST http://localhost:2000/orders/pickup/create_order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "store_id": "store-uuid",
    "products": [
      {
        "product_id": "product-uuid",
        "quantity": 2
      }
    ],
    "service_option_id": "option-uuid"
  }'
```

## 🧪 Testing

Install test dependencies:

```bash
npm install --save-dev jest supertest
```

Run tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## 📊 Logging & Monitoring

- **Pino Logger**: Structured JSON logging
- **Datadog Integration**: APM tracing and metrics
- **Request Logging**: Every HTTP request is logged with trace IDs

Logs are stored in `logs/quickcart.log`

View logs:

```bash
tail -f logs/quickcart.log | npx pino-pretty
```

## 🛡️ Error Handling

All errors follow a consistent format:

```json
{
  "status": "error",
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Code                    | Description          | Status Code |
| ----------------------- | -------------------- | ----------- |
| `NO_USER_EXISTS`        | User not found       | 400         |
| `UNAUTHORIZED`          | Invalid credentials  | 401         |
| `NO_USER_ID`            | Missing user ID      | 400         |
| `UNIQUE_VIOLATION`      | Duplicate record     | 409         |
| `FOREIGN_KEY_VIOLATION` | Invalid reference    | 400         |
| `INVALID_INPUT`         | Invalid input format | 400         |
| `INTERNAL_ERROR`        | Server error         | 500         |

## 🚦 Database Error Handling

PostgreSQL errors are automatically handled by the error middleware:

- `23505` → Unique violation (409)
- `23503` → Foreign key violation (400)
- `22P02` → Invalid input format (400)

## 🔧 Development

### Available Scripts

```bash
npm start       # Start production server
npm run dev     # Start development server with nodemon
npm test        # Run tests
```

### Adding New Features

1. Create controller in `controllers/`
2. Create service logic in `service/`
3. Create model in `models/`
4. Add Joi validation schema in `models/joiSchema.js`
5. Create routes in `routes/`
6. Register routes in `index.js`

### Code Style Guidelines

- Use async/await for asynchronous operations
- Use descriptive variable and function names
- Include error handling in all async functions
- Log important operations
- Validate all user inputs with Joi

## 📦 Dependencies

### Production Dependencies

- **express** (v5.2.1) - Web framework
- **pg** (v8.16.3) - PostgreSQL client
- **bcrypt** (v6.0.0) - Password hashing
- **jsonwebtoken** (v9.0.3) - JWT authentication
- **joi** (v18.0.2) - Request validation
- **pino** (v10.1.0) - Logging
- **dd-trace** (v5.81.0) - Datadog APM
- **dotenv** (v17.2.3) - Environment configuration

### Development Dependencies

- **nodemon** (v3.1.11) - Development auto-reload
- **jest** - Testing framework (optional)
- **supertest** - API testing (optional)

## 🔒 Security Best Practices

- Passwords are hashed using bcrypt with salt rounds
- JWT tokens expire after configured time
- SQL injection protection via parameterized queries
- Input validation on all endpoints
- CORS configuration for production
- Environment variables for sensitive data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

ISC

## 🐛 Known Issues & TODOs

- [ ] JWT tokens are not stored in database for revocation
- [ ] Add database migration system
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Implement rate limiting
- [ ] Add refresh token mechanism
- [ ] Add email verification
- [ ] Add password reset functionality
- [ ] Improve test coverage

## 📞 Support

For issues and questions:

- Open an issue on GitHub
- Contact: support@quickcart.com

## 🙏 Acknowledgments

- Express.js team
- PostgreSQL community
- Pino logging library
- All contributors

---

**Built with ❤️ for efficient e-commerce management**
