async function test() {
  for(let i=1; i<=12; i++) {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'wrong' })
    });
    console.log(`Request ${i}: Status ${res.status}`);
    if (res.status === 429) {
      const data = await res.json();
      console.log('Response:', data);
      break;
    }
  }
}
test();
