import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null

interface CheckoutFormProps {
  onSuccess: () => void
}

function CheckoutForm({ onSuccess }: CheckoutFormProps) {
  const { t } = useTranslation()
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setError(null)
    setSubmitting(true)

    const result = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })

    if (result.error) {
      setError(result.error.message ?? t('shopEnroll.paymentFailed'))
      setSubmitting(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)}>
      <div className="stripe-element-container">
        <PaymentElement />
      </div>
      {error ? <div className="auth-error">{error}</div> : null}
      <button className="btn btn-primary btn-lg auth-submit" type="submit" disabled={submitting || !stripe}>
        {submitting ? t('shopEnroll.processing') : t('shopEnroll.pay')}
      </button>
    </form>
  )
}

interface StripePaymentFormProps {
  clientSecret: string
  onSuccess: () => void
}

export function StripePaymentForm({ clientSecret, onSuccess }: StripePaymentFormProps) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm onSuccess={onSuccess} />
    </Elements>
  )
}
