const FREE_API_ENDPOINT =
  "http://api.freeapi.app/api/v1/public/youtube/videos?limit=10";
const OPTIONS = { method: "GET", headers: { accept: "application/json" } };

const queryInputField = document.getElementById("query-input-field");
const themeToggleBtn = document.getElementById("theme-toggle");
const videosContainer = document.querySelector(".videos");
const tagsContainer = document.querySelector(".tags");
const searchVideoForm = document.getElementById("search-input-container");
const root = document.documentElement; // This gets the :root element

let tagsObj = {};
let tags = [];
let page = 1;
let videos = [];
let filteredVideo = [];
let activeTags = [];
let isLoading = false;

// Function to toggle theme
themeToggleBtn.addEventListener("click", () => {
  const isDark =
    getComputedStyle(root).getPropertyValue("--bg-color").trim() ===
    "rgb(0, 0, 0)";

  if (isDark) {
    // changing value of css variables
    root.style.setProperty("--bg-color", "rgb(255, 255, 255)");
    root.style.setProperty("--text-color", "rgb(0, 0, 0)");
    themeToggleBtn.classList.remove("fa-sun");
    themeToggleBtn.classList.add("fa-moon");
  } else {
    root.style.setProperty("--bg-color", "rgb(0, 0, 0)");
    root.style.setProperty("--text-color", "rgb(255, 255, 255)");
    themeToggleBtn.classList.remove("fa-moon");
    themeToggleBtn.classList.add("fa-sun");
  }
});

// will formate date according to the formate by which date should be shown on youtube video
function formateDate(date) {
  let videoPublishedDate = new Date(date).getTime();
  let currDate = Date.now();

  let difference = Math.floor(currDate - videoPublishedDate) / 1000;
  console.log(Math.floor(difference / (24 * 60 * 60 * 30 * 12)));
  let formattedDate = "";

  if (difference > 60 * 60 * 24 * 30 * 12) {
    formattedDate = `${Math.floor(difference / (60 * 60 * 24 * 30 * 12))} year`;
  } else if (difference > 60 * 60 * 24 * 30) {
    formattedDate = `${Math.floor(difference / (60 * 60 * 24 * 30))} month`;
  } else if (difference > 60 * 60 * 24) {
    formattedDate = `${Math.floor(difference / (60 * 60 * 24))} day`;
  } else if (difference > 60 * 60) {
    formattedDate = `${Math.floor(difference / (60 * 60))} hour`;
  } else if (difference > 60) {
    formattedDate = `${Math.floor(difference / 60)} minute`;
  } else {
    formattedDate = `${Math.floor(difference)} second`;
  }

  return formattedDate;
}

// this function takes an video array and then renders it on the screen
function renderVideos(videosToDisplay) {
  document.getElementById(
    "video-cnt"
  ).innerText = `showing ${videosToDisplay.length} videos`;

  videosToDisplay.forEach((video) => {
    let newVideoContainer = document.createElement("a");
    newVideoContainer.setAttribute("video-id", video.id);
    newVideoContainer.href = video.link;
    newVideoContainer.target = "_blank";
    newVideoContainer.classList.add("video");

    let viewCntString;

    if (video.viewCount > 1000000) {
      viewCntString = `${Math.abs(video.viewCount / 1000000)}m`;
    } else if (video.viewCount > 10000) {
      viewCntString = `${Math.abs(video.viewCount / 1000).toFixed(0)}k`;
    } else {
      viewCntString = video.viewCount;
    }

    // let agoTime = formateDate(Date.now());

    newVideoContainer.innerHTML = `
            <img
              src=${video.thumbnail}
              alt=""
            />

            <p class="video-title">${video.title}</p>
            <small class="channel-name">Hitesh Choudhary</small>
            <small class="video-stats">${viewCntString} views, ${formateDate(
      video.publishedAt
    )} ago</small>
        
      `;

    videosContainer.appendChild(newVideoContainer);
  });
}

// below function will initialize the project
async function initializeProject(page) {
  // below is try catch block to make sure that it is not fetching the videos from api
  try {
    const response = await fetch(`${FREE_API_ENDPOINT}&page=${page}`, OPTIONS);
    const resContent = await response.json();

    // below block is storing the data received in optimal formate and storing only required data
    resContent.data.data.map((video) => {
      videos.push({
        title: video.items.snippet.title,
        id: video.items.id,
        thumbnail:
          video.items.snippet.thumbnails.maxres.url ||
          video.items.snippet.thumbnails.default.url,
        channelTitle: video.items.snippet.channelTitle,
        viewCount: Math.abs(parseInt(video.items.statistics.viewCount)),
        link: `https://www.youtube.com/watch?v=${video.items.id}`,
        tags: video.items.snippet.tags,
        publishedAt: video.items.snippet.publishedAt,
      });
    });

    // resetting videos container and loading fetched data
    videosContainer.innerHTML = "";
    renderVideos(videos);

    //  extracting tags from videos and then formatting it like applying sorting , slicing
    for (let i = 0; i < videos.length; i++) {
      videos[i].tags?.forEach((tag) => {
        tagsObj[tag.split(" ")[0].toLowerCase()] =
          (tagsObj[tag.split(" ")[0].toLowerCase()] || 0) + 1;
      });
    }

    tags = [];
    for (let tag in tagsObj) {
      tags.push({ label: tag, cnt: tagsObj[tag] });
    }

    tags = tags
      .reverse()
      .sort((a, b) => b.cnt - a.cnt)
      .slice(0, 15);

    // resetting tags container and setting it's value
    tagsContainer.innerHTML = "";
    tags.forEach((tag) => {
      let newTagElement = document.createElement("p");
      newTagElement.classList.add("tag");
      newTagElement.setAttribute("tag", tag.label);
      newTagElement.setAttribute("isActive", false);
      newTagElement.innerText = tag.label;
      tagsContainer.appendChild(newTagElement);

      // attached an eventlistener for marking active and inactive tag
      newTagElement.addEventListener("click", () => {
        let isActiveAttr = newTagElement.getAttribute("isActive");

        if (isActiveAttr == "false") {
          newTagElement.setAttribute("isActive", true);
          newTagElement.style.background =
            getComputedStyle(root).getPropertyValue("--text-color");
          newTagElement.style.color =
            getComputedStyle(root).getPropertyValue("--bg-color");
          activeTags.push(tag.label);

          filteredVideo = [];

          for (let x = 0; x < videos.length; x++) {
            let videoTags = videos[x].tags
              ?.map((tag) => tag?.toLowerCase())
              ?.join(",");
            // console.log(videoTags);
            for (let y = 0; y < activeTags.length; y++) {
              if (
                videoTags &&
                videoTags.length > 0 &&
                videoTags.includes(activeTags[y])
              ) {
                filteredVideo.push(videos[x]);
                break;
              }
            }
          }
          // rendering the videos according to active tags
          videosContainer.innerHTML = "";
          renderVideos(filteredVideo);
        } else {
          newTagElement.setAttribute("isActive", false);
          newTagElement.style.background = "rgb(185, 185, 185)";
          newTagElement.style.color = "rgb(255, 255, 255)";
          activeTags = activeTags.filter((it) => it !== tag.label);

          filteredVideo = [];

          // checking that even if a tag is converted to inactive then are there any other active tag ? and taking action after that
          for (let x = 0; x < videos.length; x++) {
            let videoTags = videos[x].tags
              ?.map((tag) => tag?.toLowerCase())
              ?.join(",");

            for (let y = 0; y < activeTags.length; y++) {
              if (
                videoTags &&
                videoTags.length > 0 &&
                videoTags.includes(activeTags[y])
              ) {
                filteredVideo.push(videos[x]);
                break;
              }
            }
          }

          // resetting videoContainer
          videosContainer.innerHTML = "";
          if (filteredVideo.length > 0) {
            renderVideos(filteredVideo);
          } else {
            renderVideos(videos);
          }
        }
      });
    });
  } catch (error) {
    console.log(error);
  } finally {
    isLoading = false;
  }
}

// input form for search field
searchVideoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  let formData = new FormData(e.target);
  let query = formData.get("query").trim();
  filteredVideo = [];

  if (query) {
    filteredVideo = [...videos].filter((video) => {
      return video.tags
        ?.map((tag) => tag.toLowerCase())
        ?.join(",")
        .includes(query);
    });
    videosContainer.innerHTML = "";
    if (filteredVideo.length === 0) {
      let newErrorElement = document.createElement("h1");
      newErrorElement.classList.add("error-heading");
      newErrorElement.id = "error-heading";
      newErrorElement.innerText = "No Videos Found";
      videosContainer.appendChild(newErrorElement);
    }
    renderVideos(filteredVideo);
  } else {
    renderVideos(videos);
    document.getElementById("error-heading").remove();
  }
});

// for fetching more videos , when user ends bottom of the page
window.addEventListener("scroll", () => {
  // Check if we're near the bottom of the page
  if (queryInputField.value) return;
  if (activeTags.length > 0) return;

  if (
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 &&
    !isLoading
  ) {
    isLoading = true;
    page = page + 1;

    initializeProject(page);
  }
});

videosContainer.innerHTML = "";
initializeProject(page);
