import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (demoEmail: string) => {
    setLoading(true);
    try {
      await login(demoEmail, 'password123');
      toast.success('Demo login successful!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error('Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">HomeServe</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Sign in to your account</h1>
          <p className="text-gray-600 mt-2">Welcome back! Enter your details below.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 text-center mb-3">Try a demo account:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => demoLogin('owner@example.com')}
                disabled={loading}
                className="text-sm py-2 px-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
              >
                🏠 Demo Owner
              </button>
              <button
                onClick={() => demoLogin('cleaner@example.com')}
                disabled={loading}
                className="text-sm py-2 px-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
              >
                🧹 Demo Provider
              </button>
            </div>
          </div>
        </div>

        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 font-medium hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
