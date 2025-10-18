import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en" className="dark">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@700&family=Inter:wght@400;600&display=swap" rel="stylesheet" />
      </Head>
      <body className="text-neutral-50">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
