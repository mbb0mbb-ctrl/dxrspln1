import React from 'react'
import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="w-20 bg-white border-r border-borderGray flex flex-col items-center py-6 shadow-soft">
      <h1 className="text-primary font-bold text-xl mb-10 rotate-[-10deg] select-none cursor-default">Plan</h1>
      <Link
        to="/"
        className="mb-6 p-2 rounded hover:bg-primary hover:text-white transition-colors"
        title="Günlük Plan"
      >
        🗓️
      </Link>
      {/* Buraya diğer menü ikonları eklenebilir */}
    </nav>
  )
}
