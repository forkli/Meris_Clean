export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { status, conversationId } = req.body;

  if (status === 'success') {
    res.redirect(302, '/tesekkurler.html?order=' + conversationId);
  } else {
    res.redirect(302, '/?odeme=hata');
  }
}
