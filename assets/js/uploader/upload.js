$(".step-3").hide();
$(".step-4").hide();
// The Browser API key obtained from the Google API Console.
// Replace with your own Browser API key, or your own key.

const validateDate = (id) => {
  const dcInput = document.getElementById(`dateCreated-${id}`);
  const dc = dcInput.value;
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  const dmy = `${yyyy}-${mm}-${dd}`;

  if (new Date(dc).getTime() > today.getTime()) {
    alert("The Date created must be Less than or Equal to today's date");
    dcInput.value = dmy;
    return false;
  }

  return true;
};


// Function to remove row from staging table
function removeRow(id) {
    fileStagingTable.deleteRow(id).catch(function (error) {
    });
    $("#upload-button").prop("disabled", fileStagingTable.rowManager.activeRowsCount === 0);
}



const initCategories = async () => {
  $(".category").select2({
    width: "copy",
    minimumInputLength: 3,
    containerCss: {
      border: "1px solid #ced4da",
    },
    language: {
      inputTooShort: () => 'Please enter 3 or more characters',
    },
    ajax: {
      url: "https://commons.wikimedia.org/w/api.php",
      quietMillis: 1000,
      cache: true,
      data: (query) => {
        if (!query.term.length) {
          return;
        }
        return {
          action: "opensearch",
          format: "json",
          search: query.term,
          origin: "*",
          formatversion: 2,
          namespace: 14,
          limit: 10
        };
      },
      processResults: (data) => {
        const suggestions = data[1].map((item) => ({
          text: item.split("Category:")[1],
          id: item,
        }));

        if (suggestions.length === 0) {
          suggestions.push({
            id: "Category:" + data[0],
            text: data[0]
          });
        }

        return { results: suggestions };
      }
    },
    tags: true,
    createTag: async (params) => {
      const term = $.trim(params.term);

      if (term === "") {
        return null;
      }

      return { id: term, text: term };
    }
  });
};



function changeReleaseRights(userSelection) {
  const isOwnWork = userSelection.value === "own-work";
  const id = userSelection.id.split('own-work-').slice(-1)[0];

  const author = document.getElementById(`author-${id}`);
  const authorBlock = document.getElementById(`author-block-${id}`);
  const source = document.getElementById(`source-${id}`);
  const sourceBlock = document.getElementById(`source-block-${id}`);
  const declaration = document.getElementById(`declaration-${id}`);
  const licenseField = document.getElementById(`license-${id}`);

  licenseField.value = "";

  const ownWorkLicenses = Array.from(licenseField.getElementsByClassName("own-work-license"));
  const notOwnWorkLicenses = Array.from(licenseField.getElementsByClassName("not-own-work-license"));

  if (isOwnWork) {
    const username = JSON.parse(document.getElementById('username').textContent);
    author.value = `[[User:${username} |${username}]]`;
    authorBlock.style.display = "none";

    source.value = "{{own}}";
    sourceBlock.style.display = "none";

    declaration.style.display = "block";

    notOwnWorkLicenses.forEach(element => {
      element.style.display = "none";
    });

    ownWorkLicenses.forEach(element => {
      element.style.display = "block";
    });
  } else {
    author.value = "";
    authorBlock.style.display = "block";

    source.value = "";
    sourceBlock.style.display = "block";

    declaration.style.display = "none";

    ownWorkLicenses.forEach(element => {
      element.style.display = "none";
    });

    notOwnWorkLicenses.forEach(element => {
      element.style.display = "block";
    });
  }
}


function uploadFiles() {
  const disableUploadButton = () => {
    $("#upload-button").prop("disabled", true);
    $("#upload-button i")
      .removeClass("fa-caret-right")
      .addClass("fa-spinner fa-spin");
  };

  const enableUploadButton = () => {
    $("#upload-button").prop("disabled", false);
    $("#upload-button i")
      .removeClass("fa-spinner fa-spin")
      .addClass("fa-caret-right");
  };

  const getCookie = (name) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === name + "=") {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };

  const csrfSafeMethod = (method) => /^(GET|HEAD|OPTIONS|TRACE)$/.test(method);

  const apiUrl = `${JSON.parse(
    document.getElementById("api-scheme").textContent
  )}://${JSON.parse(
    document.getElementById("api-host").textContent
  )}${JSON.parse(document.getElementById("api-url").textContent)}`;

  disableUploadButton();

  const fileStagingTableData = fileStagingTable.getData();
  const stagedImagesData = fileStagingTableData.map((tableData) => {
    const imageId = tableData["id"];
    return {
      id: imageId,
      date_created: document.getElementById(`dateCreated-${imageId}`).value,
      license: document.getElementById(`license-${imageId}`).value,
      name: document.getElementById(`title-${imageId}`).value,
      description: document.getElementById(`description-${imageId}`).value,
      author: document.getElementById(`author-${imageId}`).value,
      source: document.getElementById(`source-${imageId}`).value,
      categories: $(`#category-${imageId}`).select2("data").map(
        (category) => category.id
      ),
      location: {
        latitude: document.getElementById(`latitude-${imageId}`).value,
        longitude: document.getElementById(`longitude-${imageId}`).value,
        heading: document.getElementById(`heading-${imageId}`).value,
      },
    };
  });

  const fileData = {
    fileList: stagedImagesData,
    token: accessToken,
  };

  const csrftoken = getCookie("csrftoken");

  $.ajax({
    url: apiUrl,
    type: "POST",
    data: JSON.stringify(fileData),
    cache: false,
    processData: false,
    contentType: "application/json",
    beforeSend: (xhr, settings) => {
      if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
        xhr.setRequestHeader("X-CSRFToken", csrftoken);
      }
    },
    success: (data) => {
      $(".step-3").hide();
      $(".step-1-2").hide();
      $(".step-4").show();
      $(".results-panel").append("<tbody>");
      $(".error-panel").append("<tbody>");
      enableUploadButton();

      let successCount = 0,
        errorCount = 0;

      data.forEach((item) => {
        if (item.status === "SUCCESS") {
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

      if (successCount === 0) {
        $("#results-panel").hide();
      }

      if (errorCount === 0) {
        $("#error-panel").hide();
      }
    },
    error: () => {
      console.log("error");
      enableUploadButton();
    },
  });
}
