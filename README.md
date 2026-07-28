# Meridian — Login App (React + Flask + MongoDB)

A full-stack login/registration app.

- **Frontend:** React (username / password sign-in, plus a registration form with
  username, password, state, and city)
- **Backend:** Python (Flask) REST API, password hashing with bcrypt, JWT auth
- **Database:** MongoDB (one `users` collection)

```
login-app/
├── backend/
│   ├── app.py            Flask API (register, login, profile)
│   ├── requirements.txt
│   └── .env.example      Copy to .env and fill in
└── frontend/
    ├── public/index.html
    └── src/
        ├── App.js         Layout + view switching (login/register/dashboard)
        ├── App.css        Styling
        ├── api.js         Calls to the Flask API
        ├── components/
        │   ├── Login.js
        │   ├── Register.js
        │   └── Dashboard.js
        └── data/statesAndCities.js   Indian states → major cities lookup
```

## 1. Set up MongoDB

Use either:
- A **local MongoDB** install (`mongod` running on `localhost:27017`), or
- A free **MongoDB Atlas** cluster — grab its connection string.

You don't need to create the database or collection by hand; the backend creates
the `login_app` database and `users` collection automatically the first time it
runs, and creates a unique index on `username`.

## 2. Run the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # then edit .env with your MongoDB URI + a real JWT secret

python app.py                   # starts on http://localhost:5000
```

Check it's alive: open `http://localhost:5000/api/health` — you should see
`{"status": "ok", "database_connected": true}`.

## 3. Run the frontend

In a separate terminal:

```bash
cd frontend
npm install
npm start                       # starts on http://localhost:3000
```

The React dev server proxies API calls to `http://localhost:5000/api` by
default (see `frontend/src/api.js`). To point it elsewhere, create a
`frontend/.env` file with:

```
REACT_APP_API_URL=http://your-backend-host:5000/api
```

## How it works

1. **Register** — a user picks a username/password and their state + city.
   The backend hashes the password with bcrypt and stores the document in
   MongoDB. Usernames are enforced unique at the database level.
2. **Login** — the backend verifies the password hash and returns a signed
   JWT (24h expiry) plus the user's `username`, `state`, and `city`.
3. **Session** — the frontend stores the JWT in `localStorage` and sends it
   as a `Bearer` token on `/api/profile` to restore the session on refresh.
4. **Dashboard** — shows the logged-in user's name and their state/city.

## API reference

| Method | Route            | Body                                             | Auth        |
|--------|------------------|---------------------------------------------------|-------------|
| POST   | `/api/register`  | `{ username, password, state, city }`             | —           |
| POST   | `/api/login`     | `{ username, password }`                           | —           |
| GET    | `/api/profile`   | —                                                  | Bearer JWT  |
| GET    | `/api/health`    | —                                                  | —           |

## Security notes

- Passwords are never stored or returned in plain text — only bcrypt hashes.
- Change `JWT_SECRET` in `.env` to a long random value before using this for
  anything beyond local development.
- CORS is restricted to `CORS_ORIGIN` (defaults to the React dev server).
- For production, run Flask behind a proper WSGI server (e.g. gunicorn) and
  serve the React build (`npm run build`) via a static host or CDN.
