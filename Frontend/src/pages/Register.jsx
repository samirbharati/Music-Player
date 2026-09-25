import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', otp: '' });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Details, 2: OTP
  const { register, user } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/home" replace />;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!form.email || !form.username || form.password.length < 6) {
      return toast.error('Please fill all fields correctly');
    }
    setLoading(true);
    try {
      await authService.sendOtp(form.email);
      toast.success('OTP sent to your email! 📧');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) return handleSendOtp(e);
    
    setLoading(true);
    try {
      await register(form.username, form.email, form.password, form.otp);
      toast.success('Account created! 🎉');
      navigate('/home');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="form-card fade-in">
        <div className="form-logo">
          <div className="logo-icon">🎵</div>
          <h1>GrooveWave</h1>
        </div>
        <h2 className="form-title">{step === 1 ? 'Create account' : 'Verify Email'}</h2>
        <p className="form-subtitle">
          {step === 1 ? 'Start your music journey today' : `Enter the code sent to ${form.email}`}
        </p>

        <form onSubmit={handleSubmit}>
          {step === 1 ? (
            <>
              {[
                { id: 'reg-username', label: 'Username', key: 'username', type: 'text', placeholder: 'musiclover' },
                { id: 'reg-email', label: 'Email', key: 'email', type: 'email', placeholder: 'your@email.com' },
                { id: 'reg-password', label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
              ].map(({ id, label, key, type, placeholder }) => (
                <div className="form-group" key={key}>
                  <label className="form-label" htmlFor={id}>{label}</label>
                  <input
                    id={id}
                    type={type}
                    className="form-input"
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    required
                  />
                </div>
              ))}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', marginTop: 8 }}
              >
                {loading ? '⏳ Sending OTP...' : 'Next: Send OTP'}
              </button>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-otp">OTP Code</label>
                <input
                  id="reg-otp"
                  type="text"
                  className="form-input"
                  placeholder="123456"
                  maxLength={6}
                  value={form.otp}
                  onChange={e => setForm(f => ({ ...f, otp: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', marginTop: 8 }}
              >
                {loading ? '⏳ Verifying...' : '🚀 Create Account'}
              </button>
              <button
                type="button"
                className="btn-text"
                onClick={() => setStep(1)}
                style={{ width: '100%', marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}
              >
                ← Edit details
              </button>
            </>
          )}
        </form>

        <p className="form-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
