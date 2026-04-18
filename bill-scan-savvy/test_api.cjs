async function testApi() {
  try {
    const imgRes = await fetch('https://upload.wikimedia.org/wikipedia/commons/1/15/Cat_August_2010-4.jpg');
    const blob = await imgRes.blob();

    const form = new FormData();
    form.append('image', blob, 'cat.jpg');
    
    console.log("sending image...");
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
