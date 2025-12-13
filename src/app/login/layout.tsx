import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In - TradeMind',
  description: 'Sign in to your TradeMind trading journal',
}

/**
 * Login page layout - no navigation
 * This layout is used only for the /login route
 */
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
