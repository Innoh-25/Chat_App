import Message from '../models/Message.js';
import Room from '../models/Room.js';

export const getRoomMessages = async (req, res) => {
  try {
    const { room } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify room exists
    const roomExists = await Room.findOne({ name: room });
    if (!roomExists) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const messages = await Message.find({ room })
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Message.countDocuments({ room });

    res.json({
      messages: messages.reverse(), // Return in chronological order
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error fetching messages: ' + error.message
    });
  }
};

export const createMessage = async (req, res) => {
  try {
    const { content, room, type = 'message', receiver } = req.body;

    const message = await Message.create({
      content,
      sender: req.user._id,
      room,
      type,
      receiver: type === 'private' ? receiver : undefined
    });

    await message.populate('sender', 'username avatar');

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({
      error: 'Error creating message: ' + error.message
    });
  }
};

export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Find existing reaction or create new one
    let reaction = message.reactions.find(r => r.emoji === emoji);
    if (reaction) {
      if (!reaction.users.includes(req.user._id)) {
        reaction.users.push(req.user._id);
      }
    } else {
      message.reactions.push({
        emoji,
        users: [req.user._id]
      });
    }

    await message.save();
    await message.populate('reactions.users', 'username');

    res.json(message);
  } catch (error) {
    res.status(500).json({
      error: 'Error adding reaction: ' + error.message
    });
  }
};