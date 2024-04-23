document.addEventListener("DOMContentLoaded", function () {
    let itemConversation = document.querySelectorAll('.conversation');
    itemConversation.forEach(function (item) {
        let idConversation = item.getAttribute("data-id");
        let idConversationSelected = item.getAttribute("data-id-selected");
        if (idConversation == idConversationSelected) {
            item.style.backgroundColor = 'aliceblue';
        }
        else {
            item.style.backgroundColor = '';
        }
        item.addEventListener('click', () => {
            // let idMessage = item.getAttribute("data-id-msg");
            let idUserSelected = item.getAttribute("data-id-user");
            getContentMsg(idConversation);

        });
    });

    const getContentMsg = async (idConSelected) => {
        setCookie("conversationID", btoa(idConSelected), 1);
        window.location.assign("/chat/c");
    }

});


function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}