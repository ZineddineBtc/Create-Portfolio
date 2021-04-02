////////////////////    Get Sections & Cards    //////////////////////
setSectionsHTML();
getCardsAJAX();

function setSectionsHTML() {
    const sections = $("#user-sections").text().split(",");
    sections.forEach((section)=>{
        const predefined = (section == "project" || section == "experience" || section == "eduction");
        if(predefined) return;
        createSectionHTML(section);
    });
}
function getCardsAJAX() {
    $.ajax({
        type: "POST",
        url: "/profile/get-cards",
        success: function (cards) {
             fillCards(cards);
        },
        error: function (xhr, status, error) {
            console.log("Error: \n"+ error.message);
        },
    });
}
function fillCards(cards){
    cards.forEach((card)=>{
        $("#div-create-"+card.section).after(
            getCardHTML(card._id, card.userID, card.title, card.description, card.datetime, card.url)
        );
    });
}
function createSectionHTML(section) {
}
////////////////////    Update Name & Bio    //////////////////////
let editable = false;
let previousName = $("#h3-name").text();
$("#input-name").val(previousName);
let previousBio = $("#textarea-bio").val();
if(previousBio === ""){
    $("#textarea-bio").attr("placeholder", "Please fill in a bio");
}
$("#btn-edit-save").click(function(){
    $("#textarea-bio").attr("disabled", editable);
    if(editable) {
        updateNameAndBio(
            getToUpdate(),
            $("#input-name").val(),
            $("#textarea-bio").val()
        );  
    } 
    adjustUI();
    editable = !editable;
});
function adjustUI() {
    if(editable) {
        $("#btn-edit-save").text("Edit");
        $("#input-name").css("display", "none");
        $("#h3-name").css("display", "");
    } else {
        $("#btn-edit-save").text("Save");
        $("#h3-name").css("display", "none");
        $("#input-name").css("display", "");
    }
}
function getToUpdate() {
    let u = "update"
    if(previousName !== $("#input-name").val())
        u += "-name";
    if(previousBio !== $("#textarea-bio").val())
        u += "-bio";
    return u;
}
function updateNameAndBio(toUpdate, name, bio){
    previousName = name;
    $("#input-name").val(previousName);
    $("#h3-name").text(previousName);
    previousBio = bio;
    $.ajax({
        url: "profile/update/"+ toUpdate +"/"+ name +"/"+ bio,
        type: "POST",
        contentType: "application/json",
        success: function(data){}
    });
}

////////////////////    Image Update/Delete    //////////////////////
let imgBtnsDisplayed = false;
$(".img-profile").click(function(){
    if(imgBtnsDisplayed) {
        $("#div-img-btns").css("display", "none");
    } else {
        $("#div-img-btns").css("display", "");
    }
    imgBtnsDisplayed = !imgBtnsDisplayed;
})

$("#btn-img-update").click(function(){
    $("#image").focus().trigger("click");
});

$("#image").change(function(){
    if(!extensionAndSizeChecked()) return;
    console.log($("#image").val());
    $("#form-img-update").trigger("submit");
});

let extension;
function extensionAndSizeChecked(){
    if(!$("#image").val()) {
        alert("Please select a profile picture");
        return false;
    }
    const acceptableExtensions = ["jpeg", "jpg", "png"];
    const imagePath = $("#image").val();
    extension = imagePath.split(".")[imagePath.split(".").length-1];
    if (acceptableExtensions.includes(extension)) {
        const fileSize = $("#image")[0].files[0].size/1024/1024;
        if(fileSize < 5) {
            return true;
        } else {
            alert("Size should not exceed 5 MiB");
            $("#image").val("");
            return false;
        }
    } else {
        alert("Please upload a picture (JPEG, JPG, PNG) exclusively");
        $("#image").val("");
        return false;
    }
}
////////////////////    Create card    //////////////////////
$("#btn-create-project").click(()=>{
    onCreateCard("project");
});
function onCreateCard(section) {
    let title = $("#title-"+ section).val();
    let description = $("#description-"+ section).val();
    let datetime = $("#datetime-"+ section).val();
    let url = $("#url-"+ section).val();
    let inputCheck = areInputsValid(title, description, datetime, url);
    if(!inputCheck.isValid){
        $("#p-invalid-"+ section).text(inputCheck.errorMessage);
        $("#p-invalid-"+ section).css("display", "block");
        return;
    } 
    $("#p-project").css("display", "none");
    pushCard(section, title, description, datetime, url);
    emptyInputs(section);
}
function areInputsValid(title, description, datetime, url) {
    errorMessage = "";
    let errorBool = false;
    if(title == null) {
        errorMessage += "Title: at least 10 characters\n";
        errorBool = false;
    } else if(title.length < 10) {
        errorMessage += "Title: at least 10 characters\n";
        errorBool = true;
    }
    
    if(description == null) {
        errorMessage +=  "Description: At least 50 characters\n";
        errorBool = true;
    } else if(description.length < 50) {
        errorMessage +=  "Description: At least 50 characters\n";
        errorBool = true;
    }
    
    if(datetime == null) {
        errorMessage += "Date and time must be selected\n";
        errorBool = true;
    } else if(datetime.length == 0) {
        errorMessage += "Date and time must be selected\n";
        errorBool = true;
    } 
    
    if(url == null) {
        errorMessage += "Link must be specified\n";
        errorBool = true;
    } else if(url.length == 0) {
        errorMessage += "Link must be specified\n";
        errorBool = true;
    }
    check = {
        errorMessage: errorMessage,
        isValid: !errorBool
    }
    return check;
}
function pushCard(section, title, description, datetime, url) {
    const newCard = {
        section: section,
        title: title,
        description: description,
        datetime: datetime,
        url: url
    };
    pushCardToDB(newCard);
}
function pushCardToDB(newCard) {
    $("#p-loading").css("display", "block");
    $.ajax({
        type: "POST",
        url: "/profile/create-card",
        data: newCard,
        success: function (IDs) {
            $("#p-loading").css("display", "none");
            $("#div-create-"+newCard.section).after(
                getCardHTML(IDs.cardID, IDs.cardUserID, 
                    newCard.title, newCard.description, 
                    newCard.datetime, newCard.url)
            );
        },
        error: function (xhr, status, error) {
            console.log("Error: \n"+ error.message);
        },
    });
}
function getCardHTML(cardID, cardUserID, title, description, datetime, url) {
    let card =
    '<div class="col">'+
        '<div class="card div-card" style="width: 100%;">'+
            '<span class="card-user-id" style="display:none;">'+cardUserID+'</span>'+
            '<div class="card-header">'+ 
                '<div class="row">'+
                    '<div class="col-9" style="text-align: left">'+
                        datetime +
                    '</div>'+
                    '<div class="col-1">'+
                        '<button id="'+ cardID +'" class="btn btn-outline-danger btn-sm btn-delete-project">delete</button>'+
                    '</div>'+
                '</div>'+
            '</div>'+
            '<div class="card-body">'+
                '<h5 class="card-title">'+ title +'</h5>'+
                '<p class="card-text">'+ 
                    description +
                '</p>'+
            '</div>'+
            '<div class="card-footer">'+ 
                '<a href="//'+url+'" class="card-link" target="_blank" rel="noopener noreferrer" style="text-decoration: none"> Link </a>'+
            '</div>'+
        '</div>'+
    '</div>';

    return card;
}
function emptyInputs(section){
    $("#title-"+section).val("");
    $("#description-"+section).val("");
    $("#datetime-"+section).val("");
    $("#url-"+section).val("");
}