export const metadata = {
  title: 'NOVA | Stream what moves you',
  description: 'A microservices-ready streaming experience for the DevOps bootcamp.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
