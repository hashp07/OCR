const fs = require('fs');

async function testApi() {
  const form = new FormData();
  form.append('image', new Blob(['fake image content']), 'test.jpg');
  try {
    const res = await fetch('https://jyotiradityachavan-document-ai-qwen-vl-2.hf.space/bill', {
      method: 'POST',
      body: form
    });
    console.log(res.status, res.statusText);
    const text = await res.text();
    console.log("Response text:", text);
  } catch (e) {
    console.error("error:", e);
  }
}
testApi();
