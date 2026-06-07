/* eslint-env node */
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const bcrypt      = require('bcryptjs');
const jwt         = require('jsonwebtoken');
const rateLimit   = require('express-rate-limit');
const ExpressBrute= require('express-brute');
require('dotenv').config();

const app = express();

// ── Security Middleware ──────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Rate Limiting — DDoS Protection
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// Brute-force protection on login
const store     = new ExpressBrute.MemoryStore();
const bruteforce = new ExpressBrute(store, {
  freeRetries: 5,
  minWait: 5000,
  maxWait: 60000,
});

// ── In-memory data stores ────────────────────────────────────
const customers    = [];
const employees    = [];
const transactions = [];

// ── RegEx Validation Patterns ────────────────────────────────
const NAME_REGEX     = /^[a-zA-Z\s]{2,50}$/;
const ID_REGEX       = /^\d{13}$/;
const ACCOUNT_REGEX  = /^\d{6,20}$/;
const AMOUNT_REGEX   = /^\d+(\.\d{1,2})?$/;
const SWIFT_REGEX    = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

// ── Seed employee accounts on startup ────────────────────────
async function seedEmployees() {
  const accounts = [
    { username: 'emp001', password: 'Employee@1', name: 'Alice Johnson' },
    { username: 'emp002', password: 'Employee@2', name: 'Bob Smith'     },
    { username: 'emp003', password: 'Employee@3', name: 'Carol White'   },
  ];
  for (const acc of accounts) {
    const hashed = await bcrypt.hash(acc.password, 12);
    employees.push({ ...acc, password: hashed, role: 'employee' });
  }
  console.log('Employee accounts seeded');
}
seedEmployees();

// ════════════════════════════════════════════
// CUSTOMER ROUTES
// ════════════════════════════════════════════

// POST /api/register
app.post('/api/register', async (req, res) => {
  const { fullName, idNumber, accountNumber, password } = req.body;
  if (!NAME_REGEX.test(fullName))          return res.status(400).json({ error: 'Invalid name' });
  if (!ID_REGEX.test(idNumber))            return res.status(400).json({ error: 'Invalid ID number' });
  if (!ACCOUNT_REGEX.test(accountNumber))  return res.status(400).json({ error: 'Invalid account number' });
  if (!PASSWORD_REGEX.test(password))      return res.status(400).json({ error: 'Invalid password format' });
  if (customers.find(u => u.accountNumber === accountNumber))
    return res.status(400).json({ error: 'Account already exists' });
  const hashed = await bcrypt.hash(password, 12);
  customers.push({ fullName, idNumber, accountNumber, password: hashed, role: 'customer' });
  res.json({ message: 'Registered successfully' });
});

// POST /api/login
app.post('/api/login', bruteforce.prevent, async (req, res) => {
  const { accountNumber, password } = req.body;
  if (!ACCOUNT_REGEX.test(accountNumber)) return res.status(400).json({ error: 'Invalid account number' });
  const user = customers.find(u => u.accountNumber === accountNumber);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign(
    { accountNumber, role: 'customer', name: user.fullName },
    process.env.JWT_SECRET || 'secret123',
    { expiresIn: '1h' }
  );
  res.json({ token, role: 'customer' });
});

// POST /api/reset-password
app.post('/api/reset-password', async (req, res) => {
  const { accountNumber, idNumber, newPassword } = req.body;
  if (!ACCOUNT_REGEX.test(accountNumber))  return res.status(400).json({ error: 'Invalid account number' });
  if (!ID_REGEX.test(idNumber))            return res.status(400).json({ error: 'Invalid ID number' });
  if (!PASSWORD_REGEX.test(newPassword))   return res.status(400).json({ error: 'Invalid password format' });
  const user = customers.find(u => u.accountNumber === accountNumber && u.idNumber === idNumber);
  if (!user) return res.status(404).json({ error: 'Account not found or ID number incorrect' });
  user.password = await bcrypt.hash(newPassword, 12);
  res.json({ message: 'Password reset successfully' });
});

// POST /api/payment  (customer submits payment)
app.post('/api/payment', (req, res) => {
  const { amount, currency, swiftCode, recipientAccount } = req.body;
  if (!AMOUNT_REGEX.test(amount))            return res.status(400).json({ error: 'Invalid amount' });
  if (!SWIFT_REGEX.test(swiftCode))          return res.status(400).json({ error: 'Invalid SWIFT code' });
  if (!ACCOUNT_REGEX.test(recipientAccount)) return res.status(400).json({ error: 'Invalid account' });
  const id = `TXN${Date.now()}`;
  transactions.push({
    id, amount, currency, swiftCode, recipientAccount,
    status: 'pending', submittedAt: new Date().toISOString()
  });
  res.json({ message: 'Payment submitted', id });
});

// GET /api/transactions  (customer views own transactions)
app.get('/api/transactions', (req, res) => {
  res.json(transactions);
});

// ════════════════════════════════════════════
// EMPLOYEE ROUTES
// ════════════════════════════════════════════

// POST /api/employee/login  (no registration — static accounts only)
app.post('/api/employee/login', bruteforce.prevent, async (req, res) => {
  const { username, password } = req.body;
  if (!USERNAME_REGEX.test(username)) return res.status(400).json({ error: 'Invalid username' });
  if (!PASSWORD_REGEX.test(password)) return res.status(400).json({ error: 'Invalid password format' });
  const emp = employees.find(e => e.username === username);
  if (!emp) return res.status(401).json({ error: 'Invalid credentials' });
  const match = await bcrypt.compare(password, emp.password);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign(
    { username, role: 'employee', name: emp.name },
    process.env.JWT_SECRET || 'secret123',
    { expiresIn: '1h' }
  );
  res.json({ token, role: 'employee', name: emp.name });
});

// Middleware — verify employee JWT
function verifyEmployee(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'secret123');
    if (decoded.role !== 'employee') return res.status(403).json({ error: 'Access denied' });
    req.employee = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// GET /api/employee/transactions  (view all pending transactions)
app.get('/api/employee/transactions', verifyEmployee, (req, res) => {
  res.json(transactions);
});

// PUT /api/employee/verify/:id  (verify a transaction)
app.put('/api/employee/verify/:id', verifyEmployee, (req, res) => {
  const txn = transactions.find(t => t.id === req.params.id);
  if (!txn) return res.status(404).json({ error: 'Transaction not found' });
  if (txn.status !== 'pending') return res.status(400).json({ error: 'Transaction already processed' });

  // Re-validate SWIFT code and account before verifying
  if (!SWIFT_REGEX.test(txn.swiftCode))
    return res.status(400).json({ error: 'Invalid SWIFT code — return to portal to fix or reject' });
  if (!ACCOUNT_REGEX.test(txn.recipientAccount))
    return res.status(400).json({ error: 'Invalid account — return to portal to fix or reject' });

  txn.status      = 'verified';
  txn.verifiedBy  = req.employee.name;
  txn.verifiedAt  = new Date().toISOString();
  res.json({ message: 'Transaction verified', txn });
});

// PUT /api/employee/submit/:id  (submit verified transaction to SWIFT)
app.put('/api/employee/submit/:id', verifyEmployee, (req, res) => {
  const txn = transactions.find(t => t.id === req.params.id);
  if (!txn) return res.status(404).json({ error: 'Transaction not found' });
  if (txn.status !== 'verified') return res.status(400).json({ error: 'Transaction must be verified first' });
  txn.status      = 'submitted';
  txn.submittedToSwiftAt = new Date().toISOString();
  res.json({ message: 'Transaction submitted to SWIFT', txn });
});

// PUT /api/employee/reject/:id  (reject a transaction — sends back to portal)
app.put('/api/employee/reject/:id', verifyEmployee, (req, res) => {
  const txn = transactions.find(t => t.id === req.params.id);
  if (!txn) return res.status(404).json({ error: 'Transaction not found' });
  txn.status     = 'rejected';
  txn.rejectedBy = req.employee.name;
  txn.rejectedAt = new Date().toISOString();
  res.json({ message: 'Transaction rejected — returned to portal for correction', txn });
});

app.listen(process.env.PORT || 3001, () =>
  console.log(`Server running on port ${process.env.PORT || 3001}`)
);
