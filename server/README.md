# Backend (Express API) - MERN Hospital Management App

This is the backend API for the MERN Hospital Management App. It provides RESTful endpoints for authentication, patient records, user management, and reporting.

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables:
   - Copy `.env.example` to `.env` and fill in your values.
3. Start the server:
   ```bash
   npm start
   ```

## Environment Variables
Create a `.env` file in `/server` with the following:
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

## API Endpoints
- `POST /api/auth/login` - Login for all roles
- `POST /api/auth/register` - Register (admin/user/vendor)
- `GET /api/admin/users` - List users (admin only)
- `POST /api/patients` - Add patient record (user only)
- `GET /api/patients/user/:userId/month/:month` - Get patient records for a user in a month (admin)
- `GET /api/patients/user/:userId/range` - Get patient records for a user in a date range (admin)
- `GET /api/vendor/records/today` - Get all patient records for today (vendor)

> More endpoints and details coming soon. See Swagger docs (to be added).

## Development
- Uses `nodemon` for hot-reloading (add as dev dependency if needed)
- Uses `morgan` for logging (to be added)

## Testing
- (To be added) Jest/Mocha tests

## License
MIT 