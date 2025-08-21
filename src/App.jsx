import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import FlightSearchMap from './components/FlightSearchMap'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     <FlightSearchMap />
    </>
  )
}

export default App
