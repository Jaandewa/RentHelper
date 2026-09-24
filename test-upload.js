const fs = require('fs');

async function testUpload() {
  const fileContent = Buffer.from('hello world');
  const formData = new FormData();
  formData.append('images', new Blob([fileContent], { type: 'image/jpeg' }), 'test.jpg');

  try {
    const res = await fetch('https://uploads.healingcity.lk/index.php', {
      method: 'POST',
      body: formData
    });
    console.log('Status:', res.status);
    console.log('Text:', await res.text());
  } catch(e) {
    console.error('Fetch error:', e);
  }
}

testUpload();
