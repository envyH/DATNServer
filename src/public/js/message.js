"use strict"
/**
 * Enum for common colors.
 * @readonly
 * @enum {{value: number, text: string}}
 */
const TYPE_MESSAGE = Object.freeze({
    IMAGE: {value: 0, text: "image"},
    TEXT: {value: 1, text: "text"},
    VIDEO: {value: 2, text: "video"},
    FILE: {value: 3, text: "file"}
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
    const areaMessage = document.getElementById('areaMessage');
    if (areaMessage) {
        areaMessage.scrollTop = areaMessage.scrollHeight
    }

    const socket = io({
        // Socket.IO options
    });

    socket.on('user-chat', (data) => {
        // console.log(data);
        const {conversation_id, message, message_type, sender_id, status, created_at} = data;
        const dataUserLogged = getCookie("dataUserLogged");
        const {_id} = JSON.parse(atob(dataUserLogged));
        let time = created_at.slice(created_at.length - 8, created_at.length - 3);

        let isFakeChat = document.getElementById("fake-chat").checked;
        if (isFakeChat) {
            displayMessageLeft(_id, message, message_type, time);
        } else {
            // console.log(sender_id, _id);
            if (_id === sender_id) {
                displayMessageRight(_id, message, message_type, time);
            } else {
                displayMessageLeft(_id, message, message_type, time);
            }
        }
        if (areaMessage) {
            areaMessage.scrollTop = areaMessage.scrollHeight
        }
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
        } else if (event.key === "Enter") {
            event.preventDefault();
            btnSendMsg.click();
        }
    });
    const conversationFocus = document.getElementById('conversationFocus');
    btnSendMsg.addEventListener('click', () => {
        let conversationID = conversationFocus.getAttribute('data-id');
        if (conversationID.length <= 0) return
        let contentMsg = inputMsg.value.trim();
        if (numberImageUpload === 0 && numberVideoUpload === 0 && contentMsg.length === 0) {

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
        const {_id} = JSON.parse(atob(dataUserLogged));
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
                    const {data} = response
                    if (data == null) return
                    const {statusCode, timestamp, code} = data;
                    const {image, title, content} = data.message;
                    if (code === "message/create-success") {
                        socket.emit('on-chat', data.newMessage);
                        resetInput();
                    } else if (code === "auth/wrong-token") {
                        eraseCookie("dataUserLogged");
                        eraseCookie("token");
                        eraseCookie("typeLogin");
                        window.location.assign("/login");
                    } else {
                        console.log(`message from server: ${response}`);
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
        } catch (e) {
            console.log(e);
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


    const displayMessageRight = (id, message, messageType, time, images, video,) => {
        let rightChatWrapper = document.createElement('div');
        rightChatWrapper.classList.add('d-flex', 'flex-row-reverse', 'mb-2');

        let rightChatMessage = document.createElement('div');
        rightChatMessage.classList.add('right-chat-message', 'fs-13');

        let rightChatAction = document.createElement('div');
        rightChatAction.classList.add('active-message-right');

        let messageAction = document.createElement('div');
        messageAction.classList.add('mb-0', 'mr-2', 'pr-1');
        messageAction.innerHTML = `
                            <div class="d-flex flex-row fs-6">
                                <i class="chat-action-right-trigger bx bx-dots-vertical-rounded chat-trigger" id='chat-trigger'>
                                    <div class="chat-action-right" id='chat-action-right'>
                                        <div class="d-flex flex-column">
                                            <a id='remove-msg' class="px-4 py-2 fs-3 remove-msg" data-id=${id}>Remove</a>
                                            <a id='forward-msg' class="px-4 py-2 fs-3 forward-msg" data-id=${id}>Forward</a>
                                        </div>
                                    </div>
                                </i>
                            </div>
                            `

        rightChatAction.appendChild(messageAction);
        // Tạo nội dung của tin nhắn bên phải
        let messageContent = document.createElement('div');
        messageContent.classList.add('mb-0', 'mr-3', 'pr-4', 'pb-2');

        // text
        if (messageType === TYPE_MESSAGE.TEXT.value) {
            messageContent.innerHTML = '<div class="d-flex flex-row">' +
                `<div class="pr-2">${message}</div></div>`;
        } else if (messageType === TYPE_MESSAGE.IMAGE.value) {
            // if (images.length == 1) {
            messageContent.innerHTML = '<div class="d-flex flex-row"><div>' +
                `<img class="pr-6 mb-2" src=${message} width="150" height="100" alt="img" style='border-radius: 8px;'>` +
                '</div></div>';
            // }
            // more image
            // else if (images.length > 1) {
            //     let startDiv = `<div class="d-flex flex-row"><div>`;
            //     let imageDiv = '';
            //     let endDiv = `</div></div>`;
            //     images.forEach(image => {
            //         imageDiv += `<img class="pr-1 mb-2" src=${image} width="80" height="70" alt="img" style='border-radius: 8px;'>`;
            //     });
            //     let viewImage = startDiv + imageDiv + endDiv;
            //     messageContent.innerHTML = viewImage;
            // }
        } else if (messageType === TYPE_MESSAGE.VIDEO.value) {
            let startDiv = `<div class="d-flex flex-row"><div>`;
            let endDiv = `</div></div>`;
            let videoDiv = `<video class="pr-6 mb-2" src=${message} width="200" type='video/mp4' controls='' style='border-radius: 8px;'>`;

            messageContent.innerHTML = startDiv + videoDiv + endDiv;
        }

        rightChatMessage.appendChild(messageContent);

        // Tạo các tùy chọn của tin nhắn bên phải
        let messageOptions = document.createElement('div');
        messageOptions.classList.add('message-options', 'dark', 'mt-3');

        let messageTime = document.createElement('div');
        messageTime.classList.add('message-time');
        messageTime.innerHTML = '<div class="d-flex flex-row">' +
            `<div class="mr-2">${time}</div>` +
            '<div class="svg15 double-check"></div>' +
            '</div>';
        messageOptions.appendChild(messageTime);

        let messageArrow = document.createElement('div');
        messageArrow.classList.add('message-arrow');
        messageArrow.innerHTML = '<i class="text-muted la la-angle-down fs-17"></i>';
        messageOptions.appendChild(messageArrow);

        rightChatMessage.appendChild(messageOptions);

        // Đặt tin nhắn bên phải vào bọc div mới
        rightChatWrapper.appendChild(rightChatMessage);
        rightChatWrapper.appendChild(rightChatAction);

        // Chèn tin nhắn bên phải vào phần chat panel
        let chatPanel = document.querySelector('.chat-panel-scroll');
        if (chatPanel) {
            let chatPanelContent = chatPanel.querySelector('.p-3');
            if (chatPanelContent) {
                chatPanelContent.appendChild(rightChatWrapper);
            }
        }
    };

    const displayMessageLeft = (id, message, messageType, time, images, video) => {
        let leftChatMessage = document.createElement('div');
        leftChatMessage.classList.add('left-chat-message', 'fs-13', 'mb-2', 'pb-2');

        // Tạo nội dung của tin nhắn bên trái
        let messageContent = document.createElement('p');
        if (messageType === TYPE_MESSAGE.TEXT.value) {
            messageContent.classList.add('mb-0', 'mr-3', 'pr-4');
            messageContent.textContent = `${message}`;
        } else if (messageType === TYPE_MESSAGE.IMAGE.value) {
            messageContent = document.createElement('img');
            messageContent.classList.add('mb-0', 'mr-1', 'mt-1', 'pr-4');
            messageContent.src = message;
            messageContent.style.width = '150px';
            messageContent.style.height = '100px';
            messageContent.style.borderRadius = '8px';
        }
        // else if (images.length > 1) {
        //     const imagesContainer = document.createElement('div');
        //     messageContent = document.createElement('img');
        //     images.forEach(image => {
        //         const imageElement = document.createElement('img');
        //         imageElement.classList.add('mb-0', 'mr-1', 'mt-1', 'pr-1');
        //         imageElement.src = image;
        //         imageElement.style.width = '80px';
        //         imageElement.style.height = '70px';
        //         imageElement.style.borderRadius = '8px';

        //         imagesContainer.appendChild(imageElement);
        //     });

        //     messageContent = imagesContainer;
        // }

        leftChatMessage.appendChild(messageContent);

        let messageOptions = document.createElement('div');
        messageOptions.classList.add('message-options', 'mt-3');

        let messageTime = document.createElement('div');
        messageTime.classList.add('message-time');

        messageTime.textContent = `${time}`;
        messageOptions.appendChild(messageTime);

        let messageArrow = document.createElement('div');
        messageArrow.classList.add('message-arrow');
        messageArrow.innerHTML = '<i class="text-muted la la-angle-down fs-17"></i>';
        messageOptions.appendChild(messageArrow);

        leftChatMessage.appendChild(messageOptions);

        // Chèn tin nhắn bên phải vào phần chat panel
        let chatPanel = document.querySelector('.chat-panel-scroll');
        if (chatPanel) {
            let chatPanelContent = chatPanel.querySelector('.p-3');
            if (chatPanelContent) {
                chatPanelContent.appendChild(leftChatMessage);
            }
        }
    };

    const emojis = ['🎆', '🎇', '🧨', '🎉', '🎊', '🧧', '🎎',
        '😀', '😎', '😁', '😂', '🤣', '😃', '😄', '😋', '😊', '😉', '😆', '😅', '😍', '😘', '🥰',
        '😗', '😙', '🥲', '🤔', '🤩', '🤗', '🙂', '😚', '🫡', '🤨', '😐', '😑', '😶', '🫥', '😮',
        '😥', '😣', '😏', '🙄', '😶‍🌫️', '🤐', '😯', '😪', '😫', '🥱', '😴', '😒', '🤤', '😝', '😜',
        '😛', '😌', '😓', '😔', '😕', '🫤', '🙃', '🫠', '😞', '😖', '🙁', '☹️', '😲', '🤑', '😟',
        '😤', '😢', '😭', '😦', '😧', '😰', '😮‍💨', '😬', '🤯', '😩', '😨', '😱', '🥵', '🥶', '😳',
        '🤪', '😵', '😷', '🤬', '😡', '😠', '🥴', '😵‍💫', '🤒', '🤕', '🤢', '🤮', '🤧', '😇', '🤡',
        '🤠', '🥹', '🥺', '🥸', '🥳', '🤥', '🫨', '🤫', '🤭', '🫢', '🫣', '👺', '👹', '👿', '😈',
        '🤓', '🧐', '💀', '☠️', '👻', '👽', '👾', '🤖', '😼', '😻', '😹', '😸', '😺', '💩', '😽',
        '🙀', '😿', '😾', '🙈', '🙉', '🙊', '🐵', '🐶', '🐺', '🐱', '🦁', '🐯', '🦒', '🦊', '🦝',
        '🐮', '🐷', '🐗', '🐭', '🐹', '🐰', '🐻', '🐻‍❄️', '🐨', '🐼', '🐸', '🦓', '🐴', '🫎', '🫏',
        '🦄', '🐔', '🐲', '🐽', '🐾', '🐒', '🦍', '🦧', '🦮', '🐕‍🦺', '🐩', '🐕', '🐈', '🐈‍⬛', '🐅',
        '🐆', '🐎', '🦌', '🦬', '🦏', '🦛', '🐂', '🐃', '🐄', '🐖', '🐏', '🐑', '🐐', '🐪', '🐫',
        '🦙', '🦘', '🦥', '🦨', '🦡', '🐘', '🦣', '🐁', '🐀', '🦔', '🐇', '🐿️', '🦫', '🦎', '🐊',
        '🐢', '🐍', '🐉', '🦕', '🦖', '🦦', '🦈', '🐬', '🦭', '🐳', '🐋', '🐟', '🐠', '🐡', '🦐',
        '🦑', '🐙', '🦞', '🦀', '🐚', '🪸', '🪼', '🦆', '🐓', '🦃', '🦅', '🕊️', '🦢', '🦜', '🪽',
        '🐦‍⬛', '🪿', '🦩', '🦚', '🦉', '🦤', '🪶', '🐦', '🐧', '🐥', '🐤', '🐣', '🦇', '🦋', '🐌',
        '🐛', '🦟', '🪰', '🪱', '🦗', '🐜', '🪳', '🐝', '🪲', '🐞', '🦂', '🕷️', '🕸️', '🦠', '🧞‍♀️',
        '🧞‍♂️', '🧞', '🧟‍♀️', '🧟‍♂️', '🧟', '🧌', '🗣️', '👤', '👥', '🫂', '👁️', '👀', '🦴', '🦷', '👅',
        '👄', '🫦', '🧠', '🫀', '🫁', '🦾', '🦿', '👣', '🤺', '⛷️'
    ];
    const emojiTable = document.getElementById('emoji-table');
    emojis.forEach(emoji => {
        const span = document.createElement('span');
        span.textContent = emoji;
        emojiTable.appendChild(span);

        span.addEventListener('click', () => {
            inputMsg.value += emoji;
        })
    });


    document.addEventListener('click', function (event) {
        const areaEmoji = document.getElementById('area-emoji');
        const areaUpload = document.getElementById('area-upload');

        const isClickInsideEmojiTable = emojiTable.contains(event.target);
        const isClickIconEmoji = document.getElementById('emoji-trigger').contains(event.target);
        const isClickIconUpload = document.getElementById('upload-trigger').contains(event.target);

        if (!isClickInsideEmojiTable) {
            if (!isClickIconEmoji) {
                areaEmoji.classList.remove('active');
            }
            if (!isClickIconUpload) {
                areaUpload.classList.remove('active');
            }
        }
    });


    function handleImageUpload(event) {
        const areaImageUpload = document.getElementById('area-upload');
        const imgUpload = document.getElementById('img-upload');

        const maxFilesToShow = 1;
        const selectedFiles = event.target.files;
        let length = selectedFiles.length;
        if (length > maxFilesToShow) {
            alert(`Chọn tối đa ${maxFilesToShow} ảnh`);
            return
        }

        areaImageUpload.innerHTML = '';

        for (let i = 0; i < selectedFiles.length; i++) {
            if (i >= maxFilesToShow) {
                break;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                const imgContainer = document.createElement('div');
                imgContainer.style.position = 'relative';

                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.width = '150px';
                img.style.height = '150px';
                // img.style.marginRight = '2px';

                const removeIcon = document.createElement('div');
                removeIcon.style.position = 'absolute';
                removeIcon.style.top = '2px';
                removeIcon.style.left = '4px';
                removeIcon.style.fontSize = '18px';

                const removeButton = document.createElement('i');
                removeButton.classList.add('bx', 'bxs-x-circle', 'bx-tada-hover');
                removeButton.id = 'remove-upload';
                removeButton.style.cursor = 'pointer';

                removeIcon.appendChild(removeButton);
                imgContainer.appendChild(removeIcon);
                imgContainer.appendChild(img);
                areaImageUpload.appendChild(imgContainer);

                removeButton.addEventListener('click', function () {
                    imgContainer.remove();
                });
            };
            reader.readAsDataURL(selectedFiles[i]);
            // areaImageUpload.scrollIntoView();
        }

        if (selectedFiles.length > 0) {
            areaImageUpload.style.display = 'block';
        } else {
            areaImageUpload.style.display = 'none';
        }
    }

    function handleVideoUpload(event) {
        const areaVideoUpload = document.getElementById('area-upload');
        const selectedVideo = event.target.files[0];
        areaVideoUpload.innerHTML = '';
        if (selectedVideo) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const videoContainer = document.createElement('div');

                const video = document.createElement('video');
                video.src = e.target.result;
                video.controls = true;
                video.autoplay = true;
                video.style.width = '320px';
                // video.style.height = '240px';

                const removeIcon = document.createElement('div');
                removeIcon.style.marginLeft = '10px';

                const removeButton = document.createElement('i');
                removeButton.classList.add('bx', 'bxs-x-circle', 'bx-tada-hover');
                removeButton.id = 'remove-upload';
                removeButton.style.cursor = 'pointer';

                removeIcon.appendChild(removeButton);
                videoContainer.appendChild(removeIcon);
                videoContainer.appendChild(video);
                areaVideoUpload.appendChild(videoContainer);

                removeButton.addEventListener('click', function () {
                    videoContainer.remove();
                    areaVideoUpload.innerHTML = '';
                });
            };
            reader.readAsDataURL(selectedVideo);
            // areaVideoUpload.scrollIntoView();
        }
        if (selectedVideo) {
            areaVideoUpload.style.display = 'block';
        } else {
            areaVideoUpload.style.display = 'none';
        }
    }
})


function getCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name) {
    document.cookie = name + '=; Max-Age=-99999999;';
}
