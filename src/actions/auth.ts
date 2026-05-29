'use server'

import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  // Mock authentication logic
  if (username !== 'admin' || password !== 'password') {
    return { error: 'Invalid username or password' }
  }

  // Securely call the n8n webhook from the server
  try {
    const webhookUrl = 'https://vtnv.app.n8n.cloud/webhook-test/login-alert'
    
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        time: new Date().toISOString(),
        status: 'success',
      }),
    })
  } catch (error) {
    // Log the error securely on the server without failing the login process
    console.error('Failed to trigger n8n login alert webhook:', error)
  }

  // Redirect on success
  redirect('/dashboard')
}
