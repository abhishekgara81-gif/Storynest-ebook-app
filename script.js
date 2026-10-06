document.addEventListener('DOMContentLoaded', () => {
  const subscribeForm = document.getElementById('subscribe-form');
  const contactForm = document.getElementById('contact-form');

  if (subscribeForm) {
    subscribeForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const emailInput = document.getElementById('email');
      const messageBox = document.getElementById('subscribe-message');
      const email = emailInput.value.trim();

      if (!email) {
        setMessage(messageBox, 'Please enter a valid email address.', 'error');
        return;
      }

      try {
        const response = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
          setMessage(messageBox, data.message || 'Could not subscribe.', 'error');
          return;
        }

        setMessage(messageBox, data.message || 'Success!', 'success');
        emailInput.value = '';

        if (data.downloadUrl) {
          window.location.href = data.downloadUrl;
        }
      } catch (error) {
        console.error('Subscription submission failed:', error);
        setMessage(messageBox, 'Something went wrong. Please try again.', 'error');
      }
    });
  }

  if (contactForm) {
    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(contactForm);
      const payload = {
        name: String(formData.get('name') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        message: String(formData.get('message') || '').trim(),
      };

      const messageBox = document.getElementById('contact-message');

      if (!payload.name || !payload.email || !payload.message) {
        setMessage(messageBox, 'Please fill in all fields.', 'error');
        return;
      }

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          setMessage(messageBox, data.message || 'Could not send message.', 'error');
          return;
        }

        setMessage(messageBox, data.message || 'Message sent!', 'success');
        contactForm.reset();
      } catch (error) {
        console.error('Contact form submission failed:', error);
        setMessage(messageBox, 'Something went wrong. Please try again.', 'error');
      }
    });
  }

  const subscribersTable = document.getElementById('subscribersTable');
  const messagesTable = document.getElementById('messagesTable');

  if (subscribersTable) {
    loadTable('/api/subscribers', subscribersTable, (row) => `
      <tr>
        <td>${row.id}</td>
        <td>${row.email}</td>
        <td>${new Date(row.created_at).toLocaleString()}</td>
      </tr>
    `);
  }

  if (messagesTable) {
    loadTable('/api/contact-messages', messagesTable, (row) => `
      <tr>
        <td>${row.name}</td>
        <td>${row.email}</td>
        <td>${row.message}</td>
        <td>${new Date(row.created_at).toLocaleString()}</td>
      </tr>
    `);
  }
});

async function loadTable(url, tableElement, rowTemplate) {
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      tableElement.innerHTML = `<tr><td colspan="3">${data.message || 'Unable to load data.'}</td></tr>`;
      return;
    }

    if (!data.length) {
      tableElement.innerHTML = '<tr><td colspan="3">No records available yet.</td></tr>';
      return;
    }

    tableElement.innerHTML = data.map(rowTemplate).join('');
  } catch (error) {
    console.error(`Failed to load ${url}:`, error);
    tableElement.innerHTML = '<tr><td colspan="3">Failed to load records.</td></tr>';
  }
}

function setMessage(element, message, type) {
  if (!element) return;

  element.textContent = message;
  element.classList.remove('success', 'error');
  element.classList.add(type);
}
