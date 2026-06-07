# employee-portal — APDS7311/w Task 3

International Banking Payments Portal — Employee Portal
Built with React + Vite (frontend) and Node.js + Express (backend)

## Employee Login Credentials (Demo)
| Username | Password    |
|----------|-------------|
| emp001   | Employee@1  |
| emp002   | Employee@2  |
| emp003   | Employee@3  |

## Setup & Run
```bash
# Install dependencies
npm install

# Start backend (port 3001)
node backend/server.js

# Start frontend (port 5173)
npm run dev
```

## Security Features
- bcryptjs password hashing (12 salt rounds)
- JWT authentication (1 hour expiry)
- Helmet.js HTTP security headers
- CORS restricted to frontend origin only
- Rate limiting — 100 requests per 15 minutes per IP
- Express-brute — 5 attempt lockout on login
- RegEx input whitelisting on all fields
- No employee registration — pre-seeded static accounts only
- SSL/TLS on all traffic

## DevSecOps Pipeline
CircleCI + SonarQube — triggers on every push to main branch

## Project Structure
```
employee-portal/
├── backend/
│   ├── .env          # JWT_SECRET, PORT
│   └── server.js     # Express API + all security middleware
├── src/
│   ├── App.jsx       # React frontend — all pages
│   ├── main.jsx      # Entry point
│   └── index.css
├── .circleci/
│   └── config.yml    # CI/CD pipeline
├── index.html
└── package.json
```

## Tools Used
React, Vite, Node.js, Express, bcryptjs, jsonwebtoken,
helmet, cors, express-rate-limit, express-brute, dotenv,
CircleCI, SonarQube, Claude AI (referenced)

## Group Members
| Name                | Student Number |
|---------------------|----------------|
| Abdullah Muhydeen   | ST10540222     |
| Viwe Mdashe         | ST10528403     |
| Thabiso Modisakeng  | ST10538807     |
| Sbahle Khuzwayo     | ST10540538     |

© 2026 — Application Development Security | APDS7311/w
