import React from 'react';
import './globals.css';
import { AudioProvider } from '@/contexts/AudioContext';

export const metadata = {
  title: 'Piano Virtual',
  description: 'Un piano virtual interactivo creado con Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="antialiased">
        <AudioProvider>
          {children}
        </AudioProvider>
      </body>
    </html>
  )
}
