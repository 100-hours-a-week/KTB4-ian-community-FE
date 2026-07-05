import {
  apiRequest,
  getQueryParam,
  initBackButton,
  initLogout,
  initProfileMenu,
  setError,
  showToast,
} from "../../scripts/common.js";

initProfileMenu();
initLogout();
initBackButton("../posts/posts.html");

const postId = getQueryParam("postId") ?? "1";
const userId = sessionStorage.getItem("userId") ?? "1";
const form = document.querySelector("[data-post-form]");
const titleInput = form.elements.title;
const contentInput = form.elements.content;
const imageInput = document.querySelector("[data-image-input]");
const currentImage = document.querySelector("[data-current-image]");
const titleError = document.querySelector("[data-title-error]");
const contentError = document.querySelector("[data-content-error]");

async function loadPost() {
  try {
    const post = await apiRequest(`/api/posts/${postId}?userId=${userId}`);
    const imageUrl = post.imageUrl ?? post.image_url;

    titleInput.value = post.title ?? "";
    contentInput.value = post.content ?? "";
    currentImage.hidden = !imageUrl;

    if (imageUrl) {
      currentImage.src = imageUrl;
    }
  } catch (error) {
    showToast(error.message);
  }
}

imageInput.addEventListener("change", () => {
  const [file] = imageInput.files;

  if (file) {
    currentImage.hidden = false;
    currentImage.src = URL.createObjectURL(file);
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  let isValid = true;

  if (!titleInput.value.trim()) {
    setError(titleInput, titleError, "*제목을 입력해주세요.");
    isValid = false;
  } else {
    setError(titleInput, titleError, "");
  }

  if (!contentInput.value.trim()) {
    setError(contentInput, contentError, "*내용을 입력해주세요.");
    isValid = false;
  } else {
    setError(contentInput, contentError, "");
  }

  if (!isValid) {
    return;
  }

  const request = {
    title: titleInput.value.trim(),
    content: contentInput.value.trim(),
  };

  if (imageInput.files[0]) {
    request.imageUrl = URL.createObjectURL(imageInput.files[0]);
  }

  try {
    await apiRequest(`/api/posts/${postId}?userId=${userId}`, {
      method: "PATCH",
      body: JSON.stringify(request),
    });

    showToast("게시글이 수정되었습니다.");
    window.setTimeout(() => {
      window.location.href =
        `../post-detail/post-detail.html?postId=${postId}`;
    }, 1000);
  } catch (error) {
    setError(contentInput, contentError, `*${error.message}`);
  }
});

loadPost();
