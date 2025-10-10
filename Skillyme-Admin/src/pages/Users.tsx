import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/DashboardLayout"

export default function Users() {
  const [message, setMessage] = useState("Loading...")

  useEffect(() => {
    console.log('🚀 MINIMAL Users component loaded successfully!')
    setMessage("Users page is working! This is the minimal version.")
  }, [])

  return (
    <DashboardLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Users - MINIMAL TEST</h1>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {message}
        </div>
        <div className="mt-4 text-sm text-gray-600">
          If you see this message, the component is working. 
          Check the browser console for the success log.
        </div>
      </div>
    </DashboardLayout>
  )
}