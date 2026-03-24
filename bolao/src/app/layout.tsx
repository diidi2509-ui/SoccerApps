import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bolão Amigos | Palpites de futebol com sua turma',
  description: 'Crie seu bolão de futebol, chame os amigos pelo WhatsApp e dispute o ranking. Grátis para começar!',
  openGraph: {
    title: 'Bolão Amigos',
    description: 'Palpites de futebol com sua turma',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
