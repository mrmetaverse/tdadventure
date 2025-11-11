import { NextApiRequest, NextApiResponse } from 'next';
import { Server } from 'socket.io';

let io: Server;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    if (!io) {
      const server = res.socket.server;
      io = new Server(server);

      io.on('connection', (socket) => {
        console.log('A user connected');

        socket.on('disconnect', () => {
          console.log('User disconnected');
        });

        // Handle game state updates and other events here
      });
    }
    res.status(200).json({ message: 'WebSocket connection established' });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}