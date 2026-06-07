import { useState } from 'react'

// ── RegEx Validation Patterns ─────────────────────────────────
const PATTERNS = {
  fullName:         /^[a-zA-Z\s]{2,50}$/,
  idNumber:         /^\d{13}$/,
  accountNumber:    /^\d{6,20}$/,
  password:         /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  amount:           /^\d+(\.\d{1,2})?$/,
  swiftCode:        /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
  recipientAccount: /^\d{6,20}$/,
  username:         /^[a-zA-Z0-9_]{3,20}$/,
}

function validate(field, value) {
  if (!PATTERNS[field]) return true
  return PATTERNS[field].test(value)
}

// ── Styles ────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Segoe UI', sans-serif", padding: '20px',
  },
  card: {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 20, padding: '40px',
    width: '100%', maxWidth: 460,
    boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
  },
  title:    { color: '#fff', fontSize: 24, textAlign: 'center', marginBottom: 6, fontWeight: 700 },
  subtitle: { color: '#a0aec0', fontSize: 14, textAlign: 'center', marginBottom: 28 },
  label:    { color: '#a0aec0', fontSize: 12, marginBottom: 4, display: 'block', fontWeight: 600 },
  input: {
    width: '100%', padding: '12px 16px', marginBottom: 8, borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)',
    color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  },
  select: {
    width: '100%', padding: '12px 16px', marginBottom: 8, borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(30,40,70,0.9)',
    color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  },
  button: {
    width: '100%', padding: '13px', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer', marginTop: 8,
  },
  btnGreen: {
    padding: '8px 16px', borderRadius: 8, border: 'none',
    background: '#38a169', color: '#fff', fontSize: 12,
    fontWeight: 600, cursor: 'pointer', marginRight: 6,
  },
  btnRed: {
    padding: '8px 16px', borderRadius: 8, border: 'none',
    background: '#e53e3e', color: '#fff', fontSize: 12,
    fontWeight: 600, cursor: 'pointer', marginRight: 6,
  },
  btnBlue: {
    padding: '8px 16px', borderRadius: 8, border: 'none',
    background: '#3182ce', color: '#fff', fontSize: 12,
    fontWeight: 600, cursor: 'pointer',
  },
  link:    { color: '#667eea', fontSize: 13, textAlign: 'center', cursor: 'pointer', marginTop: 14 },
  error:   { color: '#fc8181', fontSize: 12, marginBottom: 8 },
  success: { color: '#68d391', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  badge: {
    display: 'inline-block', padding: '3px 10px', borderRadius: 20,
    fontSize: 11, fontWeight: 600,
  },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: 16 },
  th: { background: 'rgba(255,255,255,0.1)', color: '#a0aec0', padding: '10px 12px',
        fontSize: 12, textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  td: { padding: '12px', fontSize: 13, color: '#e2e8f0',
        borderBottom: '1px solid rgba(255,255,255,0.05)' },
}

const API = 'http://localhost:3001'

export default function App() {
  const [page,    setPage]    = useState('home')
  const [token,   setToken]   = useState(null)
  const [role,    setRole]    = useState(null)
  const [empName, setEmpName] = useState('')
  const [message, setMessage] = useState('')
  const [errors,  setErrors]  = useState({})
  const [txns,    setTxns]    = useState([])

  const goTo = (p) => { setPage(p); setMessage(''); setErrors({}) }

  const logout = () => { setToken(null); setRole(null); goTo('home') }

  // ── Customer: Login ──────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    const accountNumber = e.target.accountNumber.value
    const password      = e.target.password.value
    const errs = {}
    if (!validate('accountNumber', accountNumber)) errs.accountNumber = 'Invalid account number'
    if (!validate('password', password))           errs.password = 'Invalid password format'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    const res  = await fetch(`${API}/api/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountNumber, password })
    })
    const data = await res.json()
    if (data.token) { setToken(data.token); setRole('customer'); goTo('payment') }
    else setMessage(data.error)
  }

  // ── Customer: Register ───────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault()
    const body = {
      fullName:      e.target.fullName.value,
      idNumber:      e.target.idNumber.value,
      accountNumber: e.target.accountNumber.value,
      password:      e.target.password.value,
    }
    const errs = {}
    if (!validate('fullName',      body.fullName))      errs.fullName      = 'Name: 2-50 letters only'
    if (!validate('idNumber',      body.idNumber))      errs.idNumber      = 'ID: exactly 13 digits'
    if (!validate('accountNumber', body.accountNumber)) errs.accountNumber = 'Account: 6-20 digits'
    if (!validate('password',      body.password))      errs.password      = 'Min 8 chars, uppercase, number & special'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    const res  = await fetch(`${API}/api/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await res.json()
    setMessage(data.message || data.error)
    if (data.message) goTo('login')
  }

  // ── Customer: Reset Password ─────────────────────────────────
  const handleReset = async (e) => {
    e.preventDefault()
    const body = {
      accountNumber: e.target.accountNumber.value,
      idNumber:      e.target.idNumber.value,
      newPassword:   e.target.newPassword.value,
    }
    const errs = {}
    if (!validate('accountNumber', body.accountNumber)) errs.accountNumber = 'Invalid account number'
    if (!validate('idNumber',      body.idNumber))      errs.idNumber      = 'ID: exactly 13 digits'
    if (!validate('password',      body.newPassword))   errs.newPassword   = 'Min 8 chars, uppercase, number & special'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    const res  = await fetch(`${API}/api/reset-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await res.json()
    setMessage(data.message || data.error)
    if (data.message) goTo('login')
  }

  // ── Customer: Payment ────────────────────────────────────────
  const handlePayment = async (e) => {
    e.preventDefault()
    const body = {
      amount:           e.target.amount.value,
      currency:         e.target.currency.value,
      swiftCode:        e.target.swiftCode.value.toUpperCase(),
      recipientAccount: e.target.recipientAccount.value,
    }
    const errs = {}
    if (!validate('amount',           body.amount))           errs.amount           = 'Invalid amount'
    if (!validate('swiftCode',        body.swiftCode))        errs.swiftCode        = 'Invalid SWIFT code'
    if (!validate('recipientAccount', body.recipientAccount)) errs.recipientAccount = 'Invalid account'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    const res  = await fetch(`${API}/api/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify(body)
    })
    const data = await res.json()
    setMessage(data.message || data.error)
  }

  // ── Employee: Login ──────────────────────────────────────────
  const handleEmpLogin = async (e) => {
    e.preventDefault()
    const username = e.target.username.value
    const password = e.target.password.value
    const errs = {}
    if (!validate('username', username)) errs.username = 'Invalid username'
    if (!validate('password', password)) errs.password = 'Invalid password format'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    const res  = await fetch(`${API}/api/employee/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    const data = await res.json()
    if (data.token) {
      setToken(data.token); setRole('employee')
      setEmpName(data.name); goTo('employee-dashboard')
      loadTransactions(data.token)
    } else setMessage(data.error)
  }

  // ── Employee: Load Transactions ──────────────────────────────
  const loadTransactions = async (t) => {
    const res  = await fetch(`${API}/api/employee/transactions`, {
      headers: { Authorization: `Bearer ${t || token}` }
    })
    const data = await res.json()
    setTxns(Array.isArray(data) ? data : [])
  }

  // ── Employee: Verify ─────────────────────────────────────────
  const handleVerify = async (id) => {
    const res  = await fetch(`${API}/api/employee/verify/${id}`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    setMessage(data.message || data.error)
    loadTransactions()
  }

  // ── Employee: Submit to SWIFT ────────────────────────────────
  const handleSubmit = async (id) => {
    const res  = await fetch(`${API}/api/employee/submit/${id}`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    setMessage(data.message || data.error)
    loadTransactions()
  }

  // ── Employee: Reject ─────────────────────────────────────────
  const handleReject = async (id) => {
    const res  = await fetch(`${API}/api/employee/reject/${id}`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    setMessage(data.message || data.error)
    loadTransactions()
  }

  const statusBadge = (status) => {
    const colors = {
      pending:   { bg: '#744210', color: '#fbd38d' },
      verified:  { bg: '#1a4731', color: '#9ae6b4' },
      submitted: { bg: '#1a365d', color: '#90cdf4' },
      rejected:  { bg: '#742a2a', color: '#feb2b2' },
    }
    const c = colors[status] || { bg: '#2d3748', color: '#a0aec0' }
    return (
      <span style={{ ...S.badge, background: c.bg, color: c.color }}>
        {status}
      </span>
    )
  }

  // ════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════
  return (
    <div style={S.page}>
      <div style={S.card}>

        {/* HOME */}
        {page === 'home' && (
          <>
            <h1 style={S.title}>🏦 Payment Portal</h1>
            <p style={S.subtitle}>APDS7311/w — International Banking System</p>
            <button style={S.button} onClick={() => goTo('login')}>
              👤 Customer Login
            </button>
            <button style={{ ...S.button, background: 'linear-gradient(135deg, #4c1d95, #7c3aed)', marginTop: 12 }}
              onClick={() => goTo('employee-login')}>
              🛡 Employee Login
            </button>
            <p style={{ ...S.link, marginTop: 16 }} onClick={() => goTo('register')}>
              New customer? Register here
            </p>
          </>
        )}

        {/* CUSTOMER LOGIN */}
        {page === 'login' && (
          <>
            <h1 style={S.title}>Customer Login</h1>
            <p style={S.subtitle}>Sign in to your account</p>
            {message && <p style={S.error}>{message}</p>}
            <form onSubmit={handleLogin}>
              <label style={S.label}>Account Number</label>
              <input style={S.input} name="accountNumber" placeholder="Enter account number" required />
              {errors.accountNumber && <p style={S.error}>{errors.accountNumber}</p>}
              <label style={S.label}>Password</label>
              <input style={S.input} name="password" type="password" placeholder="Enter password" required />
              {errors.password && <p style={S.error}>{errors.password}</p>}
              <button style={S.button} type="submit">Login</button>
            </form>
            <p style={S.link} onClick={() => goTo('reset')}>Forgot your password?</p>
            <p style={S.link} onClick={() => goTo('home')}>← Back</p>
          </>
        )}

        {/* CUSTOMER REGISTER */}
        {page === 'register' && (
          <>
            <h1 style={S.title}>Create Account</h1>
            <p style={S.subtitle}>Register for international payments</p>
            {message && <p style={message.includes('success') ? S.success : S.error}>{message}</p>}
            <form onSubmit={handleRegister}>
              <label style={S.label}>Full Name</label>
              <input style={S.input} name="fullName" placeholder="Enter full name" required />
              {errors.fullName && <p style={S.error}>{errors.fullName}</p>}
              <label style={S.label}>ID Number</label>
              <input style={S.input} name="idNumber" placeholder="13-digit SA ID number" required />
              {errors.idNumber && <p style={S.error}>{errors.idNumber}</p>}
              <label style={S.label}>Account Number</label>
              <input style={S.input} name="accountNumber" placeholder="6-20 digit account number" required />
              {errors.accountNumber && <p style={S.error}>{errors.accountNumber}</p>}
              <label style={S.label}>Password</label>
              <input style={S.input} name="password" type="password"
                placeholder="Min 8 chars, uppercase, number, symbol" required />
              {errors.password && <p style={S.error}>{errors.password}</p>}
              <button style={S.button} type="submit">Register</button>
            </form>
            <p style={S.link} onClick={() => goTo('login')}>Already have an account? Login</p>
          </>
        )}

        {/* CUSTOMER RESET PASSWORD */}
        {page === 'reset' && (
          <>
            <h1 style={S.title}>Reset Password</h1>
            <p style={S.subtitle}>Verify your identity to reset</p>
            {message && <p style={message.includes('success') ? S.success : S.error}>{message}</p>}
            <form onSubmit={handleReset}>
              <label style={S.label}>Account Number</label>
              <input style={S.input} name="accountNumber" placeholder="Enter account number" required />
              {errors.accountNumber && <p style={S.error}>{errors.accountNumber}</p>}
              <label style={S.label}>ID Number</label>
              <input style={S.input} name="idNumber" placeholder="13-digit SA ID number" required />
              {errors.idNumber && <p style={S.error}>{errors.idNumber}</p>}
              <label style={S.label}>New Password</label>
              <input style={S.input} name="newPassword" type="password"
                placeholder="Min 8 chars, uppercase, number, symbol" required />
              {errors.newPassword && <p style={S.error}>{errors.newPassword}</p>}
              <button style={S.button} type="submit">Reset Password</button>
            </form>
            <p style={S.link} onClick={() => goTo('login')}>← Back to Login</p>
          </>
        )}

        {/* CUSTOMER PAYMENT */}
        {page === 'payment' && (
          <>
            <h1 style={S.title}>💳 Make Payment</h1>
            <p style={S.subtitle}>Submit an international SWIFT payment</p>
            {message && <p style={message.includes('submitted') ? S.success : S.error}>{message}</p>}
            <form onSubmit={handlePayment}>
              <label style={S.label}>Amount</label>
              <input style={S.input} name="amount" placeholder="e.g. 1000.00" required />
              {errors.amount && <p style={S.error}>{errors.amount}</p>}
              <label style={S.label}>Currency</label>
              <select style={S.select} name="currency">
                <option>USD</option><option>EUR</option>
                <option>GBP</option><option>ZAR</option>
              </select>
              <label style={S.label}>SWIFT Code</label>
              <input style={S.input} name="swiftCode" placeholder="e.g. SBZAZAJJ" required />
              {errors.swiftCode && <p style={S.error}>{errors.swiftCode}</p>}
              <label style={S.label}>Recipient Account Number</label>
              <input style={S.input} name="recipientAccount" placeholder="Enter recipient account" required />
              {errors.recipientAccount && <p style={S.error}>{errors.recipientAccount}</p>}
              <button style={S.button} type="submit">💸 Pay Now</button>
            </form>
            <p style={S.link} onClick={logout}>Logout</p>
          </>
        )}

        {/* EMPLOYEE LOGIN */}
        {page === 'employee-login' && (
          <>
            <h1 style={S.title}>🛡 Employee Login</h1>
            <p style={S.subtitle}>Pre-registered staff access only</p>
            {message && <p style={S.error}>{message}</p>}
            <form onSubmit={handleEmpLogin}>
              <label style={S.label}>Username</label>
              <input style={S.input} name="username" placeholder="e.g. emp001" required />
              {errors.username && <p style={S.error}>{errors.username}</p>}
              <label style={S.label}>Password</label>
              <input style={S.input} name="password" type="password" placeholder="Enter password" required />
              {errors.password && <p style={S.error}>{errors.password}</p>}
              <button style={{ ...S.button, background: 'linear-gradient(135deg, #4c1d95, #7c3aed)' }}
                type="submit">Access Employee Portal</button>
            </form>
            <p style={S.link} onClick={() => goTo('home')}>← Back</p>
          </>
        )}

        {/* EMPLOYEE DASHBOARD */}
        {page === 'employee-dashboard' && (
          <>
            <h1 style={S.title}>Employee Dashboard</h1>
            <p style={S.subtitle}>Welcome, {empName} — Verify &amp; forward payments</p>
            {message && <p style={message.toLowerCase().includes('error') || message.toLowerCase().includes('invalid')
              ? S.error : S.success}>{message}</p>}
            <button style={{ ...S.button, padding: '10px', fontSize: 13, marginBottom: 12 }}
              onClick={() => loadTransactions()}>
              🔄 Refresh Transactions
            </button>
            {txns.length === 0 ? (
              <p style={{ color: '#a0aec0', textAlign: 'center', fontSize: 14 }}>
                No transactions found
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>ID</th>
                      <th style={S.th}>Amount</th>
                      <th style={S.th}>SWIFT</th>
                      <th style={S.th}>Status</th>
                      <th style={S.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txns.map(t => (
                      <tr key={t.id}>
                        <td style={S.td}>{t.id.slice(-6)}</td>
                        <td style={S.td}>{t.amount} {t.currency}</td>
                        <td style={S.td}>{t.swiftCode}</td>
                        <td style={S.td}>{statusBadge(t.status)}</td>
                        <td style={S.td}>
                          {t.status === 'pending' && (
                            <>
                              <button style={S.btnGreen} onClick={() => handleVerify(t.id)}>
                                ✓ Verify
                              </button>
                              <button style={S.btnRed} onClick={() => handleReject(t.id)}>
                                ✗ Reject
                              </button>
                            </>
                          )}
                          {t.status === 'verified' && (
                            <button style={S.btnBlue} onClick={() => handleSubmit(t.id)}>
                              → SWIFT
                            </button>
                          )}
                          {(t.status === 'submitted' || t.status === 'rejected') && (
                            <span style={{ color: '#718096', fontSize: 12 }}>
                              {t.status === 'submitted' ? '✅ Done' : '❌ Rejected'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p style={S.link} onClick={logout}>Logout</p>
          </>
        )}

      </div>
    </div>
  )
}
