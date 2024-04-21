document.addEventListener("DOMContentLoaded", function () {
    const socket = io({
        // Socket.IO options
    });


    socket.emit('on-chat', {
        metadata: {
            message: "ABC",
            type: 1
        }
    });

})