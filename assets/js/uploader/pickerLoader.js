let tokenClient;
let accessToken = null;
let pickerInited = false;
let gisInited = false;
let picker;

const API_KEY = JSON.parse(document.getElementById("developer-key").textContent);
const CLIENT_ID = JSON.parse(document.getElementById("client-id").textContent);
const APP_ID = JSON.parse(document.getElementById("google-app-id").textContent);

const SCOPE = "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.photos.readonly";



// Use the Google API Loader script to load the google.picker script.
function onGoogleUploadButtonClick() {
    tokenClient.callback = async (response) => {
        if (response.error !== undefined) {
            throw (response);
        }
        accessToken = response.access_token;
        await createPicker();
    };

    if (accessToken === null) {
        // Prompt the user to select a Google Account and ask for consent to share their data
        // when establishing a new session.
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        // Skip display of account chooser and consent dialog for an existing session.
        tokenClient.requestAccessToken({prompt: ''});
    }
}

function onAddMore() {
    picker.setVisible(true);
}

/**
 * Callback after Google Identity Services are loaded.
 */
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: '', // defined later
        error_callback: (error) => {
          console.log(error, error);
        }
    });
    gisInited = true;
}

function gapiLoaded() {
    gapi.load('client:picker', initializePicker);
}

async function initializePicker() {
    await gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');
    pickerInited = true;
}
// Create and render a Picker object for searching images.
function createPicker() {
    const view = new google.picker.View(google.picker.ViewId.DOCS);
    view.setMimeTypes("image/jpeg,image/jpg,image/gif,image/png,image/bmp");
    picker = new google.picker.PickerBuilder()
        .enableFeature(google.picker.Feature.NAV_HIDDEN)
        .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
        .setDeveloperKey(API_KEY)
        .setAppId(APP_ID)
        .setOAuthToken(accessToken)
        .addView(view)
        .addView(new google.picker.DocsUploadView())
        .setCallback(pickerCallback)
        .build();
    picker.setVisible(true);
}

function generateGdriveThumbNailLink(itemId) {
    return `https://drive.google.com/thumbnail?authuser=0&sz=w200-h200&id=${itemId}`;
}


async function pickerCallback(data) {
    if (data.action === google.picker.Action.PICKED) {
        if (fileStagingTable !== undefined) {
            let new_files = [];
            data.docs.forEach((item) =>
                new_files.push({
                    "name": item.name,
                    "id": item.id,
                }));
            fileStagingTable.addData(new_files);
            $("#upload-button").prop("disabled", fileStagingTable.rowManager.activeRowsCount === 0);
        } else {
            data.docs.forEach((item) =>
                pickedFiles.push({
                    "name": item.name,
                    "id": item.id,
                }));

            $(".step-3").show();
            $(".step-1-2").hide();

            createFileStagingTable();
        }
    }
    await initCategories();
}

function createFileStagingTable() {
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
                        `<input class="form-control" type="date" name="dateCreated" id="dateCreated-${data.id}" onchange="validateDate('${data.id}')" required />` +
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
