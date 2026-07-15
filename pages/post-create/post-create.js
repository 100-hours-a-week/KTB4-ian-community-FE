import {
  apiRequest,
  initBackButton,
  initLogout,
  initProfileMenu,
  setError,
} from "../../scripts/common.js";

initProfileMenu();
initLogout();
initBackButton("../posts/posts.html");

const form = document.querySelector("[data-post-form]");
const titleInput = form.elements.title;
const contentInput = form.elements.content;
const imageInput = form.elements.image;
const titleError = document.querySelector("[data-title-error]");
const contentError = document.querySelector("[data-content-error]");

function validate() {
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

  return isValid;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!validate()) {
    return;
  }

  const userId = sessionStorage.getItem("userId") ?? "1";
  const request = {
    title: titleInput.value.trim(),
    content: contentInput.value.trim(),
  };

  if (imageInput.files[0]) {
    request.imageUrl = URL.createObjectURL(imageInput.files[0]);
  }

  try {
    const response = await apiRequest(`/api/posts/${userId}`, {
      method: "POST",
      body: JSON.stringify(request),
    });

    const postId =
      typeof response === "number"
        ? response
        : (response?.postId ?? response?.id);
    window.location.href = postId
      ? `../post-detail/post-detail.html?postId=${postId}`
      : "../posts/posts.html";
  } catch (error) {
    setError(contentInput, contentError, `*${error.message}`);
  }
});
