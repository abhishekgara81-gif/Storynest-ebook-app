const express = require('express');
const fs = require('fs');
const path = require('path');
const {
  initializeDatabase,
  findSubscriberByEmail,
  addSubscriber,
  getSubscribers,
  addContactMessage,
  getContactMessages,
} = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const publicDir = __dirname;
const ebookPath = path.join(__dirname, 'ebook-guide.txt');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the landing page and admin dashboard.
app.use(express.static(publicDir));

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(publicDir, 'admin.html'));
});

app.get('/download', (req, res) => {
  if (!fs.existsSync(ebookPath)) {
    return res.status(404).json({ message: 'E-book not found.' });
  }

  res.download(ebookPath, 'ebook-guide.txt');
});

app.post('/api/subscribe', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  try {
    const existing = await findSubscriberByEmail(email);

    if (existing) {
      return res.status(409).json({
        message: 'This email is already subscribed.',
        downloadUrl: '/download',
      });
    }

    await addSubscriber(email);

    return res.status(201).json({
      success: true,
      message: 'Success! Your free e-book is ready to download.',
      downloadUrl: '/download',
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    return res.status(500).json({ message: 'Could not save your subscription.' });
  }
});

app.post('/api/contact', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim();
  const message = String(req.body.message || '').trim();

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Please fill in all fields.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  try {
    await addContactMessage({ name, email, message });

    return res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully.',
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ message: 'Could not send your message.' });
  }
});

app.get('/api/subscribers', async (req, res) => {
  try {
    const subscribers = await getSubscribers();
    res.json(subscribers);
  } catch (error) {
    console.error('Subscribers fetch error:', error);
    res.status(500).json({ message: 'Could not load subscribers.' });
  }
});

app.get('/api/contact-messages', async (req, res) => {
  try {
    const messages = await getContactMessages();
    res.json(messages);
  } catch (error) {
    console.error('Contact messages fetch error:', error);
    res.status(500).json({ message: 'Could not load contact messages.' });
  }
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`E-book app running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  });
