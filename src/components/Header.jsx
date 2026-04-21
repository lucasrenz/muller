
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, LayoutDashboard, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  // Primary brand color
  const primaryColor = '#c53d2a';

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center group">
            <img 
              src="https://i.ibb.co/yBW1kQcb/clube-png.png" 
              alt="Clube Mais Vantagens" 
              className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </Link>

          <nav className="flex items-center gap-2">
            {!currentUser && (
               <Link to="/login">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={cn(
                    "rounded-xl transition-all duration-300 w-11 h-11",
                    "hover:bg-[#c53d2a]/10 hover:text-[#c53d2a] text-gray-600",
                    isActive('/login') && "text-[#c53d2a] bg-[#c53d2a]/10"
                  )}
                  title="Acesso Operador"
                >
                  <User className="w-5 h-5" />
                </Button>
              </Link>
            )}

            {currentUser && (
              <>
                <Link to="/operator-dashboard">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className={cn(
                      "rounded-xl transition-all duration-300 w-11 h-11",
                      "hover:bg-[#c53d2a]/10 hover:text-[#c53d2a] text-gray-600",
                       isActive('/operator-dashboard') && "text-[#c53d2a] bg-[#c53d2a]/10"
                    )}
                    title="Painel"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                  </Button>
                </Link>

                <Link to="/config">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className={cn(
                      "rounded-xl transition-all duration-300 w-11 h-11",
                      "hover:bg-[#c53d2a]/10 hover:text-[#c53d2a] text-gray-600",
                       isActive('/config') && "text-[#c53d2a] bg-[#c53d2a]/10"
                    )}
                    title="Configurações"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                </Link>

                <div className="h-6 w-px bg-gray-200 mx-2" />

                <Button
                  onClick={handleLogout}
                  size="icon"
                  className="text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-none w-11 h-11"
                  style={{ backgroundColor: primaryColor }}
                  title="Sair"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
