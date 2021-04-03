const profileID = $("#profileID").text();
////////////////////    Get Sections & Cards    //////////////////////
setSectionsHTML();
getCardsAJAX();

function setSectionsHTML() {
    const sections = $("#profile-sections").text().split(",");
    sections.forEach((section)=>{
        const predefined = (section == "project" || section == "experience" || section == "education");
        if(predefined) return;
        $("#div-create-section").before(getSectionHTML(section));
    });
}
function getCardsAJAX() {
    $("#p-loading-top").css("display", "block");
    $.ajax({
        type: "POST",
        url: "/profiles/"+profileID+"/get-cards",
        success: function (cards) {
            $("#p-loading-top").css("display", "none");
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
function getSectionHTML(sectionTitle) {
    const section = 
    '<div class="jumbotron jumbotron-fluid" style="padding: 0% 10% 2%;">'+
        '<div class="container">'+
            '<h1 class="display-5 container-h1" style="margin-bottom: 3%;">'+sectionTitle+'</h1>'+
            '<p class="lead" id="p-loading-'+sectionTitle+'" style="display: none;">Loading...</p>'+
            '<div class="row row-cols-lg-3 row-cols-md-2 row-cols-1" style="margin-bottom: 2%;">'+
                '<div class="col" id="div-create-'+sectionTitle+'"style="display:none">'+
                '</div>'+
            '</div>'+
        '</div>'+
    '</div>'+
    '<h1 class="display-4" style="text-align: center;">.......</h1>';
    return section;
}
function getCardHTML(cardID, cardUserID, title, description, datetime, url) {
    const card =
    '<div class="col">'+
        '<div class="card div-card" style="width: 100%;">'+
            '<span class="card-user-id" style="display:none;">'+cardUserID+'</span>'+
            '<div class="card-header">'+ 
                datetime +
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
