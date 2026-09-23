import { ChatModel } from '../models/chatModel.js';
import { UserModel } from '../models/userModel.js';
import { NotificationModel } from '../models/notificationModel.js';
import { getIO } from '../config/socket.js';

const userId = (req) => req.user.id || req.user.userId;
const ensureChatParticipant = async (req, res) => {
  const sender = await UserModel.findById(userId(req));
  const recipient = await UserModel.findById(req.params.playerId);
  if (!sender || !recipient || sender.id === recipient.id) {
    res.status(403).json({ success: false, message: 'Direct chat is available only between two different registered accounts.' });
    return null;
  }
  return { sender, recipient };
};

export const getChatPlayers = async (req, res) => {
  try {
    return res.json({ success: true, players: await ChatModel.getPlayers(userId(req)) });
  } catch (error) { console.error('Get chat players error:', error); return res.status(500).json({ success: false, message: 'Unable to load players' }); }
};

export const getMessages = async (req, res) => {
  try {
    if (!await ensureChatParticipant(req, res)) return;
    await ChatModel.markRead({ userId: userId(req), peerId: req.params.playerId });
    return res.json({ success: true, messages: await ChatModel.getMessages({ userId: userId(req), peerId: req.params.playerId }) });
  } catch (error) { console.error('Get messages error:', error); return res.status(500).json({ success: false, message: 'Unable to load messages' }); }
};

export const sendMessage = async (req, res) => {
  try {
    const participants = await ensureChatParticipant(req, res);
    if (!participants) return;
    const { sender, recipient } = participants;
    const body = typeof req.body.body === 'string' ? req.body.body.trim() : '';
    if (!body || body.length > 1000) return res.status(400).json({ success: false, message: 'Message must be between 1 and 1,000 characters.' });

    const message = await ChatModel.send({ senderId: sender.id, recipientId: recipient.id, body });
    const enrichedMessage = {
      ...message,
      sender_name: sender.name,
      sender_photo: sender.profile_photo || null
    };

    // Emit live message to recipient's socket room
    getIO().to(`user:${recipient.id}`).emit('chat:message', enrichedMessage);

    // Create persistent in-app notification in DB
    const preview = body.length > 90 ? `${body.slice(0, 87)}...` : body;
    await NotificationModel.create({
      userId: recipient.id,
      type: 'message',
      title: `Message from ${sender.name}`,
      message: preview
    });

    // Emit dedicated message notification for toast alerts and badge updates
    getIO().to(`user:${recipient.id}`).emit('message:notification', enrichedMessage);

    return res.status(201).json({ success: true, message: enrichedMessage });
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ success: false, message: 'Unable to send message' });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await ChatModel.getUnreadCount(userId(req));
    return res.json({ success: true, count });
  } catch (error) {
    console.error('Get unread count error:', error);
    return res.status(500).json({ success: false, message: 'Unable to load unread count' });
  }
};

