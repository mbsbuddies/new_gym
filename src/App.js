import logo from './logo.svg';
import './App.css';
import React, { useState, useEffect } from "react";
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: -34.9285,
  lng: 138.6007,
};

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const gymNames = ["FitHub", "IronWorks Gym", "Pulse Fitness", "Peak Performance", "Flex Gym"];
const gymAddress = ["8 Regency Rd.", "76 Kookaburra Ave.", "3 Victoria Rd.", "81 Flinders St.", "2 Burnside St."];
const gymTrainer = ["Mark Damien", "Ali Hyder", "Sarah Webber", "Rakesh Singh", "Maria Tripodi"];

export default function App() {
  const [locations, setLocations] = useState({});
  const [residence, setResidence] = useState("");
  const [gymTimes, setGymTimes] = useState({});
  const [directions, setDirections] = useState([]);
  const [gymMarkers, setGymMarkers] = useState([]);
  const [error, setError] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [apiKeyError, setApiKeyError] = useState(false);
  
  // Get API key from environment variables
  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    // Check if API key is available
    if (!GOOGLE_MAPS_API_KEY) {
      setApiKeyError(true);
      setError("Google Maps API key is not configured. Please check your environment variables.");
    }
  }, []);

  const handleLocationChange = (day, value) => {
    setLocations({ ...locations, [day]: value });
  };

  const handleGymTimeChange = (day, value) => {
    setGymTimes({ ...gymTimes, [day]: value });
  };

  const handleMapLoad = () => {
    setMapLoaded(true);
  };

  const calculateRoutes = async () => {
    if (!mapLoaded) {
      setError("Google Maps is not loaded yet. Please wait.");
      return;
    }

    if (apiKeyError) {
      setError("Cannot calculate routes: Google Maps API key is not configured.");
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();
    const newDirections = [];
    const newGymMarkers = [];
    for (const day of daysOfWeek) {
      if (!locations[day]?.trim() || !residence?.trim()) continue;

      try {
        const result = await new Promise((resolve, reject) => {
          directionsService.route(
            {
              origin: residence,
              destination: locations[day],
              travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
              if (status === "OK") {
                resolve(result);
              } else {
                reject(new Error(`Directions request failed: ${status}`));
              }
            }
          );
        });

        newDirections.push(result);

        if (result.routes[0]?.legs[0]?.steps.length > 0) {
          const steps = result.routes[0].legs[0].steps;
          const randomStep = steps[Math.floor(Math.random() * steps.length)];
          const gymIndex = newGymMarkers.length;
          
          newGymMarkers.push({
            position: randomStep.end_location,
            name: gymNames[gymIndex % gymNames.length],
            day: day,
            address: gymAddress[gymIndex % gymAddress.length],
            trainer: gymTrainer[gymIndex % gymTrainer.length],
            time: gymTimes[day] || "Not Set",
          });
        }
      } catch (err) {
        console.error(`Error calculating route for ${day}:`, err);
        setError(`Could not calculate route for ${day}`);
      }
    }

    setDirections(newDirections);
    setGymMarkers(newGymMarkers);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {apiKeyError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            Google Maps API key is not configured. Please add your API key to the environment variables.
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Gym Schedule Planner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Residence Location</label>
            <Input
              type="text"
              placeholder="Enter your home address"
              value={residence}
              onChange={(e) => setResidence(e.target.value)}
              className="mb-4"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {daysOfWeek.map((day) => (
          <Card key={day}>
            <CardHeader>
              <CardTitle className="text-lg">{day}</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="text"
                placeholder="Workplace location"
                value={locations[day] || ""}
                onChange={(e) => handleLocationChange(day, e.target.value)}
                className="mb-2"
              />
              <Input
                type="time"
                value={gymTimes[day] || ""}
                onChange={(e) => handleGymTimeChange(day, e.target.value)}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <Button 
        onClick={calculateRoutes}
        className="w-full mb-6"
        disabled={apiKeyError}
      >
        Calculate Routes and Find Gyms
      </Button>

      {error && !apiKeyError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!apiKeyError && (
        <Card className="mb-6">
          <CardContent className="p-0">
            <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} onLoad={handleMapLoad}>
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={defaultCenter}
                zoom={10}
              >
                {directions.map((direction, index) => (
                  <DirectionsRenderer
                    key={`direction-${index}`}
                    directions={direction}
                    options={{
                      suppressMarkers: true,
                      polylineOptions: {
                        strokeColor: `hsl(${(index * 137) % 360}, 70%, 50%)`,
                      },
                    }}
                  />
                ))}
                {gymMarkers.map((gym, index) => (
                  <Marker
                    key={`gym-${index}`}
                    position={gym.position}
                    title={gym.name}
                  />
                ))}
              </GoogleMap>
            </LoadScript>
          </CardContent>
        </Card>
      )}

      {gymMarkers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Suggested Gyms on Your Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 bg-gray-100">Day</th>
                    <th className="border p-2 bg-gray-100">Gym</th>
                    <th className="border p-2 bg-gray-100">Address</th>
                    <th className="border p-2 bg-gray-100">Trainer</th>
                    <th className="border p-2 bg-gray-100">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {gymMarkers.map((gym, index) => (
                    <tr key={index}>
                      <td className="border p-2">{gym.day}</td>
                      <td className="border p-2">{gym.name}</td>
                      <td className="border p-2">{gym.address}</td>
                      <td className="border p-2">{gym.trainer}</td>
                      <td className="border p-2">{gym.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


/*function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;*/
