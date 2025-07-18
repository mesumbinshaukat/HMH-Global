# HMH Global E-Commerce Platform

## Key Features
- **Product Search & Filtering:**
  - Search bar and advanced filters (category, price, brand) for product catalog.
  - Responsive filters panel with clear/reset option.
- **Product Grid & Pagination:**
  - Loading skeletons, error handling, and empty state messages.
  - Pagination with Previous/Next and direct page navigation.
- **Admin Dashboard:**
  - Product import (scraping) from Northwest Cosmetics with real-time SSE progress.
  - Order and product management, bulk actions, and export.
- **Authentication:**
  - JWT-based login/register, with email always stored and searched in lowercase.
  - Token sent in Authorization header for API, and as `?token=...` query for SSE endpoints.

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
