# QuickCart

A robust RESTful API for managing an e-commerce cart system with user authentication, store management, product inventory, and order processing.

## 🚀 Features

### ✅ Implemented

- **User Management**: Registration, login, and JWT-based authentication
- **Token System**: Access tokens + refresh tokens with HTTP-only cookies
- **Token Security**: Database-stored tokens with automatic revocation on suspected theft
- **Store Management**: Location-based store lookup by zip code
- **Product Catalog**: Product availability and stock checking by UPC
- **Order Processing**: Pickup order creation with transactional integrity
- **Service Options**: Time slot reservation with hold/expiry mechanism
- **Monitoring**: Database health check endpoint
- **Logging**: Structured JSON logging with Pino + Datadog APM integration
- **Error Handling**: Centralized error handling with custom ExpressError class
- **Input Validation**: Request validation using Joi schemas
- **Security**: Password hashing with bcrypt, parameterized SQL queries
- **Testing**: Jest test suite with 56% code coverage

- **Webhook Integration**: Order state changes trigger webhooks to external OMS (Order Management System) with rollback on failure
- **Service Layer**: All business logic is handled in dedicated service files, including transactional helpers like `withTransaction`

### 🚧 Partially Implemented

- **User Update**: Endpoint exists but not fully implemented

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
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=development
ENVIRONMENT=dev
SERVICE_NAME=quickcart
WEBHOOK_URL=https://your-oms-endpoint.com/webhook
SES_SMTP_ENDPOINT=email-smtp.us-east-1.amazonaws.com
SES_SMTP_USERNAME=your_smtp_username
SES_SMTP_PASSWORD=your_smtp_password
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
# Development with auto-reload (add script to package.json first)
npx nodemon index.js

# Production
node index.js
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
├── models/             # Database models & validation
│   ├── userModel.js
│   ├── storeModel.js
│   ├── productModel.js
│   ├── orderModel.js
│   ├── serviceOptionModel.js
│   ├── serviceOptionsHoldModel.js
│   ├── jwtTokenModel.js    # JWT token DB operations
│   └── joiSchema.js        # Joi validation schemas
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
│   ├── auth.js        # JWT authentication & refresh token validation
│   ├── validate.js    # Request validation with Joi
│   ├── error.js       # Centralized error handling
│   └── pinoLogger.js  # Request logging with Pino
├── utils/              # Utility functions
│   ├── hash.js        # Password hashing (bcrypt)
│   ├── auth.js        # JWT token generation & storage
│   ├── validEmail.js  # Email validation
│   ├── apiResponse.js # Standardized API responses
│   ├── logger.js      # Pino logger configuration
│   ├── wrapAsync.js   # Async error wrapper
│   ├── withTransaction.js # Database transaction helper
│   ├── items.js       # Item utilities
│   └── ExpressError.js # Custom error class
├── tests/              # Jest test files
│   ├── hashPassword.test.js
│   ├── validateEmail.test.js
│   ├── userService.test.js
│   ├── storeService.test.js
│   ├── productService.test.js
│   ├── orderService.test.js
│   └── serviceOptionsService.test.js
├── coverage/           # Test coverage reports
├── logs/               # Application logs
├── DB_SCHEMA/          # Database schemas
├── db.js               # PostgreSQL connection pool
├── index.js            # Application entry point
├── Dockerfile          # Docker configuration
└── package.json        # Dependencies and scripts
```

## 🛒 Order Flow

The pickup order creation follows this sequence:

1. **Find Stores** → `POST /stores/get_stores` with zip code
2. **Check Availability** → `POST /products/checkAvailability` with items and store
3. **Get Service Options** → `POST /service_options/pickup` for available time slots
4. **Reserve Slot** → `POST /service_options/reserve` to hold a time slot
5. **Create Order** → `POST /orders/pickup/create_order` with held slot ID

**Transactional Order Processing:**
All order creation and state transitions are performed inside a database transaction using the `withTransaction` utility. If any step fails (including sending a webhook), all changes are rolled back to maintain consistency.

Steps in the transaction:

- Validate service option hold is not expired
- Verify product availability
- Mark service option hold as taken
- Update product quantities
- Create the order record
- Send a webhook to the OMS (Order Management System)

If the webhook fails, the transaction is rolled back and the order state is not updated.

## 🔌 API Endpoints

## 🌐 Webhook Integration

Order state changes (e.g., pickup, delivered) trigger a webhook to the configured OMS endpoint (`WEBHOOK_URL`).
If the webhook fails, the database transaction is rolled back and the order state is not updated.

Webhook payload example:

```json
{
  "id": "order_id",
  "state": "next_state",
  "type": "ORDER_UPDATED"
}
```

**Service Layer:**
All business logic is handled in the `service/` directory. Transactional operations use the `withTransaction` utility from `utils/withTransaction.js` to ensure atomicity and consistency.

### User Management

| Method | Endpoint          | Auth  | Description                         |
| ------ | ----------------- | ----- | ----------------------------------- |
| POST   | `/users/register` | No    | Register a new user                 |
| POST   | `/users/login`    | No    | User login (returns JWT tokens)     |
| GET    | `/users/show`     | Yes   | Get user by email (query param)     |
| PUT    | `/users/update`   | No    | Update user (not fully implemented) |
| DELETE | `/users/delete`   | No    | Delete user by email                |
| POST   | `/users/refresh`  | Yes\* | Refresh access token using cookie   |

\*Uses refresh token from HTTP-only cookie

### Store Management

| Method | Endpoint             | Auth | Description                       |
| ------ | -------------------- | ---- | --------------------------------- |
| POST   | `/stores/get_stores` | Yes  | Get stores by zip code and street |

### Products

| Method | Endpoint                      | Auth | Description                      |
| ------ | ----------------------------- | ---- | -------------------------------- |
| POST   | `/products/checkAvailability` | No   | Check product stock availability |

### Orders

| Method | Endpoint                      | Auth | Description           |
| ------ | ----------------------------- | ---- | --------------------- |
| POST   | `/orders/pickup/create_order` | Yes  | Create a pickup order |

### Service Options

| Method | Endpoint                   | Auth | Description                         |
| ------ | -------------------------- | ---- | ----------------------------------- |
| POST   | `/service_options/pickup`  | Yes  | Get pickup service options by store |
| POST   | `/service_options/reserve` | Yes  | Reserve a service option slot       |

### Monitoring

| Method | Endpoint         | Auth | Description                      |
| ------ | ---------------- | ---- | -------------------------------- |
| GET    | `/`              | No   | Server health check              |
| GET    | `/monitoring/db` | No   | Database connection health check |

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication with a refresh token mechanism.

### Access Token

Include the access token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

### Refresh Token

- Stored as HTTP-only secure cookie (`refresh_token`)
- Automatically set on login
- Use `POST /users/refresh` to get a new access token
- Tokens are stored in database for validation and revocation
- Automatic revocation of all tokens on suspected theft

## 📝 Request Examples

### Register User

```bash
curl -X POST http://localhost:2000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Validation:**

- `name`: 3-30 characters, required
- `email`: valid email format, required
- `password`: minimum 4 characters, required

### Login

```bash
curl -X POST http://localhost:2000/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Response:** Access token in body, refresh token as HTTP-only cookie

### Get Stores by Location

```bash
curl -X POST http://localhost:2000/stores/get_stores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "zip_code": 12345,
    "street": "Main St"
  }'
```

### Check Product Availability

```bash
curl -X POST http://localhost:2000/products/checkAvailability \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "upc": 123456789, "qty": 2 },
      { "upc": 987654321, "qty": 1 }
    ],
    "location_code": 1001
  }'
```

### Get Service Options for Pickup

```bash
curl -X POST http://localhost:2000/service_options/pickup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "store_id": 1001
  }'
```

### Reserve Service Option

```bash
curl -X POST http://localhost:2000/service_options/reserve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "service_option_id": 5
  }'
```

### Create Pickup Order (Authenticated)

```bash
curl -X POST http://localhost:2000/orders/pickup/create_order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "order_id": "550e8400-e29b-41d4-a716-446655440000",
    "location_code": 1001,
    "service_option_hold_id": 123,
    "items": [
      { "upc": 123456789, "qty": 2 },
      { "upc": 987654321, "qty": 1 }
    ]
  }'
```

**Validation:**

- `order_id`: UUID format, required
- `location_code`: integer, required
- `service_option_hold_id`: integer (from reserve step), required
- `items`: array of objects with `upc` (integer) and `qty` (min 1), required

### Refresh Access Token

```bash
curl -X POST http://localhost:2000/users/refresh \
  -H "Cookie: refresh_token=YOUR_REFRESH_TOKEN"
```

## 🧪 Testing

Test coverage includes all major services, models, and utility functions. See the `tests/` folder for Jest test files. Coverage reports are available in `coverage/`.

Tests are written using Jest (^30.2.0). Run tests:

```bash
# Run all tests
npm test
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

All errors are handled centrally using the custom `ExpressError` class and error middleware. Database errors, validation errors, and external service errors (e.g., webhook failures) are returned in a consistent format.

All errors follow a consistent format:

```json
{
  "status": "error",
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

| Code                            | Description                          | Status Code |
| ------------------------------- | ------------------------------------ | ----------- |
| `NO_USER_EXISTS`                | User not found                       | 400         |
| `NO_USER_FOUND`                 | User does not exist or no permission | 400         |
| `NO_USER_ID`                    | Missing user ID                      | 400         |
| `INVALID_EMAIL`                 | Email format is invalid              | 400         |
| `UNAUTHORIZED`                  | Invalid credentials                  | 401         |
| `MISSING_OR_NO_TOKEN`           | Auth token missing or invalid        | 401         |
| `NO_STORES_FOUND`               | No stores for location               | 400         |
| `ITEM_NOT_FOUND`                | Product not found in inventory       | 400         |
| `NOT_AVAILABLE`                 | Products not available               | 400         |
| `NO_UPDATE`                     | Nothing was updated in DB            | 400         |
| `NOT_FOUND`                     | Resource not found                   | 400         |
| `INVALID_STORE_ID`              | Invalid store identifier             | 400         |
| `INVALID_SERVICE_OPTION`        | Service option ID invalid            | 400         |
| `SERVICE_OPTION_ALREADY_TAKEN`  | Service option slot taken            | 400         |
| `SERVICE_OPTION_RESERVE_ERROR`  | Failed to reserve service option     | 500         |
| `SERVICE_OPTION_HOLD_NOT_FOUND` | Service option hold not found        | 404         |
| `SERVICE_OPTIONS_HOLD_EXPIRED`  | Service option hold expired          | 400         |
| `UNIQUE_VIOLATION`              | Duplicate record (PostgreSQL)        | 409         |
| `FOREIGN_KEY_VIOLATION`         | Invalid reference (PostgreSQL)       | 400         |
| `INVALID_INPUT`                 | Invalid input format (PostgreSQL)    | 400         |
| `INTERNAL_ERROR`                | Server error                         | 500         |
| `INTERNAL_SERVER_ERROR`         | Internal server error                | 500         |

## 🚦 Database Error Handling

PostgreSQL errors are automatically handled by the error middleware:

- `23505` → Unique violation (409)
- `23503` → Foreign key violation (400)
- `22P02` → Invalid input format (400)

## 🔧 Development

### Available Scripts

```bash
npm test        # Run tests with Jest
```

> **Note:** Add `"start": "node index.js"` and `"dev": "nodemon index.js"` to package.json scripts for production/development servers.

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

- **express** (^5.2.1) - Web framework
- **pg** (^8.16.3) - PostgreSQL client
- **bcrypt** (^6.0.0) - Password hashing
- **jsonwebtoken** (^9.0.3) - JWT authentication
- **joi** (^18.0.2) - Request validation
- **pino** (^10.1.0) - Logging
- **pino-http** (^11.0.0) - HTTP request logging
- **pino-datadog** (^2.0.2) - Datadog log integration
- **dd-trace** (^5.81.0) - Datadog APM
- **dotenv** (^17.2.3) - Environment configuration
- **cookie-parser** (^1.4.7) - Cookie parsing middleware
- **nodemon** (^3.1.11) - Development auto-reload

### Development Dependencies

- **jest** (^30.2.0) - Testing framework

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
- [x] Add test coverage for core services
- [ ] Improve test coverage (currently at 56.12% statements, 31.81% branches)

## 📊 Test Coverage

| Metric     | Coverage | Covered/Total |
| ---------- | -------- | ------------- |
| Statements | 56.12%   | 55/98         |
| Branches   | 31.81%   | 7/22          |
| Functions  | 37.5%    | 6/16          |
| Lines      | 56.12%   | 55/98         |

### Test Files

- `hashPassword.test.js` - Password hashing utilities
- `validateEmail.test.js` - Email validation utilities
- `userService.test.js` - User service layer
- `storeService.test.js` - Store service layer
- `productService.test.js` - Product service layer
- `orderService.test.js` - Order service layer
- `serviceOptionsService.test.js` - Service options layer

## 📞 Support

For issues, questions, or feature requests:

- Open an issue on GitHub
- Contact: support@quickcart.com

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
