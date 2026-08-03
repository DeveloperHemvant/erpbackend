async function testEndTrip() {
  try {
    const res = await fetch('http://localhost:8000/transport/trips/undefined', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: "Completed"
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

testEndTrip();
