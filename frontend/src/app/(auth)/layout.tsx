import AuthNav from '@/components/AuthNav'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <AuthNav />
      {children}
    </div>
  )
} 