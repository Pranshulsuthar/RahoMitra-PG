import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, RotateCcw, Info } from 'lucide-react'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useForm } from '../hooks/useForm'
import { compose, email as emailRule, maxLength, minLength, required } from '../utils/validation'
import { CONTACT_PLACEHOLDERS } from '../utils/constants'
import { PageHeader } from '../components/common/PageHeader'
import { Button } from '../components/common/Button'
import { TextAreaField, TextField } from '../components/forms/FormFields'

const INITIAL_VALUES = { name: '', email: '', subject: '', message: '' }

const VALIDATORS = {
  name: compose(required('Please enter your name.'), minLength(2, 'Name must be at least 2 characters.')),
  email: emailRule,
  subject: compose(
    required('Please add a subject.'),
    minLength(3, 'Subject must be at least 3 characters.'),
    maxLength(120, 'Subject must be 120 characters or fewer.'),
  ),
  message: compose(
    required('Please write your message.'),
    minLength(15, 'Message must be at least 15 characters.'),
    maxLength(2000, 'Message must be 2000 characters or fewer.'),
  ),
}

const INFO = [
  { icon: Mail, label: 'Email', value: CONTACT_PLACEHOLDERS.email, note: 'placeholder address' },
  { icon: Phone, label: 'Phone', value: CONTACT_PLACEHOLDERS.phone, note: 'not published yet' },
  { icon: MapPin, label: 'Office', value: CONTACT_PLACEHOLDERS.address, note: 'placeholder' },
  { icon: Clock, label: 'Response time', value: CONTACT_PLACEHOLDERS.responseTime, note: 'placeholder' },
]

export function Contact() {
  useDocumentTitle('Contact Us')
  const [sent, setSent] = useState(false)

  const { values, errors, submitted, handleSubmit, reset, handleChange } = useForm(
    INITIAL_VALUES,
    VALIDATORS,
  )

  const onSubmit = handleSubmit(() => {
    setSent(true)
  })

  return (
    <>
      <PageHeader
        title="Contact Us"
        subtitle="Questions about a listing, a property, or the platform itself? Send us a message and we will get back to you."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Contact Us' }]}
      />

      <section className="bg-white py-12 sm:py-16">
        <div className="page-container grid items-start gap-8 lg:grid-cols-[1fr_360px]">
          {/* Form */}
          <div className="rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8">
            {sent ? (
              <div className="py-6 text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-forest-soft text-forest">
                  <CheckCircle2 className="h-7 w-7" aria-hidden />
                </div>
                <h2 className="text-2xl">Your message is ready</h2>
                <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-soft">
                  This is a <strong className="font-semibold text-ink">frontend demo</strong> — no
                  message was actually sent anywhere, because this build has no backend yet. In the
                  live product, your message would now be delivered to the RahoMitra team.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      reset()
                      setSent(false)
                    }}
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden />
                    Write another message
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate>
                <h2 className="text-2xl">Send us a message</h2>
                <p className="mt-2 text-sm text-ink-soft">
                  All fields are validated in your browser. Nothing is transmitted from this demo.
                </p>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <TextField
                    id="name"
                    label="Name"
                    required
                    autoComplete="name"
                    placeholder="Your full name"
                    value={values.name}
                    error={submitted ? errors.name : undefined}
                    onChange={handleChange}
                  />
                  <TextField
                    id="email"
                    label="Email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={values.email}
                    error={submitted ? errors.email : undefined}
                    onChange={handleChange}
                  />
                </div>

                <div className="mt-5">
                  <TextField
                    id="subject"
                    label="Subject"
                    required
                    placeholder="What is this about?"
                    value={values.subject}
                    error={submitted ? errors.subject : undefined}
                    onChange={handleChange}
                  />
                </div>

                <div className="mt-5">
                  <TextAreaField
                    id="message"
                    label="Message"
                    required
                    rows={6}
                    maxLength={2000}
                    placeholder="Tell us how we can help…"
                    value={values.message}
                    error={submitted ? errors.message : undefined}
                    onChange={handleChange}
                  />
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <Button type="submit" variant="gold" size="lg">
                    <Send className="h-4 w-4" aria-hidden />
                    Submit message
                  </Button>
                  <span className="flex items-center gap-1.5 text-[12px] text-ink-mute">
                    <Info className="h-3.5 w-3.5" aria-hidden />
                    Demo form — no data leaves your browser.
                  </span>
                </div>
              </form>
            )}
          </div>

          {/* Contact details */}
          <aside className="rounded-3xl bg-forest p-6 text-ivory sm:p-7">
            <h2 className="text-xl text-ivory">Contact information</h2>
            <p className="mt-2 text-sm leading-relaxed text-ivory/65">
              Placeholder details — these will be replaced with verified contact information before
              launch.
            </p>

            <ul className="mt-6 space-y-5">
              {INFO.map(({ icon: Icon, label, value, note }) => (
                <li key={label} className="flex items-start gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ivory/10 text-gold">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
                      {label}
                    </span>
                    <span className="mt-1 block break-words text-sm text-ivory/85">{value}</span>
                    <span className="mt-0.5 block text-[11px] text-ivory/45">{note}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-7 rounded-xl border border-gold/30 bg-forest-dark/60 px-4 py-3 text-[12px] leading-relaxed text-ivory/70">
              Prefer talking to a property directly? Browse the{' '}
              <Link
                to="/explore"
                className="font-semibold text-gold underline-offset-2 hover:underline"
              >
                demo listings
              </Link>{' '}
              and contact owners yourself — admission is always finalised offline.
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
