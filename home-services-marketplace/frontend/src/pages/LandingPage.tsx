import { Link } from 'react-router-dom';
import { CheckCircle, Clock, CreditCard, Home, Shield, Star } from 'lucide-react';
import { SERVICE_ICONS, SERVICE_LABELS, ServiceType } from '../types';

const services: ServiceType[] = ['cleaning', 'handyman', 'landscaping', 'pet_sitting', 'home_check'];

const testimonials = [
  { name: 'Sarah M.', role: 'Airbnb Superhost', rating: 5, text: 'HomeServe completely transformed how I manage my 3 rental properties. My cleaners show up every time and I get photo reports after every job.' },
  { name: 'David K.', role: 'VRBO Host', rating: 5, text: 'As a remote property owner, HomeServe gives me peace of mind. The home check service is invaluable when I can\'t be there in person.' },
  { name: 'Lisa T.', role: 'Property Manager', rating: 5, text: 'I manage 12 short-term rentals and HomeServe is essential to my operation. The scheduling and payment systems save me hours every week.' },
];

const steps = [
  { icon: Home, title: 'Add Your Properties', desc: 'Register your rental properties with details and access instructions.' },
  { icon: Clock, title: 'Book Services', desc: 'Schedule cleaning, repairs, landscaping and more with a few clicks.' },
  { icon: Shield, title: 'Track & Verify', desc: 'Get real-time updates, photo documentation, and quality checklists.' },
  { icon: CreditCard, title: 'Pay Securely', desc: 'Automated payments released only when jobs are completed satisfactorily.' },
];

export function LandingPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-900 to-primary-700 text-white py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 text-sm mb-6">
            <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            <span>Trusted by 5,000+ Airbnb hosts nationwide</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Home Services Built for<br />
            <span className="text-sky-300">Short-Term Rental Hosts</span>
          </h1>
          <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
            Connect with vetted cleaners, handymen, landscapers, and more. Manage scheduling, payments, and quality — all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register?role=owner"
              className="bg-white text-primary-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary-50 transition-colors shadow-lg"
            >
              Start as Property Owner
            </Link>
            <Link
              to="/register?role=provider"
              className="bg-primary-500 border-2 border-white/40 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-primary-400 transition-colors"
            >
              Join as Service Provider
            </Link>
          </div>
          <p className="mt-6 text-primary-200 text-sm">No setup fees · Cancel anytime · 15% platform fee only on completed jobs</p>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Every Service Your Property Needs</h2>
            <p className="text-gray-600 text-lg">From turnover cleaning to emergency repairs, we have you covered.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {services.map((service) => (
              <div key={service} className="bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                <div className="text-4xl mb-3">{SERVICE_ICONS[service]}</div>
                <h3 className="font-semibold text-gray-900">{SERVICE_LABELS[service]}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {service === 'cleaning' && 'Turnover & deep clean'}
                  {service === 'handyman' && 'Repairs & maintenance'}
                  {service === 'landscaping' && 'Lawn & garden care'}
                  {service === 'pet_sitting' && 'Care for guest pets'}
                  {service === 'home_check' && 'Remote inspections'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How HomeServe Works</h2>
            <p className="text-gray-600 text-lg">Get started in minutes and scale your property management effortlessly.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-8 h-8 text-primary-600" />
                </div>
                <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-3">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-primary-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Everything Airbnb Hosts Need</h2>
              <div className="space-y-4">
                {[
                  'Automated turnover scheduling synced with your calendar',
                  'Photo documentation before & after every service',
                  'Task checklists tailored to each service type',
                  'Secure payments with automatic provider payouts',
                  'Background-checked, reviewed service providers',
                  'Real-time job tracking and status updates',
                  'In-app messaging with your service team',
                  'Multi-property management from one dashboard',
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
              <Link to="/register" className="inline-block mt-8 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700">
                Get Started Free
              </Link>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Beach House Retreat</h3>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">Active</span>
              </div>
              <div className="space-y-3">
                {[
                  { service: '🧹 Cleaning', time: 'Today, 10:00 AM', status: 'In Progress', color: 'text-purple-600' },
                  { service: '🔧 Handyman', time: 'Tomorrow, 2:00 PM', status: 'Scheduled', color: 'text-blue-600' },
                  { service: '🌿 Landscaping', time: 'Fri, 8:00 AM', status: 'Pending', color: 'text-yellow-600' },
                ].map((job, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{job.service}</p>
                      <p className="text-xs text-gray-500">{job.time}</p>
                    </div>
                    <span className={`text-xs font-medium ${job.color}`}>{job.status}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">This month</span>
                  <span className="font-semibold text-gray-900">$847 in services</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Loved by Property Hosts</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <p className="text-sm text-gray-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-primary-900 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Simplify Your Rental Operations?</h2>
          <p className="text-primary-200 text-lg mb-8">Join thousands of Airbnb hosts who trust HomeServe to keep their properties guest-ready.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register?role=owner" className="bg-white text-primary-800 px-8 py-4 rounded-xl font-bold hover:bg-primary-50 transition-colors">
              Start as Property Owner
            </Link>
            <Link to="/register?role=provider" className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-primary-800 transition-colors">
              Become a Provider
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-lg">HomeServe</span>
            </div>
            <div className="flex gap-8 text-sm">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Service</a>
              <a href="#" className="hover:text-white">Support</a>
            </div>
          </div>
          <div className="mt-8 text-center text-sm">
            © 2024 HomeServe. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
