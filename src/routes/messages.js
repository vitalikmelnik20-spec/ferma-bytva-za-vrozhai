const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const { pool } = require('../db');

router.use(requireAuth);

// GET /api/messages/conversations
router.get('/conversations', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id,
              CASE WHEN c.player1_id=$1 THEN c.player2_id ELSE c.player1_id END AS other_id,
              p.username AS other_name, p.faction AS other_faction,
              p.is_online AS other_online, p.last_seen AS other_last_seen,
              c.last_message_at,
              (SELECT content FROM messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
              (SELECT COUNT(*) FROM messages
               WHERE conversation_id=c.id AND sender_id<>$1 AND is_read=false)::int AS unread_count
       FROM conversations c
       JOIN players p ON p.id = CASE WHEN c.player1_id=$1 THEN c.player2_id ELSE c.player1_id END
       WHERE c.player1_id=$1 OR c.player2_id=$1
       ORDER BY c.last_message_at DESC NULLS LAST`,
      [req.session.playerId]
    );
    res.json({ conversations: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// GET /api/messages/:playerId — messages with specific player
router.get('/:playerId', async (req, res) => {
  const otherId = parseInt(req.params.playerId);
  const myId = req.session.playerId;
  try {
    const { rows: [conv] } = await pool.query(
      `SELECT * FROM conversations
       WHERE (player1_id=$1 AND player2_id=$2) OR (player1_id=$2 AND player2_id=$1)`,
      [myId, otherId]
    );
    if (!conv) return res.json({ messages: [], conversationId: null });

    const { rows: messages } = await pool.query(
      `SELECT id, sender_id, content, is_read, created_at
       FROM messages WHERE conversation_id=$1
       ORDER BY created_at DESC LIMIT 200`,
      [conv.id]
    );

    const { rows: [other] } = await pool.query(
      'SELECT id, username, faction, is_online, last_seen FROM players WHERE id=$1', [otherId]
    );

    res.json({ messages: messages.reverse(), conversationId: conv.id, other });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// POST /api/messages/:playerId — send message
router.post('/:playerId', async (req, res) => {
  const otherId = parseInt(req.params.playerId);
  const myId = req.session.playerId;
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Порожнє повідомлення' });
  if (content.length > 500) return res.status(400).json({ error: 'Максимум 500 символів' });
  if (otherId === myId) return res.status(400).json({ error: 'Не можна писати собі' });

  try {
    let { rows: [conv] } = await pool.query(
      `SELECT * FROM conversations
       WHERE (player1_id=$1 AND player2_id=$2) OR (player1_id=$2 AND player2_id=$1)`,
      [myId, otherId]
    );
    if (!conv) {
      const { rows: [newConv] } = await pool.query(
        `INSERT INTO conversations (player1_id, player2_id, last_message_at) VALUES ($1,$2,NOW()) RETURNING *`,
        [myId, otherId]
      );
      conv = newConv;
    }

    const { rows: [msg] } = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1,$2,$3) RETURNING *`,
      [conv.id, myId, content.trim()]
    );

    await pool.query(`UPDATE conversations SET last_message_at=NOW() WHERE id=$1`, [conv.id]);

    // Enforce 200-message limit per conversation
    await pool.query(
      `DELETE FROM messages WHERE conversation_id=$1 AND id NOT IN (
         SELECT id FROM messages WHERE conversation_id=$1 ORDER BY created_at DESC LIMIT 200
       )`, [conv.id]
    );

    const io = req.app.locals.io;
    if (io) {
      const { rows: [sender] } = await pool.query(
        'SELECT username, faction FROM players WHERE id=$1', [myId]
      );
      io.to(`player:${otherId}`).emit('message:new', {
        conversationId: conv.id,
        message: msg,
        senderName: sender.username,
        senderFaction: sender.faction,
        senderId: myId,
      });
    }

    res.json({ message: msg, conversationId: conv.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// PUT /api/messages/:convId/read — mark messages as read
router.put('/:convId/read', async (req, res) => {
  try {
    await pool.query(
      `UPDATE messages SET is_read=true
       WHERE conversation_id=$1 AND sender_id<>$2 AND is_read=false`,
      [req.params.convId, req.session.playerId]
    );

    const { rows: [conv] } = await pool.query(
      'SELECT player1_id, player2_id FROM conversations WHERE id=$1', [req.params.convId]
    );
    if (conv) {
      const senderId = conv.player1_id === req.session.playerId ? conv.player2_id : conv.player1_id;
      const io = req.app.locals.io;
      if (io) io.to(`player:${senderId}`).emit('message:read', { conversationId: parseInt(req.params.convId) });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

// DELETE /api/messages/:convId — delete conversation
router.delete('/:convId', async (req, res) => {
  try {
    const { rows: [conv] } = await pool.query(
      'SELECT * FROM conversations WHERE id=$1', [req.params.convId]
    );
    if (!conv) return res.status(404).json({ error: 'Діалог не знайдено' });
    if (conv.player1_id !== req.session.playerId && conv.player2_id !== req.session.playerId)
      return res.status(403).json({ error: 'Немає доступу' });

    await pool.query('DELETE FROM conversations WHERE id=$1', [req.params.convId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

module.exports = router;
