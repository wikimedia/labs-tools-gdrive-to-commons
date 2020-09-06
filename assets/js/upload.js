$(".step-3").hide();
$(".step-4").hide();
// The Browser API key obtained from the Google API Console.
// Replace with your own Browser API key, or your own key.

var developerKey = JSON.parse(document.getElementById("developer-key").textContent);
var clientId = JSON.parse(document.getElementById("client-id").textContent);
var appId = JSON.parse(document.getElementById("google-app-id").textContent);

var scope = ["https://www.googleapis.com/auth/drive.readonly"];

var pickedFiles = [];
var pickerApiLoaded = false;
var oauthToken;
var fileStagingTable;

function TDate(id) {
  var dc = document.getElementById(`dateCreated-` + id).value;
  var Today = new Date();
  var dd = Today.getDate();
  var mm = Today.getMonth() + 1; //January is 0!
  var yyyy = Today.getFullYear();
  if (dd < 10) {
    dd = "0" + dd;
  }
  if (mm < 10) {
    mm = "0" + mm;
  }
  var dmy = yyyy + "-" + mm + "-" + dd;
  if (new Date(dc).getTime() > Today.getTime()) {
    alert("The Date created must be Less than or Equal to today's date");
    document.getElementById(`dateCreated-` + id).value = dmy;
    return;
  }
  return true;
}

// Function to remove row from staging table
function removeRow(id) {
  fileStagingTable.deleteRow(id).catch(function (error) {
  });
}

// Use the Google API Loader script to load the google.picker script.
function onGoogleUploadButtonClick() {
  gapi.load("auth", {"callback": onAuthApiLoad});
  gapi.load("picker", {"callback": onPickerApiLoad});
}

function onAddMore() {
  gapi.load("picker", {"callback": onPickerApiLoad});
}

function onAuthApiLoad() {
  window.gapi.auth.authorize(
    {
      "client_id": clientId,
      "scope": scope,
      "immediate": false,
    },
    handleAuthResult
  );
}

function onPickerApiLoad() {
  pickerApiLoaded = true;
  createPicker();
}

function handleAuthResult(authResult) {
  if (authResult && !authResult.error) {
    oauthToken = authResult.access_token;
    createPicker();
  }
}

// Create and render a Picker object for searching images.
function createPicker() {
  if (pickerApiLoaded && oauthToken) {
    var view = new google.picker.DocsView().setIncludeFolders(true);
    view.setMimeTypes("image/jpeg,image/jpg,image/gif,image/png,image/bmp");
    view.setParent("root");
    var picker = new google.picker.PickerBuilder()
      .enableFeature(google.picker.Feature.NAV_HIDDEN)
      .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
      .setAppId(appId)
      .setOAuthToken(oauthToken)
      .addView(view)
      .addView(new google.picker.DocsUploadView())
      .setDeveloperKey(developerKey)
      .setCallback(pickerCallback)
      .build();
    picker.setVisible(true);
  }
}

function generateGdriveThumbNailLink(itemId) {
  return `https://drive.google.com/thumbnail?authuser=0&sz=w200-h200&id=${itemId}`;
}

function initCategories() {

  $(".category").select2({
    "width": "copy",
    "containerCss": {
      "border": "1px solid #ced4da",
    },
    "ajax": {
      "url": "https://commons.wikimedia.org/w/api.php",
      "quietMillis": 1000,
      "cache": true,
      "data": function (query) {
        let params = {
          "action": "opensearch",
          "format": "json",
          "search": query.term,
          "origin": "*",
          "formatversion": 2,
          "namespace": 14,
          "limit": 10
        }
        return params;
      },
      "processResults": function (data) {
        let suggestions = [];
        for (let x = 0; x < data[1].length; x++) {
          suggestions.push({
            "text": data[1][x].split("Category:")[1],
            "id": data[1][x],
          });
        }

        if (suggestions.length == 0) {
          suggestions.push({
            "id": "Category:" + data[0],
            "text": data[0]
          });
        }

        return {"results": suggestions};
      }
    },
    "tags": true,
    "createTag": async function (params) {
      let term = $.trim(params.term);

      if (term == "") {
        return null;
      }

      return {"id": term, "text": term};
    }
  });
}

// A simple callback implementation.
function pickerCallback(data) {
  if (data.action == google.picker.Action.PICKED) {
    if (fileStagingTable !== undefined) {
      let new_files = [];
      data.docs.forEach((item) =>
        new_files.push({
          "name": item.name,
          "id": item.id,
        }));
      fileStagingTable.addData(new_files);
    } else {
      data.docs.forEach((item) =>
        pickedFiles.push({
          "name": item.name,
          "id": item.id,
        }));

      $(".step-3").show();
      $(".step-1-2").hide();

      fileStagingTable = new Tabulator("#picked-files-table", {
        "data": pickedFiles,
        "layout": "fitColumns",
        "headerSort": false,
        "responsiveLayout": "collapse",

        "resizableColumns": false,
        "rowFormatter": function (row) {
          var element = row.getElement();
          var data = row.getData();
          var width = element.offsetWidth;
          var rowTable;
          var cellContents;
          let username = JSON.parse(document.getElementById("username").textContent);

          //clear current row data
          if (element.id != "row" + data.id)
            while (element.firstChild) element.removeChild(element.firstChild);

          //define a table layout structure and set width of row
          rowTable = document.createElement("table");
          element.id = "row" + data.id;
          rowTable.style.width = "100%";

          rowTabletr = document.createElement("tr");

          //add image on left of row
          cellContents = "<td>";
          cellContents += `<img width='200' src='${generateGdriveThumbNailLink(data.id)}' alt="Image"></td>`;
          cellContents += `<td><div><strong>Image title*</strong><input class='form-control' id='title-${data.id}' type='text' value='${data.name}' required ></div>`;
          cellContents += `<div><strong>Description*</strong><textarea class='form-control' id='description-${data.id}' type='text' value='${data.description}' required></textarea></div>`;

          cellContents += "<div><strong>Release rights*</strong><br/>";
          cellContents += `<input  type='radio' id='own-work-${data.id}' name='release_rights${data.id}' value='own-work' onclick='changeReleaseRights(this);'>\n`;
          cellContents += `<label for='own-work-${data.id}'>This file is my own work.</label><br/>`;
          cellContents +=
            `<div class='alert alert-dark' id='declaration-${data.id}' role='alert' style='display:none;'>
                    <p style='padding: 5px 10px;'>I, ${username}, the copyright holder of this work, irrevocably grant anyone the right to use this work under the license selected below.</p></div>`;
          cellContents += `<input type='radio' id='not-own-work-${data.id}' name='release_rights${data.id}'  value='not-own-work' onclick='changeReleaseRights(this);' checked>\n`;
          cellContents += `<label for='not-own-work-${data.id}'>This file is not my own work.</label>`;
          cellContents += "</div>";

          cellContents +=
            `<div id='author-block-${data.id}' ><strong>Author*</strong><input class='form-control' id='author-${data.id}' type='text' required></div>`;
          cellContents +=
            `<div id='source-block-${data.id}'><strong>Source*</strong><input class='form-control' id='source-${data.id}' type='text' required></div>`;

          cellContents +=
            "<div><strong>License*</strong>" +
            `<select name="wpLicense" id="license-${data.id}" class="form-control" required>
            <option title="none" value="">None selected</option>
            <option class="own-work-license" title="self|cc-by-sa-4.0" value="self|cc-by-sa-4.0" style="display: none;">
                Creative Commons Attribution ShareAlike 4.0
            </option>
            <option class="own-work-license" title="self|cc-by-sa-3.0" value="self|cc-by-sa-3.0" style="display: none;">
                Creative Commons Attribution ShareAlike 3.0
            </option>
            <option class="own-work-license" title="self|cc-by-4.0" value="self|cc-by-4.0" style="display: none;">
                Creative Commons Attribution 4.0
            </option>
            <option class="own-work-license" title="self|cc-by-3.0" value="self|cc-by-3.0" style="display: none;">
                Creative Commons Attribution 3.0
            </option>
            <option class="own-work-license" title="self|Cc-zero" value="self|Cc-zero" style="display: none;">
                Creative Commons CC0 Waiver (release all rights, like public domain)
            </option>
            <option class="not-own-work-license" disabled="disabled" style="color: GrayText" value="">
                I know the license
            </option>
            <option class="not-own-work-license" title="cc-by-sa-4.0" value="cc-by-sa-4.0">
                Creative Commons Attribution ShareAlike 4.0
            </option>
            <option class="not-own-work-license" title="cc-by-sa-3.0" value="cc-by-sa-3.0">
                Creative Commons Attribution ShareAlike 3.0
            </option>
            <option class="not-own-work-license" title="cc-by-sa-2.5" value="cc-by-sa-2.5">
                Creative Commons Attribution ShareAlike 2.5
            </option>
            <option class="not-own-work-license" title="cc-by-4.0" value="cc-by-4.0">
                Creative Commons Attribution 4.0
            </option>
            <option class="not-own-work-license" title="cc-by-3.0" value="cc-by-3.0">
                Creative Commons Attribution 3.0
            </option>
            <option class="not-own-work-license" title="cc-by-2.5" value="cc-by-2.5">
                Creative Commons Attribution 2.5
            </option>
            <option class="not-own-work-license" title="Cc-zero" value="Cc-zero">
                Creative Commons CC0 Waiver (release all rights, like public domain)
            </option>
            <option class="not-own-work-license" title="FAL" value="FAL">
                Free Art License
            </option>
            <option class="not-own-work-license" title="subst:template 2|flickrreview|subst:uwl"
                    value="subst:template 2|flickrreview|subst:uwl">
                Image from Flickr and I do not know the license
            </option>
            <option class="not-own-work-license" title="subst:template 2|cc-by-sa-2.0|flickrreview"
                    value="subst:template 2|cc-by-sa-2.0|flickrreview">
                Uploaded to Flickr under Creative Commons
                Attribution ShareAlike 2.0
            </option>
            <option class="not-own-work-license" title="subst:template 2|cc-by-2.0|flickrreview"
                    value="subst:template 2|cc-by-2.0|flickrreview">
                Uploaded to Flickr under Creative Commons
                Attribution 2.0
            </option>
            <option class="not-own-work-license" disabled="disabled" style="color: GrayText;" value="">
                Public domain:
            </option>
            <option class="not-own-work-license" title="PD-old-100" value="PD-old-100">
                Author died more than 100 years ago
            </option>
            <option class="not-own-work-license" title="PD-old-100-1923" value="PD-old-100-1923">
                Author died more than 100 years ago AND the work was
                published before 1923
            </option>
            <option class="not-own-work-license" title="PD-old-70-1923" value="PD-old-70-1923">
                Author died more than 70 years ago AND the work was published
                before 1923
            </option>
            <option class="not-own-work-license" title="PD-old-70|Unclear-PD-US-old-70" value="PD-old-70|Unclear-PD-US-old-70">
                Author died more than 70 years ago BUT the work was published
                after 1923
            </option>
            <option class="not-own-work-license" title="PD-Art" value="PD-Art">
                Reproduction of a painting or other 2D work that is in the
                public domain because of its age â€“ needs specification after
                uploading
            </option>
            <option class="not-own-work-license" title="PD-US" value="PD-US">
                First published in the United States before 1923
            </option>
            <option class="not-own-work-license" title="PD-US-no notice" value="PD-US-no notice">
                First published in the United States between 1923 and 1977
                without a copyright notice
            </option>
            <option class="not-own-work-license" title="PD-USGov" value="PD-USGov">
                Original work of the US Federal Government
            </option>
            <option class="not-own-work-license" title="PD-USGov-NASA" value="PD-USGov-NASA">
                Original work of NASA
            </option>
            <option class="not-own-work-license" title="PD-USGov-Military-Navy" value="PD-USGov-Military-Navy">
                Original work of the US Military Navy
            </option>
            <option class="not-own-work-license" title="PD-ineligible" value="PD-ineligible">
                Too simple to be copyrighted
            </option>
            <option class="not-own-work-license" title="subst:Template 2|PD-textlogo|Trademarked"
                    value="subst:Template 2|PD-textlogo|Trademarked">
                Logo with only simple text (wordmark)
            </option>
            <option class="not-own-work-license" disabled="disabled" style="color: GrayText;" value="">
                Other alternatives:
            </option>
            <option class="not-own-work-license" title="subst:uwl" value="subst:uwl">
                I don't know what the license is
            </option>
            <option class="not-own-work-license" title="Copyrighted free use" value="Copyrighted free use">
                Copyrighted, but may be used for any purpose, including commercially
            </option>
            <option class="not-own-work-license" title="Attribution" value="Attribution">
                May be used for any purpose, including commercially, if the
                copyright holder is properly attributed
            </option>
          </select>` +
            "</div>";
          cellContents +=
            "<div><strong>Date work was created or first published*</strong> " +
            `<input class="form-control" type="date" name="dateCreated" id="dateCreated-${data.id}" onchange="TDate('${data.id}')" required />` +
            "</div>";

          cellContents +=
            `<strong>Category</strong>\n<select class='form-control category' id='category-${data.id}' multiple='multiple'></select>`;

          cellContents += "<div class='row' style='margin: 0;'>";
          cellContents +=
            `<div class='col-xs-12 col-md-4'><strong>Latitude</strong><input class='form-control' id='latitude-${data.id}' type='number' placeholder='0.0' step='1' min='0' max='360'></div>`;
          cellContents +=
            `<div class='col-xs-12 col-md-4'><strong>Longitude</strong><input class='form-control' id='longitude-${data.id}' type='number' placeholder='0.0' step='1' min='0' max='360'></div>`;
          cellContents +=
            `<div class='col-xs-12 col-md-4'><strong>Heading</strong><input class='form-control' id='heading-${data.id}' type='number' placeholder='0.0' step='1' min='0' max='360'></div>`;
          cellContents += "</div>";

          cellContents +=
            `<div><button type='button' class='btn btn-danger' onclick='removeRow("${data.id}")' >Delete</button></div>`;
          cellContents += "</td>";

          rowTabletr.innerHTML = cellContents;
          rowTable.appendChild(rowTabletr);
          element.append(rowTable);
        },
        "columns": [
          {
            "title": "<div class='row'>" +
              "<div class='tabulator-col col-auto mr-auto'  style='align-self: center;'>\n" +
              "<h4>Selected Files</h4>" +
              "</div>" +
              "<div class='tabulator-col col-auto'>" +

              "<button class='btn btn-primary text-uppercase' type='button' onclick='onAddMore()' style='width:" +
              " 10em;'>Add " +
              "<i class='fas fa-plus'></i>" +
              "</button>" +
              "</div>" +
              "</div>",
            "responsive": 0,
          },
        ],
      });
      fileStagingTable.setData(pickedFiles);
    }
  }
  initCategories();
}

function changeReleaseRights(userSelection) {
  let isOwnWork = userSelection.value == "own-work";

  let id = userSelection.id.split('own-work-').slice(-1)[0];
  let author = document.getElementById("author-" + id);
  let authorBlock = document.getElementById("author-block-" + id);
  let source = document.getElementById("source-" + id);
  let sourceBlock = document.getElementById("source-block-" + id);
  let declaration = document.getElementById("declaration-" + id);

  let licenseField = document.getElementById('license-' + id);
  licenseField.value = "";

  let ownWorkLicenses = Array.from(licenseField.getElementsByClassName("own-work-license"));
  let notOwnWorkLicenses = Array.from(licenseField.getElementsByClassName("not-own-work-license"));

  if (isOwnWork) {
    let username = JSON.parse(document.getElementById('username').textContent);
    author.value = "[[User:" + username + " |" + username + "]]";
    authorBlock.style.display = "none";

    source.value = "{{own}}";
    sourceBlock.style.display = "none";

    declaration.style.display = "block";

    notOwnWorkLicenses.forEach(function (element) {
      element.style.display = "none";
    })

    ownWorkLicenses.forEach(function (element) {
      element.style.display = "block";
    });

  } else {

    author.value = "";
    authorBlock.style.display = "block";

    source.value = "";
    sourceBlock.style.display = "block";

    declaration.style.display = "none";

    ownWorkLicenses.forEach((element) => {
      element.style.display = "none";
    });

    notOwnWorkLicenses.forEach((element) => {
      element.style.display = "block";
    });

  }
}

function uploadFiles() {
  // Disable the button first.
  $("#upload-button").prop("disabled", true);
  $("#upload-button i")
    .removeClass("fa-caret-right")
    .addClass("fa-spinner fa-spin");


  let tableData = fileStagingTable.getData();
  let stagedImagesData = [];

  for (var x = 0; x < tableData.length; x++) {
    let imageId = tableData[x]["id"];
    stagedImagesData.push(
      {
        "id": imageId,
        "date_created": document.getElementById(`dateCreated-${imageId}`).value,
        "license": document.getElementById(`license-${imageId}`).value,
        "name": document.getElementById(`title-${imageId}`).value,
        "description": document.getElementById(`description-${imageId}`).value,
        "author": document.getElementById(`author-${imageId}`).value,
        "source": document.getElementById(`source-${imageId}`).value,
        "categories": $('#category-' + imageId).select2('data').map(
          function (category) {
            return category["id"];
          }),
        "location": {
          "latitude": document.getElementById(`latitude-${imageId}`).value,
          "longitude": document.getElementById(`longitude-${imageId}`).value,
          "heading": document.getElementById(`heading-${imageId}`).value,
        }
      }
    );
  };

  var fileData = {
    "fileList": stagedImagesData,
    "token": oauthToken,
  };

  function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      var cookies = document.cookie.split(";");
      for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].trim();
        // Does this cookie string begin with the name we want?
        if (cookie.substring(0, name.length + 1) === name + "=") {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  var csrftoken = getCookie("csrftoken");

  function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return /^(GET|HEAD|OPTIONS|TRACE)$/.test(method);
  }


  function enableUploadButton() {
    $("#upload-button").prop("disabled", false);
    $("#upload-button i")
      .removeClass("fa-spinner fa-spin")
      .addClass("fa-caret-right");
  }

  let apiScheme = JSON.parse(document.getElementById('api-scheme').textContent),
    apiHost = JSON.parse(document.getElementById('api-host').textContent),
    apiPath = JSON.parse(document.getElementById('api-url').textContent),
    apiUrl = apiScheme + "://" + apiHost + apiPath;

  console.log(apiUrl);


  $.ajax({
    // prettier-ignore
    "url": apiUrl,
    "type": "POST",
    "data": JSON.stringify(fileData),
    "cache": false,
    "processData": false,
    "contentType": "application/json",
    "beforeSend": function (xhr, settings) {
      if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
        xhr.setRequestHeader("X-CSRFToken", csrftoken);
      }
    },
    "success": function (data) {
      $(".step-3").hide();
      $(".step-1-2").hide();
      $(".step-4").show();
      $(".results-panel").append("<tbody>");
      $(".error-panel").append("<tbody>");
      enableUploadButton();

      let successCount = 0, errorCount = 0;

      data.forEach(function (item) {
        if (item.status == "SUCCESS") {
          successCount++;
          $(".results-panel").append(
            `<tr><td><img src='${item.details.url}' style='width: 50px;' alt="Image"></td><td>${item.name}</td><td><a href='${item.details.descriptionurl}' target='_blank'>Show uploaded file</a></td></tr>`
          );
        } else {
          errorCount++;
          $(".error-panel").append(
            `<tr><td><img src='${generateGdriveThumbNailLink(item.id)}' style='width: 50px;' alt="Image"></td><td>${item.name}</td><td>${item.details}</td></tr>`
          );

        }
      });


      $(".results-panel").append("</tbody>");
      $(".error-panel").append("</tbody>");

      if (successCount == 0) {
        $("#results-panel").hide();
      }

      if (errorCount == 0) {
        $("#error-panel").hide();

      }


    },
    "error": function () {
      console.log("error");
      enableUploadButton();
    },
  });
}