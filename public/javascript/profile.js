////////////////////    Get Sections & Cards    //////////////////////
setSectionsHTML();
getCardsAJAX();

function setSectionsHTML() {
    const sections = $("#user-sections").text().split(",");
    sections.forEach((section)=>{
        const predefined = (section == "project" || section == "experience" || section == "education");
        if(predefined) return;
        $("#div-create-section").before(getSectionHTML(section));
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

$("#btn-img-delete").click(function(){
    const c = confirm("Are you sure you want to delete it?");
    if(!c) return;
    $("#form-img-delete").trigger("submit");
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
////////////////////    Create/Delete Section    //////////////////////
$("#btn-create-section").click(()=>{
    let sectionTitle = $("#create-section-title").val();
    if(sectionTitle == null) {
        $("#p-create-section").css("display", "block");
        return;
    } else if(sectionTitle.length < 4) {
        $("#p-create-section").css("display", "block");
        return;
    }
    $("#p-create-section").css("display", "none");
    sectionTitle = sectionTitle.split(" ").join("-");
    $("#div-create-section").before(getSectionHTML(sectionTitle));
    pushSectionAJAX(sectionTitle);
});
function getSectionHTML(sectionTitle) {
    const section = 
    '<div class="jumbotron jumbotron-fluid" style="padding: 0% 10% 2%;">'+
        '<div class="container">'+
            '<h1 class="display-5 container-h1" style="margin-bottom: 3%;">'+sectionTitle+' <button id="'+sectionTitle+'" class="btn btn-outline-danger btn-sm btn-delete-section">Delete</button></h1>'+
            '<p class="lead" id="p-loading-'+sectionTitle+'" style="display: none;">Loading...</p>'+
            '<div class="row row-cols-lg-3 row-cols-md-2 row-cols-1" style="margin-bottom: 2%;">'+
                '<div class="col" id="div-create-'+sectionTitle+'">'+
                    '<div id="card-create-'+sectionTitle+'" class="card div-card" style="width: 100%;">'+
                        '<div class="card-body">'+
                            '<form action="">'+
                                '<input    id="title-'+sectionTitle+'"          class="form-control input-card-title"           type="text" placeholder="Title" required>'+
                                '<textarea id="description-'+sectionTitle+'"    class="form-control textarea-card-description"  rows="3" placeholder="Description" required></textarea>'+
                                '<input    id="datetime-'+sectionTitle+'"       class="form-control input-card-datetime"        type="text" placeholder="Date and Time" required>'+
                                '<input    id="url-'+sectionTitle+'"            class="form-control input-card-url"             type="url" placeholder="Link" required>'+
                                '<p id="p-invalid-'+sectionTitle+'" class="p-invalid-inputs">Error</p>'+
                                '<button   id="'+sectionTitle+'" class="btn btn-primary btn-card-create" type="button">Create</button>'+
                            '</form>'+
                        '</div>'+
                    '</div>'+
                '</div>'+
            '</div>'+
        '</div>'+
    '</div>';
    return section;
}
function pushSectionAJAX(sectionTitle) {
    $.ajax({
        type: "POST",
        url: "/profile/create-section/"+sectionTitle,
        error: function (xhr, status, error) {
            console.log("Error: \n"+ error.message);
        },
    });
}
$(document).on("click", ".btn-delete-section", function(){
    const c = confirm("Are you sure you want to delete it?");
    if(!c) return;
    const id = $(this).attr("id");
    $(this).parent().parent().parent().remove();
    $.ajax({
        type: "POST",
        url: "/profile/delete-section/"+id,
        error: function(xhr, status, error) {
            console.log("Error: \n"+ error.message);
        },
    }); 
});
////////////////////    Create/Delete Card    //////////////////////
$(document).on("click", ".btn-card-create", function() {
    onCreateCard($(this).attr("id"));
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
    const card =
    '<div class="col">'+
        '<div class="card div-card" style="width: 100%;">'+
            '<span class="card-user-id" style="display:none;">'+cardUserID+'</span>'+
            '<div class="card-header">'+ 
                '<div class="row">'+
                    '<div class="col-9" style="text-align: left">'+
                        datetime +
                    '</div>'+
                    '<div class="col-1">'+
                        '<button id="'+ cardID +'" class="btn btn-outline-danger btn-sm btn-card-delete">delete</button>'+
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
$(document).on("click", ".btn-card-delete", function(){
    const c = confirm("Are you sure you want to delete it?");
    if(!c) return;
    const id = $(this).attr("id");
    $(this).parent().parent().parent().parent().parent().remove();
    $.ajax({
        type: "POST",
        url: "/profile/delete-card/"+id,
        success: function() {},
        error: function(xhr, status, error) {
            console.log("Error: \n"+ error.message);
        },
    }); 
});