// DEFINE THE STRUCTURAL INTERFACE FOR YOUR TRIP LOCATION DATA PARAMETERS
export interface ILocation {
  _id: string;
  type: string;
  coordinates: [number, number]; // Strictly typed tuple: [longitude, latitude]
  address: string;
  description: string;
  day: number;
}

/**
 * Initializes and displays the interactive Mapbox routing grid on the trip detail page
 * @param locations Array of populated Trip location data points
 * @param token The backend-provided Mapbox application access token string
 */
export const displayMap = (locations: ILocation[], token: string): void => {
  // Access declared global CDN library Object safely via the window layer
  const mapboxgl = (window as any).mapboxgl;

  // Guard clause against CDN network dropping or script block timeouts
  if (!mapboxgl) {
    console.error(
      "💥 Critical Error: Mapbox GL JS library failed to load from CDN!",
    );
    return;
  }

  // Inject your secure environment access token key variable
  mapboxgl.accessToken = token;

  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/nwankwo-michael/cmp39ccy7002601sc6arm5g9u", // Your custom map style skin
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create custom marker DOM element container
    const el = document.createElement("div");
    el.className = "marker"; // Hooks directly into your brand-new custom pin template styles!

    el.style.width = "70px";
    el.style.height = "70px";

    // Add your customized pin marker onto the canvas coordinate layer
    new mapboxgl.Marker({
      element: el,
      anchor: "bottom", // Ensures the sharp point of your compass icon tip aligns with coordinates
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add a premium context popup box overlay above the pin point marker on click/hover
    new mapboxgl.Popup({
      offset: 30,
      focusAfterOpen: false,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend the tracking boundaries matrix array to capture this coordinate point
    bounds.extend(loc.coordinates);
  });

  // Execute smooth automatic framing animation logic to fit all stops onto user browser screens
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 200,
      left: 100,
      right: 100,
    },
  });
};
