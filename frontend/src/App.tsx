import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PlusCircle, BookOpen, Search, LogOut, User } from 'lucide-react'
import { useAuth } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } />
            <Route path="/write" element={
              <ProtectedRoute>
                <WritePage />
              </ProtectedRoute>
            } />
            <Route path="/entries" element={
              <ProtectedRoute>
                <EntriesPage />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header with user info */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold mb-2">ShadowLog</h1>
            <p className="text-muted-foreground text-lg">
              Welcome back, {user?.name || user?.email}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              {user?.email}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={logout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                New Entry
              </CardTitle>
              <CardDescription>
                Write a new diary entry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Start Writing</Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                My Entries
              </CardTitle>
              <CardDescription>
                View and manage your diary entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">View Entries</Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Quick Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search your entries..."
                className="flex-1 px-3 py-2 border border-input rounded-md bg-background"
              />
              <Button>Search</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function WritePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">New Entry</h1>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <input
                  type="text"
                  placeholder="Entry title..."
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Content</label>
                <textarea
                  placeholder="Write your thoughts..."
                  rows={10}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button>Save Entry</Button>
                <Button variant="outline">Cancel</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function EntriesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">My Entries</h1>
        <div className="space-y-4">
          {/* Placeholder entries */}
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle>Sample Entry {i}</CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This is a sample diary entry. In a real application, this would show the actual content...
                </p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm">Edit</Button>
                  <Button size="sm" variant="outline">Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default App
