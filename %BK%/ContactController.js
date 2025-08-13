const Contact = require('../models/Contact');

// Create a new contact message
exports.createContact = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, subject, message, priority, category } = req.body;

    const newContact = new Contact({
      firstName,
      lastName,
      email,
      phone,
      subject,
      message,
      priority,
      category,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    await newContact.save();

    return res.status(201).json({ message: 'Contact message sent successfully!', data: newContact });
  } catch (error) {
    console.error('Error creating contact:', error);
    return res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};

// Get a list of contact messages
exports.getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    return res.status(200).json({ data: contacts });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    return res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
};
