async function testStartTrip() {
  try {
    const res = await fetch('http://localhost:8000/transport/trips', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        routeId: "b19154aa-49cc-412f-abfd-8b1d3c117f64", 
        vehicleId: "da02820a-91ab-43ea-984b-10b857755c42", 
        tripType: "Morning",
        status: "In Progress",
        date: "2026-07-31"
      })
    });
    
    if (res.ok) {
        console.log("Success:", await res.json());
    } else {
        console.log("Error status:", res.status);
        console.log("Error data:", await res.text());
    }
  } catch (err) {
    console.log("Error:", err.message);
  }
}

testStartTrip();
