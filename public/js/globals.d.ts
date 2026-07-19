// ambient typing mapping hook shared across all client-side files out-of-the-box
interface Window {
  mapboxgl: any;
  Stripe: (publicKey: string) => any;
}
