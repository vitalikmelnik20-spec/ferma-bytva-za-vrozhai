module.exports = (req, res, next) => {
  if (!req.session.playerId) {
    return res.status(401).json({ error: 'Не авторизований' });
  }
  next();
};
