async function checkConsole() {
  try {
    const res = await fetch('http://localhost:8000/portal/staff/a2d94d0f-f6a0-4e2e-be30-49def46bf0ba/dashboard'); // driver1
    const data = await res.json();
    console.log(JSON.stringify(data.widgets.transportTripWidget, null, 2));
  } catch (err) {
    console.log(err.message);
  }
}

checkConsole();
