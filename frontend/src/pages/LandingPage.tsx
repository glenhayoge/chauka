import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

export default function LandingPage() {
  const isLoggedIn = !!useAuthStore((s) => s.token)

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className=" px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className='mx-auto max-w-7xl flex items-center justify-between'>
          <div className="flex items-center gap-6">
            <span className="text-lg font-medium text-gray-900">Chauka</span>

          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-4 mr-8">
              <a href="#features" className="text-sm text-gray-500 hover:text-gray-900">Features</a>
              <a href="#about" className="text-sm text-gray-500 hover:text-gray-900">About</a>
              <Link to="/docs" className="text-sm text-gray-500 hover:text-gray-900">Docs</Link>
              <a href="#contact" className="text-sm text-gray-500 hover:text-gray-900">Contact</a>
            </div>
            {isLoggedIn ? (
              <Link to="/app" className="text-sm text-gray-700 hover:text-gray-900">Go to app</Link>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">Sign in</Link>
                <Link to="/register" className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded-md hover:bg-gray-800 transition-colors">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-24">
        <p className="text-4xl text-gray-900 font-bold leading-snug mb-4">
          Plan, monitor and report on development programs using logical frameworks.
        </p>
        <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-2xl">
          Chauka is an open-source MEL information system for development organisations.
          Helps you manage results chains, track indicators, control budgets and coordinate
          teams, from planning through to evaluation.
        </p>
        {!isLoggedIn && (
          <div className="flex gap-3 mb-16">
            <Link to="/register" className="bg-gray-900 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-800 transition-colors">
              Create an account
            </Link>
            <Link to="/login" className="border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded-md hover:bg-gray-50 transition-colors">
              Sign in
            </Link>
          </div>
        )}

        {/* Features */}
        <div id="features" className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 border-t border-gray-100 pt-10">
          <Feature
            title="Logframe design"
            description="Build results hierarchies — Impact, Outcome, Output, Activity with indicators, baselines and targets."
          />
          <Feature
            title="Progress monitoring"
            description="Track actuals against targets each period. Traffic-light ratings show what's on track and what needs attention."
          />
          <Feature
            title="Budget management"
            description="Categorised budget lines per activity with expense tracking, utilisation reports and rolled-up totals."
          />
          <Feature
            title="Resource planning"
            description="Assign staff, equipment, and partners to activities. Workload view flags over-allocation before it happens."
          />
          <Feature
            title="Multi-organisation"
            description="Organisations, programs, projects, logframes, flexible hierarchy that fits how you actually work."
          />
          <Feature
            title="Team collaboration"
            description="Role-based access, email invitations and a notification system to keep everyone in sync."
          />
          <Feature
            title="Data collection"
            description="KoboToolBox integration for importing field data directly into your indicator tracking."
          />
          <Feature
            title="Export and print"
            description="Quarterly reports, annual plans and print-friendly logframe views for meetings and donors."
          />
        </div>

        {/* Built for */}
        <div className="border-t border-gray-100 mt-12 pt-10">
          <p className="text-sm text-gray-900 mb-3">Built for</p>
          <div className="flex flex-wrap gap-2">
            {['NGOs', 'Government agencies', 'Donor-funded programmes', 'M&E teams', 'Project managers', 'Field organisations'].map((tag) => (
              <span key={tag} className="text-xs text-gray-500 border border-gray-200 rounded-md px-2.5 py-1">{tag}</span>
            ))}
          </div>
        </div>

        {/* About */}
        <div id="about" className="border-t border-gray-100 mt-12 pt-10">
          <p className="text-xl text-gray-900 mb-2">About Chauka</p>
          <div className="text-sm text-gray-500 leading-relaxed space-y-3">
            <p>
              Chauka is a monitoring, evaluation and learning (MEL) information system
              built for development organisations that use logical frameworks to plan
              and track their work.
            </p>
            <p>
              It replaces spreadsheets and disconnected tools with a single platform
              where teams can design logframes, set indicators with targets, enter
              monitoring data, manage budgets, plan resources and generate reports.
            </p>
            <p>
              The system supports flexible programme structures, from simple
              single-project logframes to multi-organisation programmes with dozens
              of projects and logframes across regions.
            </p>
          </div>

          {/* Name origin */}
          <div className="mt-8 flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex-shrink-0">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Philemon_albitorques.jpg/500px-Philemon_albitorques.jpg"
                alt="The Chauka bird (Philemon albitorques) from Manus Island, Papua New Guinea"
                className="w-full sm:w-48 rounded-lg object-cover"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Picture: <a href="https://en.wikipedia.org/wiki/Manus_friarbird" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-500">Manus friarbird</a> via Wikimedia Commons
              </p>
            </div>
            <div className="text-sm text-gray-500 leading-relaxed space-y-3">
              <p className="text-lg text-gray-900 font-medium">Why "Chauka"?</p>
              <p>
                The Chauka is a bird from Manus Island, Papua New Guinea. In Manus
                folklore, the Chauka is known as a guide, a time-keeper and a voice
                of caution and forewarning, calling out at key moments to mark the
                rhythm of the day and warn of what lies ahead.
              </p>
              <p>
                Like its namesake, this platform is designed to help organisations
                stay on track: monitoring progress against plans, flagging what needs
                attention and keeping teams aligned from planning through evaluation.
              </p>
            </div>
          </div>
        </div>

        {/* Open source */}
        <div className="border-t border-gray-100 mt-12 pt-10">
          <p className="text-lg text-gray-900 mb-2">Open source</p>
          <p className="text-sm text-gray-500 leading-relaxed">
            Chauka is free to use and open source. Self-host it for your organisation
            or use the hosted version. No vendor lock-in, your data is yours.
          </p>
        </div>

        {/* Contact */}
        <div id="contact" className="border-t border-gray-100 mt-12 pt-10">
          <p className="text-lg text-gray-900 mb-2">Get in touch</p>
          <p className="text-sm text-gray-500 mb-4">
            Questions, feedback or partnership enquiries, we'd like to hear from you.
          </p>
          <ContactForm />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span className="text-lg text-gray-400">Chauka</span>
          <div className="flex flex-wrap gap-4">
            <a href="#features" className="text-xs text-gray-400 hover:text-gray-500">Features</a>
            <a href="#about" className="text-xs text-gray-400 hover:text-gray-500">About</a>
            <Link to="/docs" className="text-xs text-gray-400 hover:text-gray-500">Docs</Link>
            <a href="#contact" className="text-xs text-gray-400 hover:text-gray-500">Contact</a>
            <Link to="/terms" className="text-xs text-gray-400 hover:text-gray-500">Terms</Link>
            <Link to="/privacy" className="text-xs text-gray-400 hover:text-gray-500">Privacy</Link>
            <a href="https://github.com/glenhayoge/chauka" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-gray-500">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <p className="text-lg text-gray-900 mb-1">{title}</p>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  )
}

function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // For now, just show confirmation. Wire to backend/email service later.
    setSent(true)
  }

  if (sent) {
    return <p className="text-sm text-gray-500">Thanks for reaching out. We'll get back to you.</p>
  }

  const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-600 mb-1">Message</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className={inputClass} required />
      </div>
      <button type="submit" className="bg-gray-900 text-white text-sm px-4 py-2 rounded-md hover:bg-gray-800 transition-colors">
        Send message
      </button>
    </form>
  )
}
