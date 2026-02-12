import { useEffect, useState } from 'react'
import html2canvas from 'html2canvas'
import './App.css'

function App() {
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [date, setDate] = useState('')
  const [amount, setAmount] = useState(99)
  const [bookings, setBookings] = useState([])
  const [message, setMessage] = useState('')
  const [activePaymentBooking, setActivePaymentBooking] = useState(null)
  const [lastBooking, setLastBooking] = useState(null)
  const [screenshotUrl, setScreenshotUrl] = useState(null)

  useEffect(() => {
    const raw = localStorage.getItem('bookings')
    if (raw) setBookings(JSON.parse(raw))
  }, [])

  useEffect(() => {
    localStorage.setItem('bookings', JSON.stringify(bookings))
  }, [bookings])

  function resetForm() {
    setName('')
    setMobile('')
    setDate('')
    setAmount(99)
    setMessage('')
  }

  function handleBook(e) {
    e.preventDefault()
    setMessage('')
    if (!name.trim() || !mobile.trim() || !date) {
      setMessage('Please fill name, mobile and choose a date.')
      return
    }
    // basic mobile validation (10 digits)
    if (!/^[0-9]{10}$/.test(mobile.trim())) {
      setMessage('Please enter a valid 10-digit mobile number.')
      return
    }
    if (Number(amount) < 99) {
      setMessage('Minimum payment is ₹99 for a 30-minute session.')
      return
    }

    const booking = {
      id: Date.now(),
      name: name.trim(),
      mobile: mobile.trim(),
      date,
      amount: Number(amount),
      durationMinutes: 30,
      paid: false,
    }

    setBookings((s) => [booking, ...s])
    setLastBooking(booking)
    resetForm()
    setMessage('Booking created — please click Pay to complete payment.')
  }

  function handlePay(id) {
    const booking = bookings.find((b) => b.id === id)
    if (!booking) return
    // Open payment panel with QR code for this booking
    setActivePaymentBooking(booking)
    setMessage('Scan the QR code to complete payment, then click "I have paid".')
  }

  function completePayment(id) {
    const booking = bookings.find((b) => b.id === id)
    if (!booking) return
    setBookings((list) =>
      list.map((b) => (b.id === id ? { ...b, paid: true } : b)),
    )
    setActivePaymentBooking(null)
    setMessage('Payment successful. Your session is confirmed!')
    setLastBooking((prev) => (prev && prev.id === id ? { ...prev, paid: true } : prev))
    
    // Capture screenshot and send confirmation
    setTimeout(() => {
      captureAndShareConfirmation(booking)
    }, 800)
  }

  async function captureAndShareConfirmation(booking) {
    try {
      // Capture the confirmation card
      const confirmationElement = document.querySelector('.confirmation-card')
      if (!confirmationElement) return
      
      const canvas = await html2canvas(confirmationElement, { backgroundColor: '#ffffff' })
      const imageDataUrl = canvas.toDataURL('image/png')
      setScreenshotUrl(imageDataUrl)
      
      // Also send to WhatsApp
      const whatsappMessage = `Payment Confirmation ✓

Name: ${booking.name}
Date: ${new Date(booking.date).toLocaleDateString()}
Amount: ₹${booking.amount}
Duration: 30 minutes

Your session with English with Priya is confirmed!`
      
      const whatsappUrl = `https://wa.me/917856079641?text=${encodeURIComponent(whatsappMessage)}`
      window.open(whatsappUrl, '_blank')
    } catch (error) {
      console.error('Error capturing confirmation:', error)
    }
  }

  function handleCancel(id) {
    if (!confirm('Cancel this booking?')) return
    setBookings((list) => list.filter((b) => b.id !== id))
    setMessage('Booking canceled.')
  }

  return (
    <div className="app-root">
      <header>
        <h1>One-to-One Session</h1>
        <h2>English with Priya</h2>
        
        
        <p>30-minute session. Minimum payment: ₹99.</p>
      </header>

      <main>
        <section className="benefits">
          <h2>Why book a one-to-one session?</h2>
          <ul>
            <li><strong>Personalized English speaking coaching:</strong> focused speaking practice, pronunciation correction.</li>
            <li><strong>Content creation guidance:</strong> idea generation, scripting, and storytelling techniques to make your content clearer and more engaging.</li>
            <li><strong>Live feedback:</strong> real-time corrections, phrasing improvements, and confidence-building during practice conversations.</li>
            <li><strong>Audience & platform tips:</strong> how to adapt tone and language for YouTube, Reels, Shorts, or livestreams.</li>
          
            <li><strong>Friendly</strong> sessions focused on personal growth.</li>
          </ul>
        </section>
        <form className="booking-form" onSubmit={handleBook}>
          <label>
            Your name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          <label>
            Your mobile
            <input
              type="tel"
              placeholder="10-digit mobile"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
          </label>

          <label>
            Choose date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>

          <label>
            Amount (IND)
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>

          <div className="form-actions">
            <button type="submit" className="btn primary">
              Book Session
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                resetForm()
                setMessage('Form cleared.')
              }}
            >
              Clear
            </button>
          </div>
        </form>

        <section className="message">{message}</section>

        {activePaymentBooking && (
          <section className="payment-panel">
            <h3>Pay for booking — {activePaymentBooking.name}</h3>
            <p>Amount: ₹{activePaymentBooking.amount} • 30 minutes</p>
            <div className="qr-wrap">
              <img
                alt="QR code for UPI payment"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
                  `upi://pay?pa=6203984648@ybl&pn=PersonalCoach&am=${activePaymentBooking.amount}&tn=SessionBooking&tr=${activePaymentBooking.id}`,
                )}`}
              />
            </div>
            <p className="qr-instruction">Scan this QR code with your UPI app (PhonePe, Google Pay, Paytm) to pay ₹{activePaymentBooking.amount}.</p>
            <div className="form-actions">
              <button
                className="btn primary"
                onClick={() => completePayment(activePaymentBooking.id)}
              >
                I have paid
              </button>
              <button
                className="btn"
                onClick={() => setActivePaymentBooking(null)}
              >
                Cancel
              </button>
            </div>
          </section>
        )}
        {/* Private confirmation only — do not list all bookings */}
        <section className="confirmation">
          {lastBooking ? (
            <div className="confirmation-card">
              <h3>Booking Confirmation</h3>
              <p>
                Hi <strong>{lastBooking.name}</strong>, your 30-minute session is
                scheduled for {new Date(lastBooking.date).toLocaleDateString()}.
              </p>
              <p>Amount: ₹{lastBooking.amount} • Paid: {lastBooking.paid ? 'Yes' : 'No'}</p>
              {!lastBooking.paid && (
                <div className="form-actions">
                  <button className="btn primary" onClick={() => handlePay(lastBooking.id)}>
                    Pay now
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p style={{ opacity: 0.9 }}>No recent booking information to show.</p>
          )}
        </section>

        {screenshotUrl && (
          <section className="screenshot-section">
            <h3>Payment Confirmation Screenshot</h3>
            <img src={screenshotUrl} alt="Payment confirmation" className="screenshot-img" />
            <p className="screenshot-note">A WhatsApp window has opened with your confirmation message. Share this screenshot or message with us.</p>
            <button className="btn primary" onClick={() => setScreenshotUrl(null)}>Close</button>
          </section>
        )}
      </main>

      <footer>
        <div className="footer-content">
          <div className="footer-section">
            <h4>About Sessions</h4>
            <p>30-minute personalized coaching focused on English speaking & content creation.</p>
          </div>
          <div className="footer-section">
            <h4>What You'll Get</h4>
            <ul>
              <li>Live English speaking practice</li>
              <li>Content creation tips</li>
              <li>Real-time feedback & guidance</li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Payment</h4>
            <p>Secure UPI payment. Minimum ₹99 per session.</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Personal Coaching. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
