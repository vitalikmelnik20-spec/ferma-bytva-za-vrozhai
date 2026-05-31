const { pool } = require('../db');

module.exports = async (req, res, next) => {
  if (!req.session.playerId) {
    return res.status(401).json({ error: 'Не авторизований' });
  }
  try {
    const { rows } = await pool.query('SELECT is_admin FROM players WHERE id = $1', [req.session.playerId]);
    if (!rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Доступ заборонено' });
    }
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Помилка сервера' });
  }
};
