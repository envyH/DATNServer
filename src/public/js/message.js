"use strict"
/**
 * Enum for common colors.
 * @readonly
 * @enum {{value: number, text: string}}
 */
const TYPE_MESSAGE = Object.freeze({
    IMAGE: { value: 0, text: "image" },
    TEXT: { value: 1, text: "text" },
    VIDEO: { value: 2, text: "video" },
    FILE: { value: 3, text: "file" }
});

const checkTypeMessage = (value) => {
    for (let key in TYPE_MESSAGE) {
        if (TYPE_MESSAGE[key].value === value) {
            return true;
        }
    }
    return false;
}

document.addEventListener("DOMContentLoaded", function () {
    const socket = io({
        // Socket.IO options
    });


    const btnChooseFile = document.getElementById('open-file');
    const btnChooseImage = document.getElementById('open-image');
    const imageInput = document.getElementById("input-image");
    const videoInput = document.getElementById("input-video");
    let numberImageUpload = 0;
    let numberVideoUpload = 0;

    const btnSendMsg = document.getElementById('btnSend');
    if (!btnSendMsg) return
    const inputMsg = document.getElementById('textMessage');
    inputMsg.addEventListener('keypress', function (event) {
        if (event.key === "Enter" && event.shiftKey) {
            event.preventDefault();
            const cursorPosition = inputMsg.selectionStart || inputMsg.value.length;
            const value = inputMsg.value;
            const textBeforeCursor = value.substring(0, cursorPosition);
            const textAfterCursor = value.substring(cursorPosition, value.length);

            inputMsg.value = `${textBeforeCursor}\n${textAfterCursor}`;
            const rows = (inputMsg.value.match(/\n/g) || []).length + 1;
            inputMsg.rows = rows < 7 ? rows : 7; // Giới hạn tối đa là 7 hàng
        }
        else if (event.key === "Enter") {
            event.preventDefault();
            btnSendMsg.click();
        }
    });
    const conversationFocus = document.getElementById('conversationFocus');
    btnSendMsg.addEventListener('click', () => {
        let conversationID = conversationFocus.getAttribute('data-id');
        if (conversationID.length <= 0) return
        let contentMsg = inputMsg.value.trim();
        if (numberImageUpload == 0 && numberVideoUpload == 0 && contentMsg.length == 0) {
            return
        } else if (numberImageUpload > 0) {
            doSendChat(conversationID, contentMsg, TYPE_MESSAGE.IMAGE.value, imageInput, null);
        } else if (numberVideoUpload > 0) {
            doSendChat(conversationID, contentMsg, TYPE_MESSAGE.VIDEO.value, null, videoInput);
        } else {
            doSendChat(conversationID, contentMsg, TYPE_MESSAGE.TEXT.value, null, null);
        }
    });

    const doSendChat = (conversationID, message, messageType, images, video) => {
        let isFakeChat = document.getElementById("fake-chat").checked;
        const dataUserLogged = getCookie("dataUserLogged");
        const token = getCookie("token");
        if (dataUserLogged === undefined || token === undefined) {
            return;
        }
        const { _id } = JSON.parse(atob(dataUserLogged));
        try {
            const formDataMsg = new FormData();
            formDataMsg.append("conversationID", conversationID);
            formDataMsg.append("senderID", _id);
            formDataMsg.append("messageType", messageType);
            formDataMsg.append("message", message);

            if (images) {
                let listImage = Array.from(images.files);
                listImage.forEach((file) => {
                    formDataMsg.append("images", file);
                });
            } else if (video) {
                formDataMsg.append("video", video.files[0]);
            }
            axios.post('/v1/api/message/create', formDataMsg, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': atob(token)
                }
            })
                .then(function (response) {
                    // console.log(response);
                    const { data } = response
                    if (data == null) return
                    const { statusCode, timestamp } = data;
                    const { image, title, content, code } = data.message;
                    if (code === "message/create-success") {
                        socket.emit('on-chat', {
                            message: data.newMessage
                        });
                        resetInput();
                    } else if (code == "auth/wrong-token") {
                        deleteAllCookies();
                        window.location.assign("/login");
                    } else {
                        console.log(`message from server: ${response}`);
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
        } catch (e) {
            console.log(error);
        }
    }

    const resetInput = () => {
        inputMsg.value = "";
        imageInput.value = "";
        videoInput.value = "";
        numberImageUpload = 0;
        numberVideoUpload = 0;
        document.getElementById('area-upload').innerHTML = '';
        inputMsg.focus();
    }

})


function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name) {
    document.cookie = name + '=; Max-Age=-99999999;';
}

function deleteAllCookies() {
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
}