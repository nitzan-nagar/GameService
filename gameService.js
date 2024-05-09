import express from "express";
import cors from "cors";
import http from "http";
import { Server as socketIO } from "socket.io";

const PORT = process.env.PORT || 3001;

const app = express();
app.use(express.json());
app.use(cors());

const server = http.createServer(app);

const io = new socketIO(server, {
    cors: {
        origin: [
            "http://localhost:5173",
        ],
        methods: ["GET", "POST"]
    }
});

const userSocketMap = {};
io.on("connection", (socket) => {
    console.log(`${socket.id} is connected !`);
    
    socket.on("joinGameRoom", (room, user) => {
        socket.join(room);
        if(userSocketMap[user] !== socket.id){
            userSocketMap[user] = socket.id;
            const clientsInRoom = io.sockets.adapter.rooms.get(room);
            if (clientsInRoom.size === 2) {
                io.to(room).emit("startGame");
            }
        }
    });

    socket.on('userGaveUp', (room, user) => {
        delete userSocketMap[user];
        socket.leave(room);
        io.to(room).emit('opponentLeft', user)
    })

    socket.on("userMove", ({ row, col, opponent, activePlayer}) => {
        console.log(row, col, opponent);
        io.to(userSocketMap[opponent]).emit("opponentGameMove", {row, col, activePlayer});
    });
})
server.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});