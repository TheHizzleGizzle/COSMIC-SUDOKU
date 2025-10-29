import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Rocket } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="cosmic-bg min-h-screen flex items-center justify-center p-4">
      <Card className="cosmic-tile border-0 max-w-lg w-full">
        <CardContent className="p-8 text-center">
          <div className="text-8xl mb-6 animate-float">🌌</div>
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <p className="text-2xl text-white/90 mb-2">Lost in Space!</p>
          <p className="text-lg text-white/60 mb-8">
            This cosmic coordinate doesn't exist in our universe.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button
                size="lg"
                className="cosmic-tile w-full sm:w-auto"
                style={{
                  backgroundColor: '#00f5ff20',
                  borderColor: '#00f5ff',
                  color: '#00f5ff'
                }}
              >
                <Home className="h-5 w-5 mr-2" />
                Return Home
              </Button>
            </Link>
            <Link to="/">
              <Button
                size="lg"
                variant="ghost"
                className="cosmic-tile w-full sm:w-auto text-white"
              >
                <Rocket className="h-5 w-5 mr-2" />
                Start Playing
              </Button>
            </Link>
          </div>
          <div className="mt-8 text-sm text-white/40">
            Route: <code className="text-white/60">{location.pathname}</code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
