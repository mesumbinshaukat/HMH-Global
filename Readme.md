# HMH Global E-commerce Platform

A full-stack e-commerce platform built with React.js frontend and Node.js/Express backend, deployed on Ubuntu VPS with Nginx reverse proxy.

## 🌐 Live Demo

**Website**: [http://hmhglobal.co.uk](http://hmhglobal.co.uk)
**API**: [http://hmhglobal.co.uk/api](http://hmhglobal.co.uk/api)

## 🚀 Key Features
- **Full E-commerce Functionality**: Product catalog, shopping cart, order management
- **User Authentication**: JWT-based authentication with role-based access control
- **Admin Dashboard**: Product management, order tracking, user management
- **Product Search & Filtering**: Advanced search with category, price, and brand filters
- **Product Grid & Pagination**: Loading skeletons, error handling, and pagination
- **Web Scraping**: Automated product import from Northwest Cosmetics with real-time progress
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **File Uploads**: Product image management
- **Email Integration**: Order confirmations and notifications

## Authentication Flow
- **Login/Registration:**
  - Emails are always lowercased and trimmed on both backend and frontend.
  - JWT is returned on successful login and stored in localStorage.
- **API Requests:**
  - JWT sent in Authorization header (`Bearer ...`).
- **SSE (Scraping Progress):**
  - JWT sent as `?token=...` query parameter for `/api/admin/scrape-progress`.
- **Admin Routes:**
  - Protected by both `authMiddleware` and `roleMiddleware('admin')`.

## API Response Structure
- All API responses are wrapped in an `ApiResponse<T>` object:
  ```json
  {
    "success": true,
    "data": { ... },
    "message": "...",
    "error": "..."
  }
  ```
- Always access returned data via `.data` property in frontend code.

## Running the Project
1. **Backend:**
   - `cd Backend`
   - `npm install`
   - `npm start`
2. **Frontend:**
   - `cd Frontend/hmh-global-frontend`
   - `npm install`
   - `npm start`

## Troubleshooting
- **Login Issues:**
  - Ensure email is lowercased in DB and when logging in.
  - Check backend logs for `[UserController] loginUser found user: null`.
- **SSE/401 Errors:**
  - Ensure JWT is sent as `?token=...` in EventSource URL.
  - Backend must accept token from query for SSE endpoints.
- **API Response Errors:**
  - Always use `.data` from `ApiResponse<T>` in frontend.

## Migration Notes
- All email handling is now case-insensitive.
- SSE endpoints require token in query, not header.
- API response shape is consistent across all endpoints.

---
For more details, see `Backend/API_Documentation.txt` for endpoint-level docs.
