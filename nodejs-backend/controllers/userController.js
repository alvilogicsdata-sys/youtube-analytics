const db = require('../config/database');
const redisClient = require('../config/redis');

// Get all users
const getAllUsers = async (req, res, next) => {
  try {
    // Check if users are cached in Redis
    const cachedUsers = await redisClient.get('users:all');
    if (cachedUsers) {
      return res.json({ users: JSON.parse(cachedUsers) });
    }

    // Fetch from database
    const result = await db.query('SELECT id, name, email FROM users');
    const users = result.rows;

    // Cache users in Redis
    await redisClient.setex('users:all', 300, JSON.stringify(users)); // 5 minutes cache

    res.json({ users });
  } catch (error) {
    next(error);
  }
};

// Get user by ID
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user is cached in Redis
    const cachedUser = await redisClient.get(`user:${id}`);
    if (cachedUser) {
      return res.json({ user: JSON.parse(cachedUser) });
    }

    // Fetch from database
    const result = await db.query('SELECT id, name, email FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    // Cache user in Redis
    await redisClient.setex(`user:${id}`, 3600, JSON.stringify(user)); // 1 hour cache

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// Update user by ID
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    // Update in database
    const result = await db.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email',
      [name, email, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedUser = result.rows[0];

    // Remove user from cache so it gets re-fetched
    await redisClient.del(`user:${id}`);
    await redisClient.del('users:all'); // Invalidate users list cache

    res.json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    next(error);
  }
};

// Delete user by ID
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Delete from database
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove user from cache
    await redisClient.del(`user:${id}`);
    await redisClient.del('users:all'); // Invalidate users list cache

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};