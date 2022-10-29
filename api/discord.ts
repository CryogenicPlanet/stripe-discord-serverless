import Stripe from 'stripe'

import { VercelRequest, VercelResponse } from '@vercel/node'

import { error, exec, sendCustomer, sendPaymentIntent } from './_util'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (!req.method || req.method.toUpperCase() !== 'POST') {
    res.status(405).json({
      success: false,
      message: `Cannot ${req.method} this endpoint. Must be POST`
    })
    return
  }

  const { id, token } = req.query as {
    id: string
    token: string
  }

  const event = req.body as Stripe.Event

  if (!event || !event.type || !event.data) {
    res.status(422).json({
      success: false,
      message: 'No body sent'
    })
    return
  }

  if (!event.data) {
    res.json({
      success: false,
      message: 'Issue data was not sent'
    })
    return
  }

  try {
    if (event.type === 'customer.created') {
      await sendCustomer(event, { id, token })
    } else if (event.type === 'payment_intent.succeeded') {
      await sendPaymentIntent(event, { id, token })
    } else {
      res.json({
        success: false,
        message: 'Currently only support customer creation and payment success '
      })
      return
    }

    res.json({
      success: true,
      message: 'Success, webhook has been sent.'
    })
  } catch (e) {
    const url = `https://discord.com/api/webhooks/${id}/${token}`
    await exec(url, error((e as Error).message))

    res.status(500).json({
      success: false,
      message: `Something went wrong: ${(e as Error).message}`
    })
  }
}
