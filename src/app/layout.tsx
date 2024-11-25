import React from 'react';
import './globals.css';

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
        {children}
      </body>
    </html>
  )
}
