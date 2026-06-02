// pages/register.tsx
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Register() {
  const router = useRouter()
  useEffect(() => {
    router.push('/')
  }, [])
  return null
}