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
const form = document.querySelector("[data-post-form]");
const titleInput = form.elements.title;
const contentInput = form.elements.content;
const imageInput = document.querySelector("[data-image-input]");
const currentImage = document.querySelector("[data-current-image]");
const titleError = document.querySelector("[data-title-error]");
const contentError = document.querySelector("[data-content-error]");

async function loadPost() {
  try {
    const post = await apiRequest(`/api/posts/${postId}`);

    titleInput.value = post.title ?? "";
    contentInput.value = post.content ?? "";

    if (post.imageUrl) {
      currentImage.src = post.imageUrl;
    }
  } catch (error) {
    titleInput.value = "수정할 게시글 제목입니다.";
    contentInput.value = "수정할 게시글 내용입니다.";
  }
}

imageInput.addEventListener("change", () => {
  const [file] = imageInput.files;

  if (file) {
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

  const formData = new FormData();
  formData.append("title", titleInput.value.trim());
  formData.append("content", contentInput.value.trim());

  if (imageInput.files[0]) {
    formData.append("image", imageInput.files[0]);
  }

  try {
    await apiRequest(`/api/posts/${postId}`, {
      method: "PATCH",
      body: formData,
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
