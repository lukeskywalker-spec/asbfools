import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function StudentRegistrationForm() {
  const [studentId, setStudentId] = useState('')
  const [teacher, setTeacher] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Implement your form submission logic here
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <h2 className="text-2xl font-bold text-center text-green-700">Thank You! You've been entered into the giveaway</h2>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center text-green-700">Student Registration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="studentId">Student ID:</Label>
            <Input
              id="studentId"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              pattern="[0-9]{7}"
              required
            />
            <p className="text-sm text-gray-500">Please enter your 7-digit Student ID</p>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacher">Eagle Time Teacher:</Label>
            <Select value={teacher} onValueChange={setTeacher}>
              <SelectTrigger>
                <SelectValue placeholder="Select a teacher" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="V. Blackburn">V. Blackburn</SelectItem>
                <SelectItem value="B. Berton">B. Berton</SelectItem>
                <SelectItem value="D. Compton">D. Compton</SelectItem>
                {/* Add more teachers here */}
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-green-700 hover:bg-green-800 text-white"
            disabled={!studentId || !teacher}
          >
            Submit
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}