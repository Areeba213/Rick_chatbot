import Head from 'next/head'
import RickChatbot from '../components/RickChatbot'
import ArtScanner from '../components/ArtScanner'
import { useState } from 'react'

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false)

  return (
    <>
      <Head>
        <title>Rick Sanchez AI Chatbot</title>
        <meta name="description" content="Talk to Rick from Rick and Morty!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      {authenticated ? (
        <RickChatbot />
      ) : (
        <ArtScanner onAuthenticated={() => setAuthenticated(true)} />
      )}
    </>
  )
}
