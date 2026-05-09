# Maritime Operations & Compliance Frontend

React/Vite frontend for fleet maintenance, safety drills, crew participation, and compliance monitoring.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env`:
   ```env
   VITE_API_URL=http://localhost:5000/v1/
   ```
3. Start the app:
   ```bash
   npm run dev
   ```

## Role-Based UI

- `superAdmin`: Admin Management only.
- `admin`: Dashboard, Crew Management, Fleet Registry, Maintenance, Drills.
- `crew`: Crew Dashboard, assigned Maintenance, assigned Drills.

The frontend uses httpOnly cookie auth through the backend. Tokens are not stored in localStorage.

## Architecture Decisions

- Redux stores only the current authenticated user.
- React Query handles operational server state.
- Axios sends cookies with `withCredentials`.
- Forms validate important user errors before sending API requests.
