# MERN Hospital Management App

A modern, full-stack hospital management system built with the MERN stack (MongoDB, Express, React, Node.js). This project enables hospital staff, admins, and vendors to manage patient records, diet plans, and reporting efficiently.

## Features
- User authentication (admin, user, vendor roles)
- Patient record management
- Diet and meal tracking
- Monthly and custom reporting
- Responsive, modern UI
- Role-based dashboards

## Tech Stack
- **Frontend:** React, Vite, Material-UI (MUI)
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Authentication:** JWT
- **Styling:** CSS, MUI

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB instance (local or cloud)

### Setup
1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd 5-mern-hospital-app-Automatic - Copy
   ```
2. **Install dependencies:**
   ```bash
   cd server && npm install
   cd ../frontend && npm install
   ```
3. **Configure environment variables:**
   - Copy `.env.example` to `.env` in `/server` and fill in your values.
4. **Run the app:**
   - In one terminal, start the backend:
     ```bash
     cd server && npm start
     ```
   - In another terminal, start the frontend:
     ```bash
     cd frontend && npm run dev
     ```
5. **Access the app:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:5000/api](http://localhost:5000/api)

## Folder Structure
```
5-mern-hospital-app-Automatic - Copy/
  frontend/      # React frontend
  server/        # Express backend
  README.md      # Project documentation
```

## Contributing
1. Fork the repo
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

## License
MIT

---

## Maintainers
- [Your Name](mailto:your@email.com)

## Screenshots
_Add screenshots or GIFs here_

## API Documentation
See `/server/README.md` or Swagger docs (coming soon). 