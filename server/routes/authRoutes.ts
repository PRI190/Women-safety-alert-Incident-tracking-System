import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, DBUser } from '../db';
import { authenticateToken, generateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields (name, email, phone, password) are required.' });
    }

    const users = db.get('users');
    const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      return res.status(400).json({ error: 'Email address is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser: DBUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      passwordHash,
      role: 'user',
      createdAt: new Date().toISOString(),
      emergencyContacts: []
    };

    users.push(newUser);
    db.set('users', users);

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name
    });

    const { passwordHash: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: userWithoutPassword
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// POST /api/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const users = db.get('users');
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    return res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Login failed' });
  }
});

// GET /api/profile
router.get('/profile', authenticateToken, (req: AuthRequest, res: Response) => {
  const users = db.get('users');
  const user = users.find((u) => u.id === req.user?.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { passwordHash: _, ...userWithoutPassword } = user;
  return res.json(userWithoutPassword);
});

// PUT /api/profile
router.put('/profile', authenticateToken, (req: AuthRequest, res: Response) => {
  const { name, phone } = req.body;
  const users = db.get('users');
  const userIndex = users.findIndex((u) => u.id === req.user?.id);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (name) users[userIndex].name = name.trim();
  if (phone) users[userIndex].phone = phone.trim();

  db.set('users', users);

  const { passwordHash: _, ...updatedUser } = users[userIndex];
  return res.json({ message: 'Profile updated successfully', user: updatedUser });
});

// PUT /api/change-password
router.put('/change-password', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const users = db.get('users');
  const user = users.find((u) => u.id === req.user?.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  db.set('users', users);

  return res.json({ message: 'Password changed successfully' });
});

// POST /api/emergency-contacts
router.post('/emergency-contacts', authenticateToken, (req: AuthRequest, res: Response) => {
  const { name, relationship, phone, isPrimary } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required.' });
  }

  const users = db.get('users');
  const user = users.find((u) => u.id === req.user?.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!user.emergencyContacts) user.emergencyContacts = [];

  const newContact = {
    id: `ec-${Date.now()}`,
    name: name.trim(),
    relationship: relationship ? relationship.trim() : 'Family',
    phone: phone.trim(),
    isPrimary: !!isPrimary
  };

  if (isPrimary) {
    user.emergencyContacts.forEach((c) => (c.isPrimary = false));
  }

  user.emergencyContacts.push(newContact);
  db.set('users', users);

  return res.status(201).json({ message: 'Emergency contact added', contacts: user.emergencyContacts });
});

// DELETE /api/emergency-contacts/:id
router.delete('/emergency-contacts/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const users = db.get('users');
  const user = users.find((u) => u.id === req.user?.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.emergencyContacts = (user.emergencyContacts || []).filter((c) => c.id !== id);
  db.set('users', users);

  return res.json({ message: 'Contact removed', contacts: user.emergencyContacts });
});

export default router;
