const { Server } = require('socket.io');

const initializeSocket = (server) => {
    const io = new Server(server, {
        // Socket.IO options
    });

    io.on("connection", (socket) => {
        console.log(`connect ${socket.id}`);

        socket.on("disconnect", (reason) => {
            console.log(`disconnect ${socket.id} due to ${reason}`);
        });

        // New message
        socket.on('on-chat', data => {
            io.emit("user-chat", data)
        });
        //
        socket.on('on-update-chat', data => {
            const { message, type } = JSON.parse(data);
            console.log(type);
        });
        socket.on('user-chat', data => {
            console.log(data);
        });

    });
}

module.exports = {
    initializeSocket
};
