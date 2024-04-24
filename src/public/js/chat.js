document.addEventListener("DOMContentLoaded", function () {
    let itemConversation = document.querySelectorAll('.conversation');
    itemConversation.forEach(function (item) {
        let idConversation = item.getAttribute("data-id");
        let idConversationSelected = item.getAttribute("data-id-selected");
        if (idConversation === idConversationSelected) {
            item.style.backgroundColor = 'aliceblue';
        } else {
            item.style.backgroundColor = '';
        }
        item.addEventListener('click', () => {
            const dataUserLogged = getCookie('dataUserLogged');
            if (dataUserLogged) {
                const {_id} = JSON.parse(atob(dataUserLogged));
                getContentMsg(idConversation, _id).then(r => console.log(r));
            }
        });
    });

    const getContentMsg = async (idConSelected, userLoggedID) => {
        axios.post('/chat', {
            conversationID: idConSelected,
            userLoggedID: userLoggedID
        })
            .then(function (response) {
                const {statusCode, message} = response.data;
                if (statusCode === 200) {
                    const conversationID = response.data.conversationID;
                    window.location.assign(`/chat/c/${btoa(conversationID)}`);
                } else {
                    alert(message)
                }
            })
            .catch(function (error) {
                console.log(error);
            });
    }

});


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