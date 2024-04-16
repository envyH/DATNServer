document.addEventListener("DOMContentLoaded", function () {
    let confirmDeleteCate = new bootstrap.Modal(document.getElementById('confirmDeleteCate'));


    //let deleteCate = document.querySelectorAll('.deleteCate');
    let updateCate = document.querySelectorAll('.updateCate');

    // DELETE
    // deleteCate.forEach(function (button) {
    //     button.addEventListener('click', function () {
    //         const categoryID = this.getAttribute('data-id');
    //         const categoryName = this.getAttribute('data-name');
    //         let nameCateDelete = document.getElementById('nameCateDelete');
    //         displayModal(nameCateDelete, categoryName);
    //         let confirmDelete = document.getElementById('confirmDelete');
    //         confirmDelete.addEventListener('click', () => {
    //             deleteCategory(categoryID, null);
    //         })
    //     })
    // })
    // UPDATE
    updateCate.forEach(function (button) {
        button.addEventListener('click', function () {
            const categoryID = this.getAttribute('data-id');
            getCategoryByID(categoryID);
        })
    })
});

function displayModal(nameCateDelete, categoryName) {
    nameCateDelete.style.display = 'flex'
    let nameTag = document.createElement('p');
    nameTag.textContent = `${categoryName}`;
    nameTag.style.fontWeight = 'bold';
    let msgTag = document.createElement('p');
    msgTag.innerHTML = '&nbsp;&nbsp;' + 'khỏi danh sách.';
    nameCateDelete.appendChild(nameTag);
    nameCateDelete.appendChild(msgTag);
}

function displayModalUpdate(dataCate) {
    let idCate = document.getElementById('idCateUpdate');
    let nameCate = document.getElementById('nameCateUpdate');
    let imageCateOld = document.getElementById('imageOld');
    let dateCate = document.getElementById('dateCateUpdate');

    idCate.value = dataCate._id;
    imageCateOld.src = dataCate.img;
    nameCate.value = dataCate.name;
    dateCate.value = dataCate.create_time;

    // let imageCate = document.getElementById('imageNew');
    // imageCate.src = dataCate.img;

}
function getCategoryByID(categoryID) {
    let xhr = new XMLHttpRequest();
    let endPoint = "/stech.manager/get-cate";
    xhr.open('POST', endPoint, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({ idCate: categoryID }));

    xhr.onload = function () {
        if (xhr.status === 200) {
            let myData = JSON.parse(xhr.response);
            switch (myData.code) {
                case "GET_SUCCESS":
                    let dataCate = myData.dataCategoryByID
                    displayModalUpdate(dataCate)
                    break;

                default:
                    console.log(xhr.responseText);
                    break;
            }
        }
    };
}
function deleteCategory(categoryID, message) {
    // console.log(`param message: ${message}`);
    // Tạo một đối tượng XMLHttpRequest để gửi dữ liệu đến server
    let xhr = new XMLHttpRequest();
    let endPoint = "/stech.manager/delete-cate";
    xhr.open('POST', endPoint, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({ idCate: categoryID, message }));

    // Xử lý phản hồi từ server
    xhr.onload = function () {
        if (xhr.status === 200) {
            let myData = JSON.parse(xhr.response);
            console.log(`CODE: ${myData.code}`);
            switch (myData.code) {
                case "CATEGORY_USED":
                    let text = "Thể loại này đang được sử dụng.\nBạn có chắc chắn muốn xoá";
                    if (confirm(text) === true) {
                        // delete
                        text = "Vẫn xoá"
                        deleteCategory(categoryID, myData.message);
                        return;
                    }
                    else {
                        // cancel
                        text = "Huỷ xoá";
                        window.location.reload();
                    }
                    console.log(text);
                    break;
                case "SUCCESS":
                    window.location.reload();
                    break;
                default:
                    window.location.reload();
                    break;
            }
        } else if (xhr.status === 400) {
            console.log(xhr.responseText);
        } else {
            console.log(`status: ${xhr.status}`);
            // window.location.reload();
        }
    };
}

function previewImagePlus(event, _fileInput, _imageForm, _imagePreview) {
    let imageTagNew = document.getElementById('imageTagNew');
    let imageTagOld = document.getElementById('imageTagOld');
    let btnRest = document.getElementById('resetImage');

    const fileInput = document.getElementById(_fileInput);
    const imageForm = document.getElementById(_imageForm);
    const imagePreview = document.getElementById(_imagePreview);

    const selectedFile = fileInput.files[0];
    if (selectedFile) {
        const reader = new FileReader();
        reader.onload = function (e) {
            imagePreview.src = e.target.result;
            imageForm.style.display = "block";
            imagePreview.style.display = ""
            imageTagOld.style.display = ''
            imageTagNew.style.display = ''
            btnRest.style.display = 'block'

            btnRest.addEventListener('click', () => {
                fileInput.value = "";
                imagePreview.src = "";
                imageForm.style.display = "";
                imagePreview.style.display = "none"
                imageTagOld.style.display = 'none'
                imageTagNew.style.display = 'none'
                btnRest.style.display = 'none'
            })
        };
        reader.readAsDataURL(selectedFile);
    } else {
        imagePreview.src = "";
        imageForm.style.display = "";
        imagePreview.style.display = "none"
        imageTagOld.style.display = 'none'
        imageTagNew.style.display = 'none'
        btnRest.style.display = 'none'
    }
}
