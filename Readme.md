# 🌍 HMH Global Ltd – Web Platform

This is the official web platform for **HMH Global Ltd**, built using the **Appwrite + MERN stack** architecture.

---

## 🧱 Project Structure

```bash
HMH-Global/
│
├── frontend/           # React.js frontend (client)
│
├── backend/            # Express.js backend (API server)
│   ├── controllers/    # Handle request logic
│   ├── models/         # Appwrite schema abstraction or local schemas
│   ├── views/          # (If using template rendering - optional)
│   ├── routes/         # API routes
│   ├── middlewares/    # Auth, error handling, validation
│   ├── services/       # Appwrite SDK abstraction
│   ├── utils/          # Helper functions
│   ├── app.js          # Express app instance
│   └── server.js       # Entry point
│
├── .env                # Environment variables
├── .gitignore
└── README.md
