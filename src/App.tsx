import { Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import Navigation from './components/Navigation'
import Footer from './components/Footer'
import Home from './pages/Home'
import Produkty from './pages/Produkty'
import Regulamin from './pages/Regulamin'
import ONas from './pages/ONas'
import Admin from './pages/Admin'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentFailure from './pages/PaymentFailure'
import './App.css'

function App() {
  return (
    <CartProvider>
      <div className="app">
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/produkty" element={<Produkty />} />
            <Route path="/o-nas" element={<ONas />} />
            <Route path="/regulamin" element={<Regulamin />} />
            <Route path="/admin/*" element={<Admin />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/failure" element={<PaymentFailure />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </CartProvider>
  )
}

export default App
