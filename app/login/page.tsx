import LoginForm from '@/components/LoginForm'

export const metadata = {
  title: 'Login - Webhook Alert Demo'
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <LoginForm />
    </main>
  )
}