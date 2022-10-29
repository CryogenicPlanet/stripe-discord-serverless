import { EmbedBuilder } from 'discord.js'
import moment from 'moment'
import fetch from 'node-fetch'
import Stripe from 'stripe'

/**
 * Get the task ID from url
 * @param link task url
 */
export function getId(link: string): string {
  return link.split('/')[5].split('#')[0]
}

/**
 * Finds all image URLs in some content
 * @param content The content to parse images from
 */
export function parseImages(content: string): {
  images: string[]
  content: string
} {
  if (content.trim() === '') {
    return { images: [], content }
  }

  return {
    images:
      content.match(/\b(https?:\/\/\S+(?:png|jpe?g|gif|webm)\S*)\b/g) || [],
    content: content.replace(/!\[/g, '[')
  }
}

export function error(message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('Something went wrong')
    .setDescription(message)
    .setColor('#ff6363')
    .setFooter({
      text: `Stripe App`,
      iconURL:
        'https://pbs.twimg.com/profile_images/1503494829094756357/ihaECs5p_400x400.jpg'
    })
    .setTimestamp()
}

export function exec(url: string, embed: EmbedBuilder) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [embed.toJSON()]
    })
  })
}

export const sendCustomer = async (
  payload: Stripe.Event,
  webhook: { id: String; token: String }
) => {
  const url = `https://discord.com/api/webhooks/${webhook.id}/${webhook.token}?wait=true`

  if (payload.type !== 'customer.created') return
  const data = payload.data.object as Stripe.Customer

  const embed = new EmbedBuilder()
    .setColor('#4752b2')
    .setTitle('New customer')
    .addFields({ name: 'Email', value: `${data.email}` })
    .setTimestamp(moment(payload.created).toDate())
    .setFooter({
      text: `Stripe App • ${payload.type}`,
      iconURL:
        'https://pbs.twimg.com/profile_images/1503494829094756357/ihaECs5p_400x400.jpg'
    })

  const request = await exec(url, embed)

  if (request.status !== 200) {
    throw new Error(`Could not send message to discord. \`${request.status}\``)
  }

  const response = await request.json()

  return {
    url,
    response,
    status: request.status
  }
}

export const sendPaymentIntent = async (
  payload: Stripe.Event,
  webhook: { id: String; token: String }
) => {
  const url = `https://discord.com/api/webhooks/${webhook.id}/${webhook.token}?wait=true`

  if (payload.type !== 'payment_intent.succeeded') return
  const data = payload.data.object as Stripe.PaymentIntent

  const embed = new EmbedBuilder()
    .setColor('#4752b2')
    .setTitle('Payment succeeded')
    .addFields(
      { name: 'Amount', value: `${data.amount}` },
      {
        name: 'Email',
        value: `${data.receipt_email}`
      }
    )
    .setTimestamp(moment(payload.created).toDate())
    .setFooter({
      text: `Stripe App • ${payload.type}`,
      iconURL:
        'https://pbs.twimg.com/profile_images/1503494829094756357/ihaECs5p_400x400.jpg'
    })

  const request = await exec(url, embed)

  if (request.status !== 200) {
    throw new Error(`Could not send message to discord. \`${request.status}\``)
  }

  const response = await request.json()

  return {
    url,
    response,
    status: request.status
  }
}
